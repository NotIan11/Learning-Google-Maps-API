import * as Location from 'expo-location';
import React from 'react';
import { Alert, Dimensions, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

// Types for future integration
interface Task {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  payment: number;
  status: 'open' | 'accepted' | 'completed';
  category?: string;
}

interface Hotspot {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  taskCount: number;
  intensity: number; // 0-1 scale for color intensity
}

interface SafeMeetingPoint {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  type: 'library' | 'student_union' | 'cafe' | 'public_space' | 'police_station';
}

export default function App() {
  const [pin, setPin] = React.useState({
    latitude: 29.6476, // UF Reitz Union
    longitude: -82.3470
  });
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = React.useState(false);
  
  // Overlay toggles
  const [showTasks, setShowTasks] = React.useState(true);
  const [showHotspots, setShowHotspots] = React.useState(false);
  const [showSafePoints, setShowSafePoints] = React.useState(false);

  // Mock data for development (will be replaced with real API calls)
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [hotspots, setHotspots] = React.useState<Hotspot[]>([]);
  const [safePoints, setSafePoints] = React.useState<SafeMeetingPoint[]>([]);

  // Function to fetch tasks (placeholder for future API integration)
  const fetchTasks = async () => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/tasks');
    // const data = await response.json();
    // setTasks(data);
    
    // Mock data for now
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Help move furniture',
        description: 'Need help moving a desk from my dorm',
        location: { latitude: 29.6480, longitude: -82.3475 },
        payment: 25,
        status: 'open',
        category: 'moving'
      },
      {
        id: '2',
        title: 'Study partner needed',
        description: 'Looking for someone to study calculus with',
        location: { latitude: 29.6470, longitude: -82.3465 },
        payment: 15,
        status: 'open',
        category: 'academic'
      }
    ];
    setTasks(mockTasks);
  };

  // Function to fetch hotspots (placeholder for future API integration)
  const fetchHotspots = async () => {
    // TODO: Replace with actual API call
    const mockHotspots: Hotspot[] = [
      {
        center: { latitude: 29.6475, longitude: -82.3470 },
        radius: 200,
        taskCount: 8,
        intensity: 0.8
      }
    ];
    setHotspots(mockHotspots);
  };

  // Function to fetch safe meeting points (placeholder for future API integration)
  const fetchSafePoints = async () => {
    // TODO: Replace with actual API call
    const mockSafePoints: SafeMeetingPoint[] = [
      {
        id: '1',
        name: 'Reitz Union',
        location: { latitude: 29.6476, longitude: -82.3470 },
        description: 'Main student union building',
        type: 'student_union'
      },
      {
        id: '2',
        name: 'Marston Science Library',
        location: { latitude: 29.6485, longitude: -82.3460 },
        description: 'Central campus library',
        type: 'library'
      },
      {
        id: '3',
        name: 'Library West',
        location: { latitude: 29.6511, longitude: -82.3428 },
        description: 'Humanities and Social Science Library',
        type: 'library'
      },
      {
        id: '4',
        name: 'UF Police Department',
        location: { latitude: 29.6444, longitude: -82.3429 },
        description: 'University of Florida Police Department',
        type: 'police_station'
      },
      {
        id: '5',
        name: 'Student Rec Center',
        location : { latitude: 29.65, longitude: -82.3467 },
        description: 'Student Rec Center',
        type: 'public_space'
      }
    ];
    setSafePoints(mockSafePoints);
  };

  // Load data when component mounts
  React.useEffect(() => {
    fetchTasks();
    fetchHotspots();
    fetchSafePoints();
  }, []);

  // Request location permissions and get current location
  const getCurrentLocation = async () => {
    try {
      // Check current permission status first
      const currentStatus = await Location.getForegroundPermissionsAsync();
      console.log('Current permission status:', currentStatus);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Permission request result:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your current location on the map.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newLocation);
      // Don't update pin - keep map centered on UF
      // setPin(newLocation); // Commented out temporarily
      
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  // Get location when component mounts
  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <View style={{marginTop: 50, flex: 1}}>
      {/* Overlay Controls */}
      <View style={styles.overlayControls}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Tasks</Text>
          <Switch value={showTasks} onValueChange={setShowTasks} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Hotspots</Text>
          <Switch value={showHotspots} onValueChange={setShowHotspots} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Safe Points</Text>
          <Switch value={showSafePoints} onValueChange={setShowSafePoints} />
        </View>
      </View>

      <MapView 
        style={styles.map}
        region={{
          latitude: pin.latitude,
          longitude: pin.longitude,
          latitudeDelta: 0.022,
          longitudeDelta: 0.01,
        }}
      >
        {/* User's current location marker */}
        {userLocation && (
          <>
            <Marker 
              coordinate={userLocation}
              pinColor="red"
              title="Your Location"
              description="You are here"
            />
            <Circle 
              center={userLocation} 
              radius={50}
              fillColor="rgba(0, 122, 255, 0.2)"
              strokeColor="rgba(0, 122, 255, 0.5)"
              strokeWidth={2}
            />
          </>
        )}
        
        {/* Task markers */}
        {showTasks && tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={task.location}
            pinColor={task.status === 'open' ? 'darkorange' : 'grey'}
            title={`$${task.payment} - ${task.title}`}
            description={`${task.description}\nStatus: ${task.status}`}
          />
        ))}

        {/* Hotspot overlays */}
        {showHotspots && hotspots.map((hotspot, index) => (
          <Circle
            key={index}
            center={hotspot.center}
            radius={hotspot.radius}
            fillColor={`rgba(255, 0, 0, ${hotspot.intensity * 0.3})`}
            strokeColor={`rgba(255, 0, 0, ${hotspot.intensity * 0.8})`}
            strokeWidth={2}
          />
        ))}

        {/* Safe meeting point markers */}
        {showSafePoints && safePoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={point.location}
            pinColor="blue"
            title={point.name}
            description={point.description}
          />
        ))}
        
        {/* Draggable pin marker */}
        <Marker 
          coordinate={pin}
          pinColor="red"
          draggable={true}
          title="Selected Location"
          description="Drag to change this location"
          onDragStart={(e) => {
            console.log("Drag start", e.nativeEvent.coordinate)
          }}
          onDragEnd={(e) => {
            setPin({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude
            })
          }}
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
  overlayControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    minWidth: 120,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  calloutContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 200,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  calloutPayment: {
    fontSize: 14,
    color: 'green',
    fontWeight: '600',
    marginBottom: 8,
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 8,
    color: '#000',
    lineHeight: 16,
  },
  calloutStatus: {
    fontSize: 12,
    color: 'gray',
    fontStyle: 'italic',
  },
  calloutType: {
    fontSize: 12,
    color: 'purple',
    fontWeight: '500',
  },
});
