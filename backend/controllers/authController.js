import User from '../models/User.js';

// Helper function to send token in HTTP-Only Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true, // Prevents XSS script access
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: 'strict', // Protects against CSRF attacks
  };

  // Exclude password from output
  user.password = undefined;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    data: user,
  });
};

// @desc    Register a new user (Organizer or Lister)
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // 2. Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // 3. Send response with HTTP-Only Cookie
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error during registration',
    });
  }
};