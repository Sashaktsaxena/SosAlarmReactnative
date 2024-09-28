import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

// Function to play the alarm sound
export const playAlarm = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('./assets/alarm.mp3')  // Ensure the alarm.mp3 file is placed in your assets folder
  );
  await sound.playAsync();
};

// Function to handle incoming notifications
export const setupNotificationListener = () => {
  const notificationListener = Notifications.addNotificationReceivedListener(async notification => {
    const { latitude, longitude, sosLink } = notification.request.content.data;  // Get data from notification
    console.log(latitude,longitude)
    Alert.alert(
      'SOS Alert',
      'A user nearby is in danger! Click OK to view their location on the map.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            // Open the map using the deep link (or link to web version)
            if (sosLink) {
              Linking.openURL(sosLink); // Handle deep linking to the map
            } else {
              Alert.alert('Error', 'Location link is missing');
            }
          },
        },
      ]
    );
    
    // Play alarm sound when an SOS is received
    await playAlarm();
  });

  return () => {
    notificationListener.remove();  // Clean up listener when component unmounts
  };
};

// Function to register for push notifications
export const registerForPushNotificationsAsync = async () => {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};

// Function to send an SOS notification with the user's location
export const sendSOSNotification = async (recipientTokens) => {
  try {
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    
    // Deep link that opens the map screen with coordinates
    const sosLink = `myapp://maps?latitude=${latitude}&longitude=${longitude}`;

    // Send a push notification to all users with a deep link
    recipientTokens.forEach(async (token) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'SOS Alert!',
          body: 'A nearby user is in danger. Tap to view their location.',
          data: {
            latitude,
            longitude,
            sosLink,  // Include the link to the map screen
          },
        },
        trigger: null,  // Send immediately
        to: token,  // Target recipient
      });
    });
    
  } catch (error) {
    console.error('Error sending SOS notification:', error);
  }
};
