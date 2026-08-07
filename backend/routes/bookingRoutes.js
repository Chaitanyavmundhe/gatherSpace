import express from 'express';
import { createBooking } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('organizer'), createBooking);

export default router;