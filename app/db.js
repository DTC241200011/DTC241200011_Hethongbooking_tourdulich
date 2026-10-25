const { Pool } = require('pg');
const logger = require('./logger');
const { dbQueryDuration, tourActiveCount } = require('./metrics');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'tour_admin',
  password: process.env.DB_PASSWORD || 'TourSecurePass2024!',
  database: process.env.DB_NAME || 'tour_booking_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Instrumented query method
async function query(text, params = [], operationName = 'generic_query') {
  const start = process.hrtime();
  try {
    const res = await pool.query(text, params);
    const duration = process.hrtime(start);
    const durationSeconds = duration[0] + duration[1] / 1e9;
    dbQueryDuration.observe({ operation: operationName }, durationSeconds);
    return res;
  } catch (err) {
    logger.error(`Database Query Error [${operationName}]: ${err.message}`, {
      query: text,
      params,
      error: err.stack
    });
    throw err;
  }
}

// Check DB Connection with retry
async function checkConnection(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
      logger.info(`Connected to PostgreSQL successfully on attempt ${i}`, {
        database: res.rows[0].db_name,
        time: res.rows[0].current_time
      });
      await updateActiveToursMetric();
      return true;
    } catch (err) {
      logger.warn(`PostgreSQL connection attempt ${i}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      if (i === retries) {
        logger.error('Could not connect to PostgreSQL after max retries.');
        return false;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Update Active Tours Gauge
async function updateActiveToursMetric() {
  try {
    const res = await pool.query('SELECT COUNT(*) as count FROM tours WHERE is_active = true');
    const count = parseInt(res.rows[0].count, 10);
    tourActiveCount.set(count);
  } catch (err) {
    logger.warn('Failed to update tour active count metric:', err.message);
  }
}

// Database helper functions
const db = {
  pool,
  query,
  checkConnection,
  updateActiveToursMetric,

  // Tours
  async getAllTours(filters = {}) {
    let sql = 'SELECT * FROM tours WHERE is_active = true';
    const params = [];
    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (title ILIKE $${params.length} OR destination ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }
    if (filters.destination) {
      params.push(`%${filters.destination}%`);
      sql += ` AND destination ILIKE $${params.length}`;
    }
    if (filters.maxPrice) {
      params.push(filters.maxPrice);
      sql += ` AND price <= $${params.length}`;
    }
    sql += ' ORDER BY featured DESC, created_at DESC';
    const res = await query(sql, params, 'get_all_tours');
    return res.rows;
  },

  async getTourById(id) {
    const tourRes = await query('SELECT * FROM tours WHERE id = $1', [id], 'get_tour_by_id');
    if (tourRes.rows.length === 0) return null;
    const tour = tourRes.rows[0];

    // Get itinerary
    const itinRes = await query(
      'SELECT * FROM itineraries WHERE tour_id = $1 ORDER BY day_number ASC',
      [id],
      'get_tour_itinerary'
    );
    tour.itinerary = itinRes.rows;
    return tour;
  },

  async createTour(tourData) {
    const { title, destination, duration, price, max_participants, image_url, description, departure_location, transport, featured } = tourData;
    const res = await query(
      `INSERT INTO tours (title, destination, duration, price, max_participants, image_url, description, departure_location, transport, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, destination, duration, price, max_participants || 30, image_url, description, departure_location, transport || 'Xe du lịch đời mới / Máy bay', featured || false],
      'create_tour'
    );
    await updateActiveToursMetric();
    return res.rows[0];
  },

  async updateTour(id, tourData) {
    const { title, destination, duration, price, max_participants, image_url, description, departure_location, transport, featured, is_active } = tourData;
    const res = await query(
      `UPDATE tours SET 
        title = $1, destination = $2, duration = $3, price = $4, max_participants = $5,
        image_url = $6, description = $7, departure_location = $8, transport = $9,
        featured = $10, is_active = $11, updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [title, destination, duration, price, max_participants, image_url, description, departure_location, transport, featured, is_active, id],
      'update_tour'
    );
    await updateActiveToursMetric();
    return res.rows[0];
  },

  async deleteTour(id) {
    const res = await query('UPDATE tours SET is_active = false WHERE id = $1 RETURNING *', [id], 'soft_delete_tour');
    await updateActiveToursMetric();
    return res.rows[0];
  },

  // Bookings
  async createBooking(bookingData) {
    const { tour_id, customer_name, customer_email, customer_phone, departure_date, adults_count, children_count, notes, total_price } = bookingData;
    const bookingCode = 'BK' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);

    const res = await query(
      `INSERT INTO bookings 
        (booking_code, tour_id, customer_name, customer_email, customer_phone, departure_date, adults_count, children_count, total_price, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
       RETURNING *`,
      [bookingCode, tour_id, customer_name, customer_email, customer_phone, departure_date, adults_count || 1, children_count || 0, total_price, notes || null],
      'create_booking'
    );
    return res.rows[0];
  },

  async getBookingByCode(bookingCode) {
    const res = await query(
      `SELECT b.*, t.title as tour_title, t.destination, t.duration, t.image_url, t.price as tour_unit_price
       FROM bookings b
       JOIN tours t ON b.tour_id = t.id
       WHERE b.booking_code = $1`,
      [bookingCode],
      'get_booking_by_code'
    );
    return res.rows[0];
  },

  async getAllBookings() {
    const res = await query(
      `SELECT b.*, t.title as tour_title, t.destination
       FROM bookings b
       LEFT JOIN tours t ON b.tour_id = t.id
       ORDER BY b.created_at DESC`,
      [],
      'get_all_bookings'
    );
    return res.rows;
  },

  async updateBookingStatus(id, status) {
    const res = await query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id],
      'update_booking_status'
    );
    return res.rows[0];
  },

  // Stats for Admin Dashboard
  async getDashboardStats() {
    const toursCountRes = await query('SELECT COUNT(*) FROM tours WHERE is_active = true', [], 'stats_tours_count');
    const bookingsCountRes = await query('SELECT COUNT(*) FROM bookings', [], 'stats_bookings_count');
    const revenueRes = await query("SELECT COALESCE(SUM(total_price), 0) as total_rev FROM bookings WHERE status != 'CANCELLED'", [], 'stats_revenue');
    const pendingCountRes = await query("SELECT COUNT(*) FROM bookings WHERE status = 'PENDING'", [], 'stats_pending_count');

    return {
      activeTours: parseInt(toursCountRes.rows[0].count, 10),
      totalBookings: parseInt(bookingsCountRes.rows[0].count, 10),
      totalRevenue: parseFloat(revenueRes.rows[0].total_rev),
      pendingBookings: parseInt(pendingCountRes.rows[0].count, 10)
    };
  }
};

module.exports = db;

