import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

// Function to play the alarm sound
export const playAlarm = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('./assets/alarm.mp3')  // Ensure the alarm.mp3 file is placed in your assets folder
  );
  await sound.playAsync();
};

// Function to handle incoming notifications
export const setupNotificationListener = () => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    Alert.alert('SOS Alert', 'A user nearby is in danger!');
    playAlarm();  // Play alarm sound when an SOS is received
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