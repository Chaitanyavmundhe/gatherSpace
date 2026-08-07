import express from 'express';
import { createVenue, getVenuesInRadius } from '../controllers/venueController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('lister'), createVenue);

router.route('/radius/:longitude/:latitude/:distance')
  .get(getVenuesInRadius);

export default router;