import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';

// @desc    Create new venue booking (Atomic Transaction & Double-Booking Prevention)
// @route   POST /api/v1/bookings
// @access  Private (Organizers only)
export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { venueId, startDate, endDate, negotiatedPrice } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const venue = await Venue.findById(venueId).session(session);
    if (!venue) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

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

    const effectiveRate = (negotiatedPrice && Number(negotiatedPrice) > 0)
      ? Number(negotiatedPrice)
      : venue.pricePerDay;

    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = days * effectiveRate;

    const booking = await Booking.create(
      [
        {
          venue: venueId,
          organizer: req.user.id,
          startDate: start,
          endDate: end,
          totalPrice,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          paymentMethod: 'cash_offline',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: booking[0],
      message: 'Venue reserved successfully. Offline cash payment pending.',
    });
  } catch (error) {
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

// @desc    Get all bookings for venues owned by the logged-in Lister
// @route   GET /api/v1/bookings/lister
// @access  Private (Listers only)
export const getListerBookings = async (req, res) => {
  try {
    const listerVenues = await Venue.find({ owner: req.user.id }).select('_id');
    const venueIds = listerVenues.map((v) => v._id);

    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'title pricePerDay location')
      .populate('organizer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch lister reservations',
    });
  }
};

// @desc    Get all bookings made by the logged-in organizer
// @route   GET /api/v1/bookings/my
// @access  Private (Organizers only)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ organizer: req.user.id })
      .populate('venue', 'title pricePerDay location owner')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your reservations',
    });
  }
};

// @desc    Lister marks cash payment done for a reservation and generates receipt
// @route   POST /api/v1/bookings/:id/mark-paid
// @access  Private
export const markBookingAsPaid = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'title pricePerDay owner location')
      .populate('organizer', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const transactionId = `TXN-CASH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'cash_offline';
    booking.transactionId = transactionId;
    booking.paidAt = new Date();

    await booking.save();

    const days = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));

    const receiptData = {
      receiptId: `REC-${booking._id.toString().slice(-6).toUpperCase()}`,
      transactionId,
      bookingId: booking._id,
      venueTitle: booking.venue?.title || 'Event Venue',
      organizerName: booking.organizer?.name || 'Valued Client',
      organizerEmail: booking.organizer?.email || '',
      startDate: booking.startDate.toISOString().split('T')[0],
      endDate: booking.endDate.toISOString().split('T')[0],
      days,
      pricePerDay: booking.venue?.pricePerDay || (booking.totalPrice / days),
      totalPrice: booking.totalPrice,
      paymentMethod: 'cash_offline',
      paymentStatus: 'paid',
      paidAt: booking.paidAt,
    };

    // Emit real-time payment_approved socket event
    try {
      const { getIO } = await import('../socket.js');
      const io = getIO();
      if (io) {
        io.emit('payment_approved', {
          bookingId: booking._id,
          organizerId: booking.organizer?._id?.toString() || booking.organizer?.toString(),
          venueTitle: booking.venue?.title,
          receipt: receiptData,
        });
      }
    } catch (e) {
      // Ignore socket emit if socket not active
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed in offline cash and receipt generated',
      data: booking,
      receipt: receiptData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark payment as done',
    });
  }
};

// @desc    Process payment for booking and generate receipt
// @route   POST /api/v1/bookings/:id/pay
// @access  Private
export const processPayment = markBookingAsPaid;

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
        transactionId: booking.transactionId || `TXN-CASH-${booking._id.toString().slice(-8).toUpperCase()}`,
        bookingId: booking._id,
        venueTitle: booking.venue?.title || 'Event Venue',
        venueAddress: booking.venue?.location?.formattedAddress || 'Location details on request',
        organizerName: booking.organizer?.name || 'Valued Client',
        organizerEmail: booking.organizer?.email || '',
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0],
        days,
        pricePerDay: booking.venue?.pricePerDay || (booking.totalPrice / days),
        totalPrice: booking.totalPrice,
        paymentMethod: booking.paymentMethod || 'cash_offline',
        paymentStatus: booking.paymentStatus || 'unpaid',
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