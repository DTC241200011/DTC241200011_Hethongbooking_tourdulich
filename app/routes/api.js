const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

// GET all tours API
router.get('/tours', async (req, res) => {
  try {
    const tours = await db.getAllTours(req.query);
    res.json({ success: true, count: tours.length, data: tours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single tour API
router.get('/tours/:id', async (req, res) => {
  try {
    const tour = await db.getTourById(parseInt(req.params.id, 10));
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.json({ success: true, data: tour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create tour
router.post('/tours', async (req, res) => {
  try {
    const tour = await db.createTour(req.body);
    logger.info(`Admin created new tour: ${tour.title} (ID: ${tour.id})`);
    res.status(201).json({ success: true, data: tour });
  } catch (err) {
    logger.error('API create tour failed:', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update tour
router.put('/tours/:id', async (req, res) => {
  try {
    const tourId = parseInt(req.params.id, 10);
    const tour = await db.updateTour(tourId, req.body);
    logger.info(`Admin updated tour ID ${tourId}`);
    res.json({ success: true, data: tour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE tour
router.delete('/tours/:id', async (req, res) => {
  try {
    const tourId = parseInt(req.params.id, 10);
    await db.deleteTour(tourId);
    logger.info(`Admin deactivated tour ID ${tourId}`);
    res.json({ success: true, message: 'Tour deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const booking = await db.updateBookingStatus(bookingId, status);
    logger.info(`Admin updated booking #${booking.booking_code} status to [${status}]`);
    res.json({ success: true, data: booking });
  } catch (err) {
    logger.error(`Failed to update booking status for ID ${req.params.id}:`, { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// System Stats API
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

