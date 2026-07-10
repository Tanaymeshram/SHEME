import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { firestoreService } from '../services/firestoreService';

const FirebaseContext = createContext();

export function FirebaseProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and seed empty Firestore collections
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await firestoreService.seedFirestoreInitialData();
      } catch (err) {
        console.warn("Firestore database initialization note:", err.message);
      }
    };
    initializeDatabase();
  }, []);

  // Set up real-time listener for "rooms"
  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('roomName', 'asc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(items);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore listener warning (rooms):", err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set up real-time listener for "alerts"
  useEffect(() => {
    const alertsRef = collection(db, 'alerts');
    const q = query(alertsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlerts(items);
      },
      (err) => {
        console.warn("Firestore listener warning (alerts):", err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set up real-time listener for "predictions" (BEMS ML document)
  useEffect(() => {
    const predRef = doc(db, 'predictions', 'bems_ml_insights');
    
    const unsubscribe = onSnapshot(predRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setPredictions(docSnap.data());
        }
      },
      (err) => {
        console.warn("Firestore listener warning (predictions):", err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set up real-time listener for "equipment"
  useEffect(() => {
    const eqRef = collection(db, 'equipment');
    
    const unsubscribe = onSnapshot(eqRef, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipment(items);
      },
      (err) => {
        console.warn("Firestore listener warning (equipment):", err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Set up real-time listener for "settings" (Global config document)
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global_bems_config');
    
    const unsubscribe = onSnapshot(settingsRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      },
      (err) => {
        console.warn("Firestore listener warning (settings):", err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Database mutation wrappers
  const toggleRoomControl = async (roomId, type, value) => {
    // Maintain backwards compatibility: ui specifies cooling, heating, lighting
    // Firestore fields: hvac (cooling), fan (heating), light (lighting)
    const dbField = type === 'cooling' ? 'hvac' : (type === 'heating' ? 'fan' : 'light');
    return await firestoreService.updateRoomControl(roomId, dbField, value);
  };

  const changeEquipmentState = async (eqId, status) => {
    return await firestoreService.updateEquipmentState(eqId, status);
  };

  const saveSettings = async (settingsData) => {
    return await firestoreService.updateSettings(settingsData);
  };

  const acknowledgeAlert = async (alertId) => {
    return await firestoreService.resolveAlert(alertId);
  };

  const injectMockSpike = async (department) => {
    return await firestoreService.triggerAlert(
      'Critical',
      department || 'Laboratory',
      'Spike breach: Current draw exceeded warning limits in micro-grid.',
      'Current Transformer',
      '228.4 A'
    );
  };

  return (
    <FirebaseContext.Provider value={{
      rooms,
      alerts,
      predictions,
      equipment,
      settings,
      loading,
      toggleRoomControl,
      changeEquipmentState,
      saveSettings,
      acknowledgeAlert,
      injectMockSpike
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
