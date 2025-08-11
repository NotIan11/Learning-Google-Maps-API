import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';


export default function App() {
  const [pin,setPin] = React.useState ({
    latitude: 37.78825,
    longitude: -122.4324
  })
  const [region,setRegion] = React.useState ({
    latitude: 37.78825,
    longitude: -122.4324
  })

  return (
    <View style={{marginTop: 50, flex: 1}}>
      {/*<GooglePlacesAutocomplete
        placeholder="Search"
        onPress={(data: any, details: any = null) => {
          console.log(data, details);
        }}
        query={{
          key: 'AIzaSyDG258Q2a5mxCRr940XSjOi3lQxZR-CidU',
          language: 'en',
        }}
        styles={{
          container: { 
            position: "absolute", 
            top: 0,
            left: 20,
            right: 20,
            zIndex: 1000,
            height: 50
          },
          textInput: {
            height: 50,
            backgroundColor: 'white',
            borderRadius: 8,
            paddingHorizontal: 15,
            fontSize: 16,
          }
        }}
      />*/}
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker 
          coordinate={pin}
          pinColor = "purple"
          draggable={true}
          onDragStart={(e) => {
            console.log("Drag start", e.nativeEvent.coordinate)
          }}
          onDragEnd={(e) => {
            setPin({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude
            })
          }}
          
        >
          <Callout>
            <View style={{ padding: 10, backgroundColor: 'white', borderRadius: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>ASDASDASDASDASDASDASDASDASDAS</Text>
            </View>
          </Callout>
        </Marker>
        <Circle 
          center={pin} 
          radius={1000} 
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
