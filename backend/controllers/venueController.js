import Venue from '../models/Venue.js';

// @desc    Create new venue listing
// @route   POST /api/v1/venues
// @access  Private (Listers only)
export const createVenue = async (req, res) => {
  try {
    const { title, description, capacity, pricePerDay, longitude, latitude, formattedAddress } = req.body;

    // Build GeoJSON Point
    const venue = await Venue.create({
      title,
      description,
      capacity,
      pricePerDay,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)], // [lng, lat]
        formattedAddress,
      },
      owner: req.user.id, // Injected by Auth Middleware
    });

    res.status(201).json({
      success: true,
      data: venue,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create venue',
    });
  }
};

// @desc    Get venues within a radius (in kilometers)
// @route   GET /api/v1/venues/radius/:longitude/:latitude/:distance
// @access  Public
export const getVenuesInRadius = async (req, res) => {
  try {
    const { longitude, latitude, distance } = req.params;

    // Earth's radius = 6,378.1 km
    // Calculate radius in radians = distance / Earth Radius
    const radius = Number(distance) / 6378.1;

    const venues = await Venue.find({
      location: {
        $geoWithin: { $centerSphere: [[Number(longitude), Number(latitude)], radius] },
      },
    });

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching venues',
    });
  }
};