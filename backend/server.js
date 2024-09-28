import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
// const allowedOrigins = ['exp://192.168.1.53:8081']; // Your frontend URL
const allowedOrigins = ['http://192.168.1.53:8081'];  // Replace 'exp://' with 'http://'

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'], // Allow necessary HTTP methods
  credentials: true, // Include credentials if needed (like cookies)
}));
app.use(bodyParser.json());



let users = [];  // Store user locations and push tokens

// Endpoint to save user location and push token
app.post('/location', (req, res) => {
    console.log("location")
  const { latitude, longitude, pushToken } = req.body;
  users.push({ latitude, longitude, pushToken });
  res.status(200).send('Location saved');
});

// Endpoint to send SOS alert to nearby users
app.post('/sos-alert', (req, res) => {
    console.log("sos")
  const { latitude, longitude, pushToken } = req.body;
  const nearbyUsers = users.filter(user => {
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      user.latitude,
      user.longitude
    );
    console.log(distance)
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
    Math.sin(dLat / 2) * Math.sin(dLat/ 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;  // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

app.listen(3000, () => {
  console.log('Server running on port 3000');
});