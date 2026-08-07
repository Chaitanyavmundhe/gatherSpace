import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';

// @desc    Create new venue booking (Atomic Transaction & Double-Booking Prevention)
// @route   POST /api/v1/bookings
// @access  Private (Organizers only)
export const createBooking = async (req, res) => {
  // Start a MongoDB Client Session for ACID Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { venueId, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    // 1. Fetch Venue to verify existence and compute total price
    const venue = await Venue.findById(venueId).session(session);
    if (!venue) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // 2. CRITICAL: Check for overlapping bookings (Double-Booking Guard)
    // Overlap condition: (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
    const existingBooking = await Booking.findOne({
      venue: venueId,
      status: 'confirmed',
      $and: [
        { startDate: { $lt: end } },
        { endDate: { $gt: start } },
      ],
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: 'Venue is already booked for the selected dates',
      });
    }

    // 3. Compute duration and total price
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * venue.pricePerDay;

    // 4. Create Booking inside Transaction
    const booking = await Booking.create(
      [
        {
          venue: venueId,
          organizer: req.user.id,
          startDate: start,
          endDate: end,
          totalPrice,
          status: 'confirmed',
        },
      ],
      { session }
    );

    // Commit changes permanently to database
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: booking[0],
    });
  } catch (error) {
    // Roll back all operations in case of any unhandled error
    await session.abortTransaction();
    session.endSession();  
    res.status(500).json({
      success: false,
      message: error.message || 'Booking transaction failed',
    });
  }
};