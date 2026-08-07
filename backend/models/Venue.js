import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Venue title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    // GeoJSON Point for Geospatial Queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      // Array format MUST BE [longitude, latitude]
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
      formattedAddress: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial distance calculations
venueSchema.index({ location: '2dsphere' });

const Venue = mongoose.model('Venue', venueSchema);
export default Venue;