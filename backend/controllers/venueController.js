import Venue from '../models/Venue.js';

// @desc    Create new venue listing
// @route   POST /api/v1/venues
// @access  Private (Listers only)
export const createVenue = async (req, res) => {
  try {
    const { title, description, capacity, pricePerDay, location } = req.body;

    // Extract coordinates directly from body or location object
    const lng = Number(req.body.longitude ?? location?.coordinates?.[0]);
    const lat = Number(req.body.latitude ?? location?.coordinates?.[1]);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: 'Valid numeric longitude and latitude coordinates are required',
      });
    }

    const venue = await Venue.create({
      title,
      description,
      capacity: Number(capacity),
      pricePerDay: Number(pricePerDay),
      owner: req.user.id,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        formattedAddress: location?.address || req.body.formattedAddress || '',
      },
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