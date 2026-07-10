import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Helper to determine if a collection is empty
async function isCollectionEmpty(collectionName) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(query(colRef, limit(1)));
    return snap.empty;
  } catch (error) {
    console.warn(`Firestore read warning for ${collectionName}:`, error.message);
    return true;
  }
}

export const firestoreService = {
  // 1. HVAC control overrides inside Rooms
  async updateRoomControl(roomId, type, value) {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const updates = { 
        [type]: value,
        lastUpdated: serverTimestamp()
      };
      
      // Dynamically estimate power change for demonstration feedback
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        let powerAdjustment = 0;
        if (type === 'hvac') powerAdjustment = value ? 5 : -5; // maps to cooling
        if (type === 'fan') powerAdjustment = value ? 8 : -8; // maps to heating
        if (type === 'light') powerAdjustment = value ? 2 : -2;

        const currentPower = roomData.power || 15;
        updates.power = Math.max(1, currentPower + powerAdjustment);
      }

      await updateDoc(roomRef, updates);
      return { success: true };
    } catch (error) {
      console.error("Firestore Error: Failed to update room control.", error);
      throw error;
    }
  },

  // 2. Equipment power state updates
  async updateEquipmentState(eqId, status) {
    try {
      const eqRef = doc(db, 'equipment', eqId);
      const updates = { status };
      
      // Adjust simulated load based on status
      if (status === 'Active') {
        updates.load = eqId === 'eq-1' ? 45.0 : (eqId === 'eq-2' ? 32.0 : 1.2);
        updates.idleTime = 0;
      } else if (status === 'Idle') {
        updates.load = 0.8;
      } else {
        updates.load = 0.0;
      }

      await updateDoc(eqRef, updates);
      return { success: true };
    } catch (error) {
      console.error("Firestore Error: Failed to update equipment state.", error);
      throw error;
    }
  },

  // 3. Alert resolution/acknowledgement
  async resolveAlert(alertId) {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, { resolved: true });
      return { success: true };
    } catch (error) {
      console.error("Firestore Error: Failed to resolve alert.", error);
      throw error;
    }
  },

  // 4. Manual alert insertion (simulated threshold breach)
  async triggerAlert(severity, department, message, sensor, value) {
    try {
      const alertsRef = collection(db, 'alerts');
      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
      
      const newAlert = {
        severity,
        department,
        message,
        sensor,
        value,
        timestamp: dateStr,
        resolved: false
      };
      
      const docRef = await addDoc(alertsRef, newAlert);
      return { id: docRef.id, ...newAlert };
    } catch (error) {
      console.error("Firestore Error: Failed to inject alert.", error);
      throw error;
    }
  },

  // 5. Threshold settings updates
  async updateSettings(settingsData) {
    try {
      const settingsRef = doc(db, 'settings', 'global_bems_config');
      await setDoc(settingsRef, settingsData);
      return { success: true };
    } catch (error) {
      console.error("Firestore Error: Failed to commit settings.", error);
      throw error;
    }
  },

  // 6. DB Seeding Pipeline (critical for presentation runs on empty projects)
  async seedFirestoreInitialData() {
    try {
      // Seed Settings
      if (await isCollectionEmpty('settings')) {
        console.log("Seeding settings collection...");
        await setDoc(doc(db, 'settings', 'global_bems_config'), {
          hvacTempMin: 18.0,
          hvacTempMax: 26.0,
          co2Threshold: 800,
          voltageTolerance: 10.0,
          currentThreshold: 150.0,
          loadSheddingMode: 'Manual',
          notificationsEnabled: true
        });
      }

      // Seed Rooms
      if (await isCollectionEmpty('rooms')) {
        console.log("Seeding rooms collection...");
        const defaultRooms = [
          { roomId: 'icu', roomName: 'ICU Wing B', department: 'ICU', temperature: 21.5, humidity: 48, voltage: 230, current: 150, power: 34.5, energy: 412, occupancy: 12, maxOccupancy: 15, status: 'Normal', hvac: true, light: true, fan: false, equipmentStatus: 'Stable' },
          { roomId: 'ot1', roomName: 'Operation Theatre 1', department: 'Operation Theatre', temperature: 18.0, humidity: 55, voltage: 230, current: 209.5, power: 48.2, energy: 620, occupancy: 6, maxOccupancy: 8, status: 'Normal', hvac: true, light: true, fan: false, equipmentStatus: 'Optimal' },
          { roomId: 'emerg', roomName: 'Emergency ER', department: 'Emergency', temperature: 22.0, humidity: 50, voltage: 230, current: 122.1, power: 28.1, energy: 380, occupancy: 24, maxOccupancy: 30, status: 'Warning', hvac: true, light: true, fan: false, equipmentStatus: 'Check Sensors' },
          { roomId: 'lab', roomName: 'Central Lab', department: 'Laboratory', temperature: 20.2, humidity: 45, voltage: 230, current: 81.3, power: 18.7, energy: 240, occupancy: 8, maxOccupancy: 12, status: 'Normal', hvac: true, light: true, fan: false, equipmentStatus: 'Stable' },
          { roomId: 'pharm', roomName: 'Pharmacy Store', department: 'Pharmacy', temperature: 4.5, humidity: 40, voltage: 230, current: 53.9, power: 12.4, energy: 180, occupancy: 2, maxOccupancy: 5, status: 'Normal', hvac: true, light: true, fan: false, equipmentStatus: 'Stable' },
          { roomId: 'ward-a', roomName: 'General Ward A', department: 'General Ward', temperature: 23.1, humidity: 52, voltage: 230, current: 66.0, power: 15.2, energy: 215, occupancy: 18, maxOccupancy: 20, status: 'Normal', hvac: false, light: true, fan: true, equipmentStatus: 'Stable' }
        ];
        
        for (const rm of defaultRooms) {
          await setDoc(doc(db, 'rooms', rm.roomId), {
            ...rm,
            lastUpdated: serverTimestamp()
          });
        }
      }

      // Seed Equipment
      if (await isCollectionEmpty('equipment')) {
        console.log("Seeding equipment collection...");
        const defaultEquipment = [
          { id: 'eq-1', name: 'Siemens Magnetom MRI', dept: 'Radiology', load: 45.0, status: 'Active', idleTime: 12, health: 96, powerFactor: 0.94 },
          { id: 'eq-2', name: 'GE Revolution CT Scanner', dept: 'Radiology', load: 0.8, status: 'Idle', idleTime: 145, health: 88, powerFactor: 0.72 },
          { id: 'eq-3', name: 'Hamilton C6 Ventilator', dept: 'ICU Wing B', load: 1.2, status: 'Active', idleTime: 0, health: 99, powerFactor: 0.96 },
          { id: 'eq-4', name: 'Varian Halcyon Linear Accelerator', dept: 'Oncology', load: 0.2, status: 'Off', idleTime: 480, health: 91, powerFactor: 0.0 }
        ];
        
        for (const eq of defaultEquipment) {
          await setDoc(doc(db, 'equipment', eq.id), eq);
        }
      }

      // Seed Alerts
      if (await isCollectionEmpty('alerts')) {
        console.log("Seeding alerts collection...");
        const defaultAlerts = [
          { severity: 'Critical', department: 'ICU Wing B', message: 'Power spike: voltage exceeded safety limit of 245V.', sensor: 'Voltage Transducer', value: '248.2 V', timestamp: '2026-07-10 14:15:22', resolved: false },
          { severity: 'Warning', department: 'Pharmacy Cold Store', message: 'Temperature breach: cooling system efficiency dropped.', sensor: 'Temp Sensor 14', value: '7.8 °C', timestamp: '2026-07-10 16:32:10', resolved: false },
          { severity: 'Normal', department: 'Operation Theatre 1', message: 'HVAC scheduled air cycle completed.', sensor: 'Flow Controller', value: 'Normal', timestamp: '2026-07-10 18:01:05', resolved: true }
        ];
        
        for (const al of defaultAlerts) {
          await addDoc(collection(db, 'alerts'), al);
        }
      }

      // Seed Predictions (for AI Insights Page)
      if (await isCollectionEmpty('predictions')) {
        console.log("Seeding predictions collection...");
        const defaultPredictions = {
          forecastData: [
            { day: 'Mon', actual: 180, predicted: 182 },
            { day: 'Tue', actual: 195, predicted: 190 },
            { day: 'Wed', actual: 210, predicted: 208 },
            { day: 'Thu', actual: null, predicted: 225 },
            { day: 'Fri', actual: null, predicted: 230 },
            { day: 'Sat', actual: null, predicted: 160 },
            { day: 'Sun', actual: null, predicted: 155 }
          ],
          recommendations: [
            { id: 1, type: 'hvac', priority: 'High', message: 'Optimize OT HVAC cooling flow cycle between 02:00 - 05:00. Estimated savings: 45 kWh.', savings: '45 kWh', impact: 'High' },
            { id: 2, type: 'idle', priority: 'Medium', message: 'CT Scanner has been in idle state for over 2 hours. Suggest stand-by mode. Estimated savings: 12 kWh.', savings: '12 kWh', impact: 'Medium' },
            { id: 3, type: 'peak', priority: 'High', message: 'Peak Load predicted on Thursday at 14:00. Enable cooling precooling in wards starting 12:00.', savings: '78 kWh', impact: 'High' }
          ],
          anomalies: [
            { id: 101, timestamp: '2026-07-10 10:22', department: 'Emergency ER', parameter: 'Current Draw', message: 'Unusual current spike (+40%) detected without occupancy increment.', severity: 'Warning' }
          ]
        };
        await setDoc(doc(db, 'predictions', 'bems_ml_insights'), defaultPredictions);
      }

      // Seed Energy Logs (for Reports Page)
      if (await isCollectionEmpty('energy_logs')) {
        console.log("Seeding energy_logs collection...");
        const defaultLogs = [
          { time: '2026-07-10 18:00', dept: 'ICU Wing B', kw: 34.5, pf: 0.94, temp: 21.5, status: 'Normal' },
          { time: '2026-07-10 18:00', dept: 'Operation Theatre 1', kw: 48.2, pf: 0.96, temp: 18.0, status: 'Normal' },
          { time: '2026-07-10 18:00', dept: 'Emergency ER', kw: 28.1, pf: 0.89, temp: 22.0, status: 'Warning' },
          { time: '2026-07-10 18:00', dept: 'Central Lab', kw: 18.7, pf: 0.92, temp: 20.2, status: 'Normal' },
          { time: '2026-07-10 18:00', dept: 'Pharmacy Store', kw: 12.4, pf: 0.91, temp: 4.5, status: 'Normal' },
          { time: '2026-07-10 18:00', dept: 'General Ward A', kw: 15.2, pf: 0.92, temp: 23.1, status: 'Normal' }
        ];
        
        for (const log of defaultLogs) {
          await addDoc(collection(db, 'energy_logs'), log);
        }
      }

      console.log("SHEMS Firestore: Seed database check finished.");
    } catch (e) {
      console.warn("SHEMS Firestore: Seeding process warning.", e.message);
    }
  }
};
