import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
const allowedOrigins = ['http://192.168.1.41:8081'];  // Replace with your frontend URL

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'], // Allow necessary HTTP methods
  credentials: true, // Include credentials if needed (like cookies)
}));

// Connect to MongoDB
const mongoURI = 'mongodb://localhost:27017/Safety';
mongoose.connect(mongoURI, {
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Define user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'security', 'admin'], // Valid roles
    default: 'user', // Default value
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
});

// Model
const User = mongoose.model('User', userSchema);

let users = [];  // Store user locations and push tokens

// Endpoint to save user location and push token
app.post('/location', (req, res) => {
  const { latitude, longitude, pushToken } = req.body;
  users.push({ latitude, longitude, pushToken });
  res.status(200).send('Location saved');
});

// Endpoint to send SOS alert to nearby users
app.post('/sos-alert', (req, res) => {
  const { latitude, longitude, pushToken } = req.body;
  const nearbyUsers = users.filter(user => {
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      user.latitude,
      user.longitude
    );
    return distance <= 3 && user.pushToken !== pushToken;
  });

  nearbyUsers.forEach(user => {
    sendPushNotification(user.pushToken);
  });

  res.status(200).send('SOS alert sent');
});

// Function to send push notification
const sendPushNotification = async (expoPushToken) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'SOS Alert',
    body: 'A user nearby is in danger!',
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Failed to send notification:', errorResponse);
  } else {
    console.log('Notification sent successfully!');
  }
};

// Function to calculate the distance between two coordinates
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;  // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;  // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password, mobile, role, location } = req.body;

  // Validate required fields
  if (!name || !email || !password || !mobile || !location) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: role || 'user', // Assign role from request, default to "user"
      location,
    });

    // Save user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, '789454jkdfjkba', { expiresIn: '1h' });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});
