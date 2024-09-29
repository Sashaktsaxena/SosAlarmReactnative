import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync, setupNotificationListener } from './noti';
import MapScreen from './MapScreen'; // Import the MapScreen component

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      await sendLocationToBackend(loc.coords.latitude, loc.coords.longitude, token);
    })();

    const removeNotificationListener = setupNotificationListener();

    return () => {
      removeNotificationListener();
    };
  }, []);

  const sendLocationToBackend = async (latitude, longitude, pushToken) => {
    try {
      const backendUrl = 'http://192.168.1.41:5000/location';
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude, pushToken }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
      Alert.alert('Error', 'Failed to send location to backend');
    }
  };

  const sendSOS = async () => {
    try {
      const backendUrl = 'http://192.168.1.41:5000/sos-alert';
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
        throw new Error('Failed to send SOS alert');
      }

      navigation.navigate('Map', {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Error sending SOS:', error);
      Alert.alert('Error', 'Failed to send SOS alert');
    }
  };

  return (
    <View style={styles.container}>
      <Text>SOS App</Text>
      <Button title="Send SOS" onPress={sendSOS} />
      {errorMsg ? <Text>{errorMsg}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
