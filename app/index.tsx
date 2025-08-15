import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Dimensions, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
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
  // Add delivery-specific fields
  isDelivery?: boolean;
  pickupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  dropoffLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
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
  const [isOverlayCollapsed, setIsOverlayCollapsed] = React.useState(false);

  // Mock data for development (will be replaced with real API calls)
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [hotspots, setHotspots] = React.useState<Hotspot[]>([]);
  const [safePoints, setSafePoints] = React.useState<SafeMeetingPoint[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [acceptedTasks, setAcceptedTasks] = useState<Set<string>>(new Set());

  // Restore the mapRefreshKey state
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

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

  // Add this function to open Apple Maps navigation
  const openAppleMapsNavigation = (task: Task) => {
    if (!userLocation) {
      Alert.alert('No Location', 'Please enable location services or set mock location');
      return;
    }

    if (task.isDelivery && task.pickupLocation && task.dropoffLocation) {
      // For delivery tasks, create a multi-stop route
      // Apple Maps supports multiple destinations with this format
      const pickupCoords = `${task.pickupLocation.latitude},${task.pickupLocation.longitude}`;
      const dropoffCoords = `${task.dropoffLocation.latitude},${task.dropoffLocation.longitude}`;
      
      // Try the correct Apple Maps multi-stop format
      // Format: maps://?saddr=start&daddr=stop1&daddr=stop2
      const url = `maps://?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${pickupCoords}&daddr=${dropoffCoords}`;
      
      console.log('Opening Apple Maps with multi-stop URL:', url);
      
      // Try to open the URL
      Linking.openURL(url).catch(err => {
        console.error('Failed to open multi-stop route:', err);
        // Fallback: open route to pickup location
        const fallbackUrl = `maps://?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${pickupCoords}`;
        Linking.openURL(fallbackUrl);
        
        Alert.alert(
          'Multi-stop Route Unavailable',
          'Opening route to pickup location. You can manually add the dropoff location in Apple Maps by tapping the route and adding a stop.',
          [{ text: 'OK' }]
        );
      });
    } else {
      // For regular tasks, use single destination
      const url = `maps://?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${task.location.latitude},${task.location.longitude}`;
      console.log('Opening Apple Maps with single destination URL:', url);
      Linking.openURL(url);
    }
  };

  // Function to accept a task
  const acceptTask = (task: Task) => {
    console.log('🎯 acceptTask called with task:', task);
    
    if (acceptedTasks.size > 0) {
      Alert.alert('Task Already Accepted', 'You can only accept one task at a time. Please complete or cancel your current task first.');
      return;
    }
    
    setAcceptedTasks(prev => new Set(prev).add(task.id));
    
    // Open Apple Maps navigation instead of calculating route
    openAppleMapsNavigation(task);
    
    setSelectedTask(null);
  };

  // Function to cancel an accepted task
  const cancelTask = (task: Task) => {
    setAcceptedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(task.id);
      return newSet;
    });
    setSelectedTask(null);
  };

  // Update your overlay toggle functions
  const toggleOverlay = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    // Force map refresh after a small delay
    setTimeout(() => {
      setMapRefreshKey(prev => prev + 1);
    }, 50);
  };

  // Function to fetch tasks (placeholder for future API integration)
  const fetchTasks = async () => {
    // Mock data for now
    const mockTasks: Task[] = [
      // Football Stadium Cluster (8 tasks)
      {
        id: '1',
        title: 'Help move furniture',
        description: 'Need help moving a desk from my dorm',
        location: { latitude: 29.6490, longitude: -82.3485 },
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
        location: { latitude: 29.6478, longitude: -82.3474 },
        payment: 10000,
        status: 'open',
        category: 'academic'
      },
      {
        id: '4',
        title: 'Football game setup help',
        description: 'Need help setting up tailgate area',
        location: { latitude: 29.6495, longitude: -82.3480 },
        payment: 30,
        status: 'open',
        category: 'event'
      },
      {
        id: '5',
        title: 'Parking spot needed',
        description: 'Looking for parking near stadium',
        location: { latitude: 29.6488, longitude: -82.3478 },
        payment: 20,
        status: 'open',
        category: 'parking'
      },
      // Updated delivery task with pickup and dropoff locations
      {
        id: '6',
        title: 'Food delivery to stadium',
        description: 'Pick up pizza from Pizza Palace and deliver to section 15 at the stadium',
        location: { latitude: 29.6492, longitude: -82.3482 }, // Dropoff location (stadium)
        payment: 18,
        status: 'open',
        category: 'delivery',
        isDelivery: true,
        pickupLocation: {
          latitude: 29.6460, // Pizza Palace location
          longitude: -82.3450,
          address: 'Pizza Palace, University Ave'
        },
        dropoffLocation: {
          latitude: 29.6492, // Stadium section 15
          longitude: -82.3482,
          address: 'Ben Hill Griffin Stadium, Section 15'
        }
      },
      {
        id: '7',
        title: 'Lost phone near stadium',
        description: 'Help find my phone in parking lot',
        location: { latitude: 29.6485, longitude: -82.3475 },
        payment: 50,
        status: 'open',
        category: 'lost'
      },
      {
        id: '8',
        title: 'Stadium tour guide',
        description: 'Show me around the football stadium',
        location: { latitude: 29.6498, longitude: -82.3488 },
        payment: 25,
        status: 'open',
        category: 'tour'
      },

      // Honors Village Cluster (6 tasks)
      {
        id: '9',
        title: 'Honors study group',
        description: 'Forming study group for honors students',
        location: { latitude: 29.6520, longitude: -82.3450 },
        payment: 0,
        status: 'open',
        category: 'academic'
      },
      {
        id: '10',
        title: 'Honors dorm cleaning',
        description: 'Help clean common areas',
        location: { latitude: 29.6525, longitude: -82.3448 },
        payment: 35,
        status: 'open',
        category: 'cleaning'
      },
      {
        id: '11',
        title: 'Honors event planning',
        description: 'Help plan honors week activities',
        location: { latitude: 29.6518, longitude: -82.3452 },
        payment: 40,
        status: 'open',
        category: 'planning'
      },
      {
        id: '12',
        title: 'Honors tutoring',
        description: 'Need help with honors physics',
        location: { latitude: 29.6522, longitude: -82.3445 },
        payment: 45,
        status: 'open',
        category: 'tutoring'
      },
      {
        id: '13',
        title: 'Honors roommate finder',
        description: 'Looking for honors roommate',
        location: { latitude: 29.6528, longitude: -82.3455 },
        payment: 0,
        status: 'open',
        category: 'housing'
      },
      {
        id: '14',
        title: 'Honors library run',
        description: 'Pick up books from library for me',
        location: { latitude: 29.6515, longitude: -82.3442 },
        payment: 15,
        status: 'open',
        category: 'errand'
      },

      // Marston Library Cluster (4 tasks)
      {
        id: '15',
        title: 'Library study buddy',
        description: 'Study together at Marston',
        location: { latitude: 29.6488, longitude: -82.3462 },
        payment: 20,
        status: 'open',
        category: 'academic'
      },
      {
        id: '16',
        title: 'Library book return',
        description: 'Return books to Marston library',
        location: { latitude: 29.6485, longitude: -82.3465 },
        payment: 12,
        status: 'open',
        category: 'errand'
      },
      {
        id: '17',
        title: 'Library printing help',
        description: 'Help with printing at Marston',
        location: { latitude: 29.6490, longitude: -82.3460 },
        payment: 8,
        status: 'open',
        category: 'help'
      },
      {
        id: '18',
        title: 'Library quiet zone',
        description: 'Need help finding quiet study area',
        location: { latitude: 29.6482, longitude: -82.3468 },
        payment: 10,
        status: 'open',
        category: 'help'
      },

      // Reitz Union Cluster (3 tasks)
      {
        id: '19',
        title: 'Union food court help',
        description: 'Help carry food to table',
        location: { latitude: 29.6478, longitude: -82.3472 },
        payment: 5,
        status: 'open',
        category: 'help'
      },
      {
        id: '20',
        title: 'Union event setup',
        description: 'Help set up for career fair',
        location: { latitude: 29.6475, longitude: -82.3475 },
        payment: 25,
        status: 'open',
        category: 'event'
      },
      {
        id: '21',
        title: 'Union lost and found',
        description: 'Help find my keys in union',
        location: { latitude: 29.6480, longitude: -82.3470 },
        payment: 30,
        status: 'open',
        category: 'lost'
      },

      // NEW: Turlington Plaza Cluster (5 tasks)
      {
        id: '22',
        title: 'Turlington flyer distribution',
        description: 'Help pass out event flyers',
        location: { latitude: 29.6505, longitude: -82.3435 },
        payment: 20,
        status: 'open',
        category: 'marketing'
      },
      {
        id: '23',
        title: 'Turlington protest support',
        description: 'Need help with peaceful demonstration',
        location: { latitude: 29.6508, longitude: -82.3438 },
        payment: 0,
        status: 'open',
        category: 'activism'
      },
      {
        id: '24',
        title: 'Turlington cleanup',
        description: 'Help clean up after event',
        location: { latitude: 29.6502, longitude: -82.3432 },
        payment: 15,
        status: 'open',
        category: 'cleaning'
      },
      {
        id: '25',
        title: 'Turlington photography',
        description: 'Take photos of campus event',
        location: { latitude: 29.6506, longitude: -82.3436 },
        payment: 35,
        status: 'open',
        category: 'photography'
      },
      {
        id: '26',
        title: 'Turlington sound system',
        description: 'Help set up PA system',
        location: { latitude: 29.6504, longitude: -82.3434 },
        payment: 25,
        status: 'open',
        category: 'tech'
      },

      // NEW: Century Tower Area (4 tasks)
      {
        id: '27',
        title: 'Century Tower bell ringer',
        description: 'Help with tower maintenance',
        location: { latitude: 29.6515, longitude: -82.3430 },
        payment: 40,
        status: 'open',
        category: 'maintenance'
      },
      {
        id: '28',
        title: 'Century Tower tour guide',
        description: 'Give tours of the tower',
        location: { latitude: 29.6518, longitude: -82.3432 },
        payment: 30,
        status: 'open',
        category: 'tour'
      },
      {
        id: '29',
        title: 'Century Tower photography',
        description: 'Take architectural photos',
        location: { latitude: 29.6516, longitude: -82.3431 },
        payment: 25,
        status: 'open',
        category: 'photography'
      },
      {
        id: '30',
        title: 'Century Tower history research',
        description: 'Help research tower history',
        location: { latitude: 29.6517, longitude: -82.3433 },
        payment: 20,
        status: 'open',
        category: 'research'
      },

      // NEW: Plaza of the Americas (6 tasks)
      {
        id: '31',
        title: 'Plaza event coordinator',
        description: 'Help coordinate outdoor event',
        location: { latitude: 29.6495, longitude: -82.3440 },
        payment: 45,
        status: 'open',
        category: 'coordination'
      },
      {
        id: '32',
        title: 'Plaza gardening help',
        description: 'Help maintain plaza gardens',
        location: { latitude: 29.6498, longitude: -82.3442 },
        payment: 18,
        status: 'open',
        category: 'gardening'
      },
      {
        id: '33',
        title: 'Plaza art installation',
        description: 'Help with temporary art display',
        location: { latitude: 29.6496, longitude: -82.3441 },
        payment: 35,
        status: 'open',
        category: 'art'
      },
      {
        id: '34',
        title: 'Plaza meditation guide',
        description: 'Lead meditation session',
        location: { latitude: 29.6497, longitude: -82.3443 },
        payment: 30,
        status: 'open',
        category: 'wellness'
      },
      {
        id: '35',
        title: 'Plaza chess tournament',
        description: 'Help organize chess event',
        location: { latitude: 29.6494, longitude: -82.3439 },
        payment: 25,
        status: 'open',
        category: 'event'
      },
      {
        id: '36',
        title: 'Plaza cleanup crew',
        description: 'Help clean plaza area',
        location: { latitude: 29.6499, longitude: -82.3444 },
        payment: 15,
        status: 'open',
        category: 'cleaning'
      },

      // NEW: Library West Area (5 tasks)
      {
        id: '37',
        title: 'Library West study group',
        description: 'Form study group for humanities',
        location: { latitude: 29.6512, longitude: -82.3425 },
        payment: 0,
        status: 'open',
        category: 'academic'
      },
      {
        id: '38',
        title: 'Library West book sorting',
        description: 'Help sort returned books',
        location: { latitude: 29.6514, longitude: -82.3427 },
        payment: 20,
        status: 'open',
        category: 'library'
      },
      {
        id: '39',
        title: 'Library West research help',
        description: 'Help with research project',
        location: { latitude: 29.6511, longitude: -82.3426 },
        payment: 30,
        status: 'open',
        category: 'research'
      },
      {
        id: '40',
        title: 'Library West event setup',
        description: 'Help set up library event',
        location: { latitude: 29.6513, longitude: -82.3428 },
        payment: 25,
        status: 'open',
        category: 'event'
      },
      {
        id: '41',
        title: 'Library West tech support',
        description: 'Help with computer issues',
        location: { latitude: 29.6510, longitude: -82.3424 },
        payment: 35,
        status: 'open',
        category: 'tech'
      },

      // NEW: Student Rec Center Area (4 tasks)
      {
        id: '42',
        title: 'Rec center workout buddy',
        description: 'Find workout partner',
        location: { latitude: 29.6502, longitude: -82.3468 },
        payment: 0,
        status: 'open',
        category: 'fitness'
      },
      {
        id: '43',
        title: 'Rec center equipment help',
        description: 'Help with exercise equipment',
        location: { latitude: 29.6505, longitude: -82.3470 },
        payment: 15,
        status: 'open',
        category: 'fitness'
      },
      {
        id: '44',
        title: 'Rec center class assistant',
        description: 'Help with fitness class',
        location: { latitude: 29.6503, longitude: -82.3469 },
        payment: 20,
        status: 'open',
        category: 'fitness'
      },
      {
        id: '45',
        title: 'Rec center locker room help',
        description: 'Help find lost items',
        location: { latitude: 29.6504, longitude: -82.3471 },
        payment: 10,
        status: 'open',
        category: 'help'
      },

      // NEW: Southwest Campus Area (3 tasks)
      {
        id: '46',
        title: 'Southwest dorm help',
        description: 'Help with dorm move-in',
        location: { latitude: 29.6450, longitude: -82.3490 },
        payment: 30,
        status: 'open',
        category: 'moving'
      },
      {
        id: '47',
        title: 'Southwest parking help',
        description: 'Help find parking spot',
        location: { latitude: 29.6452, longitude: -82.3492 },
        payment: 15,
        status: 'open',
        category: 'parking'
      },
      {
        id: '48',
        title: 'Southwest campus tour',
        description: 'Give tour of southwest area',
        location: { latitude: 29.6451, longitude: -82.3491 },
        payment: 25,
        status: 'open',
        category: 'tour'
      },

      // NEW: Northeast Campus Area (3 tasks)
      {
        id: '49',
        title: 'Northeast lab assistant',
        description: 'Help in science lab',
        location: { latitude: 29.6530, longitude: -82.3450 },
        payment: 40,
        status: 'open',
        category: 'lab'
      },
      {
        id: '50',
        title: 'Northeast research help',
        description: 'Help with field research',
        location: { latitude: 29.6532, longitude: -82.3452 },
        payment: 35,
        status: 'open',
        category: 'research'
      },
      {
        id: '51',
        title: 'Northeast equipment move',
        description: 'Help move lab equipment',
        location: { latitude: 29.6531, longitude: -82.3451 },
        payment: 45,
        status: 'open',
        category: 'moving'
      },

      // NEW: Additional delivery tasks for testing
      {
        id: '52',
        title: 'Package delivery from library',
        description: 'Pick up package from Marston Library and deliver to my dorm in Southwest',
        location: { latitude: 29.6450, longitude: -82.3490 }, // Dropoff location (dorm)
        payment: 25,
        status: 'open',
        category: 'delivery',
        isDelivery: true,
        pickupLocation: {
          latitude: 29.6485, // Marston Library
          longitude: -82.3460,
          address: 'Marston Science Library'
        },
        dropoffLocation: {
          latitude: 29.6420, // Southwest dorm - moved further away
          longitude: -82.3510, // moved further away
          address: 'Southwest Dorm Complex'
        }
      },
      {
        id: '53',
        title: 'Coffee delivery to class',
        description: 'Pick up coffee from Starbucks and bring to my class in Turlington',
        location: { latitude: 29.6505, longitude: -82.3435 }, // Dropoff location (class)
        payment: 12,
        status: 'open',
        category: 'delivery',
        isDelivery: true,
        pickupLocation: {
          latitude: 29.6470, // Starbucks location
          longitude: -82.3460,
          address: 'Starbucks, Reitz Union'
        },
        dropoffLocation: {
          latitude: 29.6505, // Turlington class
          longitude: -82.3435,
          address: 'Turlington Hall, Room 101'
        }
      },
      {
        id: '54',
        title: 'Book delivery from bookstore',
        description: 'Pick up textbooks from UF Bookstore and deliver to Century Tower area',
        location: { latitude: 29.6515, longitude: -82.3430 }, // Dropoff location
        payment: 20,
        status: 'open',
        category: 'delivery',
        isDelivery: true,
        pickupLocation: {
          latitude: 29.6475, // UF Bookstore
          longitude: -82.3470,
          address: 'UF Bookstore, Reitz Union'
        },
        dropoffLocation: {
          latitude: 29.6515, // Century Tower area
          longitude: -82.3430,
          address: 'Century Tower'
        }
      },
      {
        id: '55',
        title: 'Lunch delivery to lab',
        description: 'Pick up lunch from Subway and deliver to my lab in Northeast campus',
        location: { latitude: 29.6530, longitude: -82.3450 }, // Dropoff location (lab)
        payment: 15,
        status: 'open',
        category: 'delivery',
        isDelivery: true,
        pickupLocation: {
          latitude: 29.6480, // Subway location
          longitude: -82.3470,
          address: 'Subway, Reitz Union Food Court'
        },
        dropoffLocation: {
          latitude: 29.6530, // Northeast lab
          longitude: -82.3450,
          address: 'Northeast Campus Lab Building'
        }
      }
    ];
    setTasks(mockTasks);
  };

  // Add this function before calculateHotspots
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Function to calculate hotspots based on actual task data
  const calculateHotspots = (taskData: Task[]) => {
    if (taskData.length === 0) return [];

    console.log('🔥 Calculating hotspots for', taskData.length, 'tasks');
    
    const minTasksForHotspot = 4; // Increased from 3 to 4
    const hotspotRadiusKm = 0.2; // 200 meters
    const minIntensityThreshold = 0.5; // Only show hotspots with 40%+ intensity
    
    const hotspots: Hotspot[] = [];
    const usedTasks = new Set<string>();
    
    // Sort tasks by density (tasks with more neighbors first)
    const taskDensities = taskData.map((task, index) => {
      const nearbyCount = taskData.filter((otherTask, otherIndex) => {
        if (index === otherIndex) return false;
        const distance = calculateDistance(
          task.location.latitude, task.location.longitude,
          otherTask.location.latitude, otherTask.location.longitude
        );
        return distance <= hotspotRadiusKm;
      }).length;
      return { task, nearbyCount, index };
    }).sort((a, b) => b.nearbyCount - a.nearbyCount);
    
    // Create hotspots starting with highest density areas
    taskDensities.forEach(({ task, nearbyCount, index }) => {
      if (usedTasks.has(task.id)) return;
      
      if (nearbyCount >= minTasksForHotspot - 1) {
        const nearbyUnusedTasks = taskData.filter((otherTask, otherIndex) => {
          if (index === otherIndex) return false;
          if (usedTasks.has(otherTask.id)) return false;
          
          const distance = calculateDistance(
            task.location.latitude, task.location.longitude,
            otherTask.location.latitude, otherTask.location.longitude
          );
          return distance <= hotspotRadiusKm;
        });
        
        if (nearbyUnusedTasks.length >= minTasksForHotspot - 1) {
          const allTasksInHotspot = [task, ...nearbyUnusedTasks];
          const centerLat = allTasksInHotspot.reduce((sum, t) => sum + t.location.latitude, 0) / allTasksInHotspot.length;
          const centerLng = allTasksInHotspot.reduce((sum, t) => sum + t.location.longitude, 0) / allTasksInHotspot.length;
          
          // Mark all these tasks as used
          allTasksInHotspot.forEach(t => usedTasks.add(t.id));
          
          const intensity = Math.min(allTasksInHotspot.length / 10, 1);
          
          // Only create hotspot if it meets intensity threshold
          if (intensity >= minIntensityThreshold) {
            const hotspot = {
              center: { latitude: centerLat, longitude: centerLng },
              radius: hotspotRadiusKm * 1000,
              taskCount: allTasksInHotspot.length,
              intensity
            };
            
            console.log('🔥 Created hotspot:', hotspot);
            hotspots.push(hotspot);
          } else {
            console.log('🚫 Skipped weak hotspot with intensity:', intensity);
          }
        }
      }
    });
    
    console.log('🔥 Final hotspots:', hotspots);
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
                onValueChange={(value) => toggleOverlay(setShowHotspots, value)}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showHotspots ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Tasks</Text>
              <Switch 
                value={showTasks} 
                onValueChange={(value) => toggleOverlay(setShowTasks, value)}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showTasks ? '#fff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🛡️</Text>
              <Text style={styles.featureText}>Safe Spots</Text>
              <Switch 
                value={showSafePoints} 
                onValueChange={(value) => toggleOverlay(setShowSafePoints, value)}
                trackColor={{ false: '#e0e0e0', true: '#0021A5' }}
                thumbColor={showSafePoints ? '#fff' : '#f4f3f4'}
              />
            </View>
          </>
        )}
      </View>

      <MapView 
        key={mapRefreshKey}
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
            pinColor="#FF6B35" // UF Orange for all tasks
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
        {/* The polyline approach is removed, so this section is now empty */}
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

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.modalScrollContent} 
              contentContainerStyle={styles.modalScrollContentContainer}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
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

              {/* Delivery Route Information for Delivery Tasks */}
              {selectedTask.isDelivery && selectedTask.pickupLocation && selectedTask.dropoffLocation && (
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTitle}>🚚 Delivery Route</Text>
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeDetail}>
                      📍 <Text style={styles.routeLabel}>Pickup:</Text> {selectedTask.pickupLocation.address || `${selectedTask.pickupLocation.latitude.toFixed(4)}, ${selectedTask.pickupLocation.longitude.toFixed(4)}`}
                    </Text>
                    <Text style={styles.routeDetail}>
                      🎯 <Text style={styles.routeLabel}>Dropoff:</Text> {selectedTask.dropoffLocation.address || `${selectedTask.dropoffLocation.latitude.toFixed(4)}, ${selectedTask.dropoffLocation.longitude.toFixed(4)}`}
                    </Text>
                    <Text style={styles.routeNote}>
                      💡 Navigation will show a two-stop route: your location → pickup → dropoff
                    </Text>
                  </View>
                </View>
              )}

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>
                    {selectedTask.isDelivery ? 'Delivery Route' : 'UF Campus Area'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>⏱️</Text>
                  <Text style={styles.detailText}>
                    {selectedTask.isDelivery ? '25-35 min' : '15-20 min'}
                  </Text>
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
                    onPress={() => {
                      console.log('🔘 Accept button pressed!');
                      acceptTask(selectedTask);
                    }}
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
            </ScrollView>
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
    height: '85%', // Fixed height instead of maxHeight
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
  modalScrollContent: {
    flex: 1, // This makes it take up the remaining space after the header
  },
  modalScrollContentContainer: {
    paddingBottom: 20, // Add padding at the bottom of the scrollable content
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
    marginHorizontal: 20, // This aligns with the text above
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
    gap: 8,
  },
  routeDetail: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  routeLabel: {
    fontWeight: '600',
    color: '#333',
  },
  routeNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
