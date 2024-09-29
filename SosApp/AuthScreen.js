import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://192.168.1.41:5000'; // Replace with your API URL

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('user');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required for signup');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const handleSignup = async () => {
    if (!location) {
      Alert.alert('Error', 'Unable to get location');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/signup`, { name, email, password, mobile, role, location });
      Alert.alert('Success', res.data.message);
      setIsLogin(true);
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Something went wrong');
      } else if (error.request) {
        Alert.alert('Error', 'No response from the server');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const token = res.data.token;
      // Store user token for authentication
      await AsyncStorage.setItem('userToken', token);
      Alert.alert('Success', 'Login successful');
      // Navigate to the HomeScreen
      navigation.navigate('Map');
    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Something went wrong');
      } else if (error.request) {
        Alert.alert('Error', 'No response from the server');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Signup'}</Text>

      {!isLogin && (
        <>
          <TextInput
            placeholder="Name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Mobile Number"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Role :</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={role}
              style={styles.picker}
              onValueChange={(itemValue) => setRole(itemValue)}
            >
              <Picker.Item label="User" value="user" />
              <Picker.Item label="Security" value="security" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
        </>
      )}

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title={isLogin ? 'Login' : 'Signup'} onPress={isLogin ? handleLogin : handleSignup} />

      <Text onPress={() => setIsLogin(!isLogin)} style={styles.switchText}>
        {isLogin ? 'Create an account' : 'Already have an account? Login'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 16,
    color: 'blue',
  },
});
