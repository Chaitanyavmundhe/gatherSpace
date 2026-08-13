import express from 'express';
import {
  createVenue,
  getVenuesInRadius,
  getMyVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('lister'), createVenue);

router.route('/radius/:longitude/:latitude/:distance')
  .get(getVenuesInRadius);

// IMPORTANT: '/my' must be declared before '/:id' or Express will treat
// "my" as an :id parameter and route it into getVenueById instead.
router.route('/my')
  .get(protect, authorize('lister'), getMyVenues);

router.route('/:id')
  .get(getVenueById)
  .put(protect, authorize('lister'), updateVenue)
  .delete(protect, authorize('lister'), deleteVenue);

export default router;