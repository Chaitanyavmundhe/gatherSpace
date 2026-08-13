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
    const { venueId, startDate, endDate, paymentMethod = 'credit_card' } = req.body;

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
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = days * venue.pricePerDay;
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
          paymentStatus: 'paid',
          paymentMethod,
          transactionId,
          paidAt: new Date(),
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
      receipt: {
        bookingId: booking[0]._id,
        transactionId,
        venueTitle: venue.title,
        pricePerDay: venue.pricePerDay,
        days,
        totalPrice,
        paidAt: booking[0].paidAt,
        paymentMethod,
        paymentStatus: 'paid',
      },
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

// @desc    Get occupied booking dates for a venue (for visual calendar display)
// @route   GET /api/v1/bookings/venue/:venueId/availability
// @access  Public
export const getVenueBookingsAvailability = async (req, res) => {
  try {
    const { venueId } = req.params;

    const bookings = await Booking.find({
      venue: venueId,
      status: 'confirmed',
    }).select('startDate endDate status');

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch venue availability',
    });
  }
};

// @desc    Process payment for booking and generate receipt
// @route   POST /api/v1/bookings/:id/pay
// @access  Private
export const processPayment = async (req, res) => {
  try {
    const { paymentMethod = 'credit_card' } = req.body;
    const booking = await Booking.findById(req.params.id).populate('venue organizer', 'title pricePerDay name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    booking.paymentStatus = 'paid';
    booking.paymentMethod = paymentMethod;
    booking.transactionId = transactionId;
    booking.paidAt = new Date();
    booking.status = 'confirmed';

    await booking.save();

    const days = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: booking,
      receipt: {
        receiptId: `REC-${booking._id.toString().slice(-6).toUpperCase()}`,
        transactionId,
        bookingId: booking._id,
        venueTitle: booking.venue?.title || 'Event Venue',
        organizerName: booking.organizer?.name || req.user.name,
        organizerEmail: booking.organizer?.email || req.user.email,
        startDate: booking.startDate,
        endDate: booking.endDate,
        days,
        pricePerDay: booking.venue?.pricePerDay || (booking.totalPrice / days),
        totalPrice: booking.totalPrice,
        paymentMethod,
        paymentStatus: 'paid',
        paidAt: booking.paidAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Payment processing failed',
    });
  }
};

// @desc    Get booking payment receipt details
// @route   GET /api/v1/bookings/:id/receipt
// @access  Private
export const getBookingReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue organizer', 'title pricePerDay name email location');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const days = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));

    res.status(200).json({
      success: true,
      data: {
        receiptId: `REC-${booking._id.toString().slice(-6).toUpperCase()}`,
        transactionId: booking.transactionId || `TXN-${booking._id.toString().slice(-8).toUpperCase()}`,
        bookingId: booking._id,
        venueTitle: booking.venue?.title || 'Event Venue',
        venueAddress: booking.venue?.location?.formattedAddress || 'Location details on request',
        organizerName: booking.organizer?.name || 'Valued Client',
        organizerEmail: booking.organizer?.email || '',
        startDate: booking.startDate,
        endDate: booking.endDate,
        days,
        pricePerDay: booking.venue?.pricePerDay || (booking.totalPrice / days),
        totalPrice: booking.totalPrice,
        paymentMethod: booking.paymentMethod || 'credit_card',
        paymentStatus: booking.paymentStatus || 'paid',
        paidAt: booking.paidAt || booking.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch receipt',
    });
  }
};