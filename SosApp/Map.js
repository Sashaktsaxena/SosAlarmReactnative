import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const Map = () => {
  const googleMapsIframe = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden; /* Prevents scrolling */
          }
          iframe {
            border: 0;
            width: 100vw; /* Use viewport width */
            height: 100vh; /* Use viewport height */
          }
        </style>
      </head>
      <body>
        <iframe
          loading="lazy"
          allowfullscreen
          src="https://www.google.com/maps/embed/v1/view?key=AIzaSyAaRnCKVVSWGR159MyTF6rV7NMIPsW960c&center=37.422065,-122.084095&zoom=14">
        </iframe>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: googleMapsIframe }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1, // Ensure WebView takes up the full container
  },
});

export default Map;
