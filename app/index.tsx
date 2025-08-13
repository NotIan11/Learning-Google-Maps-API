import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '../config/api.js';

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

interface Route {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  distance: number;
  duration: number;
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
  const [isOverlayCollapsed, setIsOverlayCollapsed] = React.useState(false);

  // Mock data for development (will be replaced with real API calls)
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [hotspots, setHotspots] = React.useState<Hotspot[]>([]);
  const [safePoints, setSafePoints] = React.useState<SafeMeetingPoint[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [routeToTask, setRouteToTask] = useState<Route | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [acceptedTasks, setAcceptedTasks] = useState<Set<string>>(new Set());

  // Mock UF campus location for testing
  const mockUFLocation = {
    latitude: 29.6476, // Reitz Union
    longitude: -82.3470
  };

  // Function to set mock location for testing
  const setMockLocation = () => {
    setUserLocation(mockUFLocation);
    Alert.alert('Mock Location Set', 'Location set to UF Reitz Union for testing');
  };

  // Function to calculate route from user location to task using Google Directions API
  const calculateRoute = async (taskLocation: { latitude: number; longitude: number }) => {
    if (!userLocation) {
      Alert.alert('No Location', 'Please enable location services or set mock location');
      return;
    }

    setIsRouting(true);
    
    try {
      // Create the directions service request
      const request = {
        origin: `${userLocation.latitude},${userLocation.longitude}`,
        destination: `${taskLocation.latitude},${taskLocation.longitude}`,
        travelMode: 'DRIVING', // or 'DRIVING', 'BICYCLING', 'TRANSIT'
        unitSystem: 'METRIC',
      };

      // Make the API call to Google Directions
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams({
          ...request,
          key: GOOGLE_MAPS_API_KEY // Make sure this is set
        })}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extract the polyline points
        const points = decodePolyline(route.overview_polyline.points);
        
        // Create the route object
        const newRoute: Route = {
          coordinates: points,
          distance: leg.distance.value / 1000, // Convert meters to km
          duration: Math.ceil(leg.duration.value / 60), // Convert seconds to minutes
        };
        
        setRouteToTask(newRoute);
      } else {
        throw new Error(`Directions API error: ${data.status}`);
      }
      
      setIsRouting(false);
      
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
      setIsRouting(false);
    }
  };

  // Helper function to decode Google's polyline format
  const decodePolyline = (encoded: string) => {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }

    return poly;
  };

  // Function to clear route
  const clearRoute = () => {
    setRouteToTask(null);
  };

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
      },
      {
        id: '3',
        title: 'Test',
        description: 'test',
        location: { latitude: 29.6476, longitude: -82.3472 },
        payment: 10000,
        status: 'open',
        category: 'academic'
      }
    ];
    setTasks(mockTasks);
  };

  // Function to calculate hotspots based on actual task data
  const calculateHotspots = (taskData: Task[]) => {
    if (taskData.length === 0) return [];

    console.log('Calculating hotspots for', taskData.length, 'tasks');
    
    // Grid size for 1km clustering (roughly 0.01 degrees = 1km)
    const gridSize = 0.02;
    const minTasksForHotspot = 3;

    // Group tasks by grid cells
    const gridMap = new Map<string, Task[]>();
    
    taskData.forEach(task => {
      const gridX = Math.floor(task.location.latitude / gridSize);
      const gridY = Math.floor(task.location.longitude / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      console.log(`Task ${task.id} at (${task.location.latitude}, ${task.location.longitude}) goes to grid ${gridKey}`);
      
      if (!gridMap.has(gridKey)) {
        gridMap.set(gridKey, []);
      }
      gridMap.get(gridKey)!.push(task);
    });

    console.log('Grid clusters:', Array.from(gridMap.entries()));

    // Convert grid clusters to hotspots
    const hotspots: Hotspot[] = [];
    
    gridMap.forEach((tasks, gridKey) => {
      console.log(`Grid ${gridKey} has ${tasks.length} tasks`);
      if (tasks.length >= minTasksForHotspot) {
        // Calculate center of the cluster
        const centerLat = tasks.reduce((sum, t) => sum + t.location.latitude, 0) / tasks.length;
        const centerLng = tasks.reduce((sum, t) => sum + t.location.longitude, 0) / tasks.length;
        
        // Calculate radius based on task spread
        const maxDistance = Math.max(
          ...tasks.map(t => 
            Math.sqrt(
              Math.pow(t.location.latitude - centerLat, 2) + 
              Math.pow(t.location.longitude - centerLng, 2)
            )
          )
        );
        
        // Intensity based on task density (0-1 scale)
        const intensity = Math.min(tasks.length / 10, 1);
        
        const hotspot = {
          center: { latitude: centerLat, longitude: centerLng },
          radius: Math.max(maxDistance * 50000, 100),
          taskCount: tasks.length,
          intensity: intensity
        };
        
        console.log('Created hotspot:', hotspot);
        hotspots.push(hotspot);
      }
    });

    console.log('Final hotspots:', hotspots);
    return hotspots;
  };

  // Update hotspots whenever tasks change
  React.useEffect(() => {
    const newHotspots = calculateHotspots(tasks);
    setHotspots(newHotspots);
  }, [tasks]);

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

  // Function to accept a task
  const acceptTask = (task: Task) => {
    // Check if user already has an accepted task
    if (acceptedTasks.size > 0) {
      Alert.alert('Task Already Accepted', 'You can only accept one task at a time. Please complete or cancel your current task first.');
      return;
    }
    
    setAcceptedTasks(prev => new Set(prev).add(task.id));
    calculateRoute(task.location);
    setSelectedTask(null);
  };

  // Function to cancel an accepted task
  const cancelTask = (task: Task) => {
    setAcceptedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(task.id);
      return newSet;
    });
    clearRoute();
    setSelectedTask(null);
  };

  return (
    <View style={{marginTop: 0, flex: 1}}>
      {/* Mock Location Button for Testing */}
      <TouchableOpacity 
        style={styles.mockLocationButton}
        onPress={setMockLocation}
      >
        <Text style={styles.mockLocationText}>Set Mock UF Location</Text>
      </TouchableOpacity>

      {/* Overlay Controls */}
      <View style={[styles.overlayControls, isOverlayCollapsed && styles.overlayCollapsed]}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>Info Overlays</Text>
          <Text 
            style={[styles.chevron, isOverlayCollapsed && styles.chevronCollapsed]}
            onPress={() => setIsOverlayCollapsed(!isOverlayCollapsed)}
          >
            {isOverlayCollapsed ? '▲' : '▼'}
          </Text>
        </View>
        {!isOverlayCollapsed && (
          <>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔥</Text>
              <Text style={styles.featureText}>Hotspots</Text>
              <Switch 
                value={showHotspots} 
                onValueChange={setShowHotspots}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showHotspots ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Tasks</Text>
              <Switch 
                value={showTasks} 
                onValueChange={setShowTasks}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showTasks ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🛡️</Text>
              <Text style={styles.featureText}>Safe Spots</Text>
              <Switch 
                value={showSafePoints} 
                onValueChange={setShowSafePoints}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showSafePoints ? '#fff' : '#f4f3f4'}
              />
            </View>
          </>
        )}
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
            pinColor="#FF6B35" // UF Orange
            onPress={() => setSelectedTask(task)}
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
            pinColor="#0021A5" // UF Blue
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

        {/* Route line */}
        {routeToTask && (
          <Polyline
            coordinates={routeToTask.coordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Task Details Modal */}
      {selectedTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.taskModal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Details</Text>
              <Text 
                style={styles.closeButton}
                onPress={() => setSelectedTask(null)}
              >
                ✕
              </Text>
            </View>

            {/* Task Creator Info */}
            <View style={styles.creatorSection}>
              <View style={styles.creatorIcon}>
                <Text style={styles.creatorIconText}>👤</Text>
              </View>
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorLabel}>Task Creator</Text>
                <Text style={styles.postedDate}>Posted {new Date().toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Task Title and Tag */}
            <Text style={styles.taskTitle}>{selectedTask.title}</Text>
            <View style={styles.taskTag}>
              <Text style={styles.tagText}>{selectedTask.category || 'general'}</Text>
            </View>

            {/* Description */}
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{selectedTask.description}</Text>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>UF Campus Area</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={styles.detailText}>15-20 min</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💰</Text>
                <Text style={styles.detailText}>${selectedTask.payment}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>✅</Text>
                <Text style={styles.detailText}>Verified User</Text>
              </View>
            </View>

            {/* Safety Tips */}
            <View style={styles.safetySection}>
              <View style={styles.safetyHeader}>
                <Text style={styles.safetyIcon}>⚠️</Text>
                <Text style={styles.safetyTitle}>Safety Tips</Text>
              </View>
              <View style={styles.safetyTips}>
                <Text style={styles.safetyTip}>• Meet in a public place</Text>
                <Text style={styles.safetyTip}>• Share task details with a friend</Text>
                <Text style={styles.safetyTip}>• Use in-app chat for communication</Text>
                <Text style={styles.safetyTip}>• Report suspicious behavior</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {acceptedTasks.has(selectedTask.id) ? (
                <TouchableOpacity 
                  style={[styles.acceptButton, styles.cancelButton]}
                  onPress={() => cancelTask(selectedTask)}
                >
                  <Text style={styles.cancelIcon}>✕</Text>
                  <Text style={styles.cancelText}>Cancel Task</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.acceptButton, 
                    styles.fullWidthButton,
                    acceptedTasks.size > 0 && styles.disabledButton
                  ]}
                  onPress={() => acceptTask(selectedTask)}
                  disabled={acceptedTasks.size > 0}
                >
                  <Text style={styles.acceptIcon}>✓</Text>
                  <Text style={styles.acceptText}>
                    {acceptedTasks.size > 0 ? 'Another Task Accepted' : 'Accept Task'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Report Link */}
            <View style={styles.reportSection}>
              <Text style={styles.reportIcon}>🚨</Text>
              <Text style={styles.reportText}>Report Task</Text>
            </View>
          </View>
        </View>
      )}
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
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 200,
    padding: 0,
    borderWidth: 2,
    borderColor: '#FF6B35', // UF Orange outline around entire white area
  },
  overlayCollapsed: {
    minHeight: 60,
    backgroundColor: '#0021A5', // UF Blue background when collapsed
    borderColor: '#FF6B35', // Keep orange outline
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#0021A5', // UF Blue
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white', // White text
  },
  chevron: {
    fontSize: 12,
    color: 'white', // White chevron
  },
  chevronCollapsed: {
    transform: [{ rotate: '180deg' }],
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    minHeight: 60,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 25,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  taskModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    backgroundColor: '#0021A5', // UF Blue
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingBottom: 20,
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  creatorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  creatorIconText: {
    fontSize: 20,
    color: 'white',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  postedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  taskTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  tagText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  safetySection: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  safetyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  safetyTips: {
    paddingLeft: 10,
  },
  safetyTip: {
    fontSize: 12,
    color: '#000',
    marginBottom: 5,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 15,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptIcon: {
    color: 'white',
    fontSize: 18,
    marginRight: 8,
  },
  acceptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineIcon: {
    color: '#FF3B30',
    fontSize: 18,
    marginRight: 8,
  },
  declineText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  reportSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  reportIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reportText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  mockLocationButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  mockLocationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  routeDetails: {
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
  },
  clearRouteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  clearRouteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  cancelIcon: {
    color: 'white',
    fontSize: 18,
    marginRight: 8,
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fullWidthButton: {
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E', // Grey color
  },
});
