import express from 'express';
import {
  createBooking,
  getVenueBookingsAvailability,
  processPayment,
  getBookingReceipt,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/venue/:venueId/availability', getVenueBookingsAvailability);

router.route('/')
  .post(protect, authorize('organizer'), createBooking);

router.post('/:id/pay', protect, processPayment);
router.get('/:id/receipt', protect, getBookingReceipt);

export default router;