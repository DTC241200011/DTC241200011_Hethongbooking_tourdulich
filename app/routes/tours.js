const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');

// Tour list page
router.get('/', async (req, res, next) => {
  try {
    const { destination, maxPrice, search } = req.query;
    const tours = await db.getAllTours({ destination, maxPrice, search });
    res.render('tours', {
      title: 'Danh Sách Tour Du Lịch Hấp Dẫn - VietTour',
      tours,
      filters: { destination, maxPrice, search }
    });
  } catch (err) {
    next(err);
  }
});

// Tour details page
router.get('/:id', async (req, res, next) => {
  try {
    const tourId = parseInt(req.params.id, 10);
    if (isNaN(tourId)) {
      return res.status(400).render('error', { title: 'Lỗi', message: 'Mã tour không hợp lệ' });
    }

    const tour = await db.getTourById(tourId);
    if (!tour) {
      return res.status(404).render('error', { title: 'Không tìm thấy tour', message: 'Tour du lịch này không tồn tại hoặc đã ngừng hoạt động.' });
    }

    res.render('tour-detail', {
      title: `${tour.title} - Chi Tiết Lịch Trình & Đặt Chỗ`,
      tour
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

