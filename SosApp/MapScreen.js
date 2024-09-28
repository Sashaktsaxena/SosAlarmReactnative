import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const MapScreen = ({ route }) => {
  const [location, setLocation] = useState(null);  // Current user location
  const [loading, setLoading] = useState(true);    // Loading state for spinner
  const { latitude, longitude } = route.params;    // Location from the SOS alert

  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access location was denied.');
          return;
        }

        // Get the user's current location
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to get current location.');
      } finally {
        setLoading(false);  // Stop loading once location is fetched
      }
    })();
  }, []);

  if (loading) {
    // Show a loading spinner while the location is being fetched
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}  // Use Google Maps as the map provider
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,  // Zoom level
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}  // User in danger's location
          title="User in Danger"
          description="This user needs help"
          pinColor="red"  // Different color for the alert
        />

        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}  // Current user's location
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapScreen;
