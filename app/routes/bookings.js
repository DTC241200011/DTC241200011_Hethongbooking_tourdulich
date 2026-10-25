const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');
const { tourBookingsTotal } = require('../metrics');

// Process booking form submission
router.post('/create', async (req, res, next) => {
  try {
    const {
      tour_id,
      customer_name,
      customer_email,
      customer_phone,
      departure_date,
      adults_count,
      children_count,
      notes
    } = req.body;

    const tourIdInt = parseInt(tour_id, 10);
    const adults = parseInt(adults_count, 10) || 1;
    const children = parseInt(children_count, 10) || 0;

    const tour = await db.getTourById(tourIdInt);
    if (!tour) {
      return res.status(404).render('error', { title: 'Lỗi', message: 'Không tìm thấy tour cần đặt.' });
    }

    // Pricing: children are charged 70% of adult price
    const adultPrice = parseFloat(tour.price);
    const childPrice = adultPrice * 0.7;
    const totalPrice = (adults * adultPrice) + (children * childPrice);

    const booking = await db.createBooking({
      tour_id: tourIdInt,
      customer_name,
      customer_email,
      customer_phone,
      departure_date,
      adults_count: adults,
      children_count: children,
      total_price: totalPrice,
      notes
    });

    // Metric recording
    tourBookingsTotal.inc({ tour_name: tour.title, status: 'PENDING' });

    // Structured Log
    logger.info(`New Tour Booking created: Code ${booking.booking_code}`, {
      booking_code: booking.booking_code,
      tour_id: tour.id,
      tour_title: tour.title,
      customer_name,
      customer_email,
      customer_phone,
      total_price: totalPrice,
      party_size: adults + children
    });

    res.redirect(`/bookings/success/${booking.booking_code}`);
  } catch (err) {
    logger.error('Failed to process tour booking:', { error: err.message, stack: err.stack });
    next(err);
  }
});

// Booking success confirmation page
router.get('/success/:code', async (req, res, next) => {
  try {
    const bookingCode = req.params.code;
    const booking = await db.getBookingByCode(bookingCode);
    if (!booking) {
      return res.status(404).render('error', { title: 'Không tìm thấy đơn đặt', message: 'Mã đặt chỗ không tồn tại.' });
    }

    res.render('booking-success', {
      title: `Đặt Tour Thành Công #${booking.booking_code} - VietTour`,
      booking
    });
  } catch (err) {
    next(err);
  }
});

// Lookup booking by code (search form)
router.get('/lookup', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.render('lookup', { title: 'Tra Cứu Đơn Đặt Tour', booking: null, searched: false });
    }

    const booking = await db.getBookingByCode(code.trim().toUpperCase());
    res.render('lookup', {
      title: `Tra Cứu Đơn Đặt Tour - ${code}`,
      booking,
      searched: true,
      searchCode: code
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

