const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./logger');
const db = require('./db');
const { register, httpRequestsTotal, httpRequestDuration } = require('./metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Prometheus Metrics Middleware
app.use((req, res, next) => {
  if (req.path === '/metrics' || req.path === '/healthz' || req.path.startsWith('/css') || req.path.startsWith('/js')) {
    return next();
  }

  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationSeconds = duration[0] + duration[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);

    // Structured logging for every request
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(logLevel, `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${Math.round(durationSeconds * 1000)}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationSeconds * 1000),
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  });

  next();
});

// Helper for views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };
  res.locals.formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    await db.pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      service: 'tour-booking-web',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Application Routes
const indexRoutes = require('./routes/index');
const toursRoutes = require('./routes/tours');
const bookingsRoutes = require('./routes/bookings');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/tours', toursRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy trang',
    message: `Trang '${req.originalUrl}' không tồn tại trên hệ thống.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Application Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(err.status || 500).render('error', {
    title: 'Lỗi Hệ Thống (500)',
    message: err.message || 'Đã có sự cố xảy ra trong quá trình xử lý yêu cầu của bạn.'
  });
});

// Start Server after connecting to Database
async function startServer() {
  logger.info('Starting Tour Booking Application (De 20 - DTC241200011 Phi Duc Phi)...');
  await db.checkConnection();

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Tour Booking Web Server is listening on http://0.0.0.0:${PORT}`);
    logger.info(`Prometheus Metrics available at http://0.0.0.0:${PORT}/metrics`);
    logger.info(`Health check available at http://0.0.0.0:${PORT}/healthz`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

