import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync, setupNotificationListener } from './noti';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    (async () => {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Get current location
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);

      // Send user location and push token to backend
      await sendLocationToBackend(loc.coords.latitude, loc.coords.longitude, token);
    })();

    // Set up notification listener
    const removeNotificationListener = setupNotificationListener();

    return () => {
      // Clean up notification listener when component unmounts
      removeNotificationListener();
    };
  }, []);

  // Send user location to backend
  const sendLocationToBackend = async (latitude, longitude, pushToken) => {
    try {
      const backendUrl = 'http://192.168.1.53:3000/location';
      // Make sure this is reachable
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          pushToken,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok'); // Handle error
      }
    } catch (error) {
      console.error('Error sending location to backend:', error); // Log error
    }
  };
  

  // Send SOS message to backend
  const sendSOS = async () => {
    try {
      const backendUrl = 'http://192.168.1.53:3000/sos-alert';
      // Replace with your backend API URL
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          pushToken: expoPushToken,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send SOS alert'); // Handle error
      }
    } catch (error) {
      console.error('Error sending SOS:', error); // Log error
    }
  };
  

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>SOS App</Text>
      <Button title="Send SOS" onPress={() => sendSOS()} />

    </View>
  );
}
