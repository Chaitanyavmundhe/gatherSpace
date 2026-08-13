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

// @desc    Get all venues owned by the logged-in lister
// @route   GET /api/v1/venues/my
// @access  Private (Listers only)
export const getMyVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: venues.length,
      data: venues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching your venues',
    });
  }
};

// @desc    Get single venue by id
// @route   GET /api/v1/venues/:id
// @access  Public
export const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    res.status(200).json({ success: true, data: venue });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching venue',
    });
  }
};

// @desc    Update a venue listing (owner only)
// @route   PUT /api/v1/venues/:id
// @access  Private (Listers only, must be the owner)
export const updateVenue = async (req, res) => {
  try {
    let venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Ownership check: only the lister who created this venue can edit it
    if (venue.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this venue',
      });
    }

    const { title, description, capacity, pricePerDay, location } = req.body;

    const lng = Number(req.body.longitude ?? location?.coordinates?.[0] ?? venue.location.coordinates[0]);
    const lat = Number(req.body.latitude ?? location?.coordinates?.[1] ?? venue.location.coordinates[1]);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: 'Valid numeric longitude and latitude coordinates are required',
      });
    }

    if (title !== undefined) venue.title = title;
    if (description !== undefined) venue.description = description;
    if (capacity !== undefined) venue.capacity = Number(capacity);
    if (pricePerDay !== undefined) venue.pricePerDay = Number(pricePerDay);

    venue.location = {
      type: 'Point',
      coordinates: [lng, lat],
      formattedAddress:
        location?.address ?? req.body.formattedAddress ?? venue.location.formattedAddress ?? '',
    };

    await venue.save();

    res.status(200).json({ success: true, data: venue });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update venue',
    });
  }
};

// @desc    Delete a venue listing (owner only)
// @route   DELETE /api/v1/venues/:id
// @access  Private (Listers only, must be the owner)
export const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    // Ownership check: only the lister who created this venue can delete it
    if (venue.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this venue',
      });
    }

    await venue.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete venue',
    });
  }
};