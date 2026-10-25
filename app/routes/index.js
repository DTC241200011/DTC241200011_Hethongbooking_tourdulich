const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

// Home page
router.get('/', async (req, res, next) => {
  try {
    const { destination, maxPrice, search } = req.query;
    const tours = await db.getAllTours({ destination, maxPrice, search });
    const stats = await db.getDashboardStats();

    res.render('index', {
      title: 'Hệ Thống Đặt Tour Du Lịch Trực Tuyến - VietTour',
      tours,
      stats,
      filters: { destination, maxPrice, search }
    });
  } catch (err) {
    next(err);
  }
});

// Admin dashboard
router.get('/admin', async (req, res, next) => {
  try {
    const stats = await db.getDashboardStats();
    const bookings = await db.getAllBookings();
    const tours = await db.getAllTours();

    res.render('admin', {
      title: 'Quản Trị Hệ Thống - VietTour Booking',
      stats,
      bookings,
      tours
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

