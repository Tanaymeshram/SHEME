import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirebase } from './FirebaseContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useLocalStorage('shems_theme', 'dark');
  const [systemOnline, setSystemOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Consume Cloud Firestore database subscriptions
  const {
    rooms,
    alerts,
    predictions,
    equipment,
    settings,
    loading: firebaseLoading,
    toggleRoomControl,
    changeEquipmentState,
    saveSettings,
    acknowledgeAlert,
    injectMockSpike
  } = useFirebase();

  // Check user session and gateway connectivity on mount
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const activeUser = api.getCurrentUser();
      if (activeUser) {
        setUser(activeUser);
      }
      
      try {
        await api.ping();
        setSystemOnline(true);
      } catch {
        setSystemOnline(false);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Sync page theme class on body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Derive dynamic live BEMS parameters for the Dashboard
  const totalPower = rooms.reduce((acc, r) => acc + (r.power || 0), 0) + 
                     equipment.reduce((acc, eq) => acc + (eq.status === 'Active' ? (eq.load || 0) : 0), 0);
  
  const totalEnergy = rooms.reduce((acc, r) => acc + (r.energy || 0), 0);

  const avgTemp = rooms.length > 0 
    ? rooms.reduce((acc, r) => acc + (r.temperature || 0), 0) / rooms.length 
    : 21.5;

  const avgHumidity = rooms.length > 0 
    ? rooms.reduce((acc, r) => acc + (r.humidity || 0), 0) / rooms.length 
    : 50.0;

  const avgCo2 = rooms.length > 0 
    ? rooms.reduce((acc, r) => acc + (r.co2 || 420), 0) / rooms.length 
    : 450;

  const totalOccupancy = rooms.reduce((acc, r) => acc + (r.occupancy || 0), 0);
  const occupiedRooms = rooms.filter(r => r.occupancy > 0).length;
  const emptyRooms = rooms.filter(r => r.occupancy === 0).length;

  const avgEqHealth = equipment.length > 0
    ? equipment.reduce((acc, eq) => acc + (eq.health || 100), 0) / equipment.length
    : 95;

  // Build department-wise states for Dashboard widgets
  const departments = {};
  rooms.forEach(room => {
    const deptKey = room.department === 'Operation Theatre' ? 'OT' : 
                    room.department === 'General Ward' ? 'Ward' : 
                    room.department; // ICU, Emergency, Laboratory, Pharmacy
    if (['ICU', 'OT', 'Ward', 'Emergency'].includes(deptKey)) {
      departments[deptKey] = {
        temperature: room.temperature,
        humidity: room.humidity,
        co2: room.co2 || 420,
        voltage: room.voltage || 230,
        current: room.current || 50,
        occupancy: room.occupancy,
        equipment_health: room.roomId === 'icu' ? 98 : (room.roomId === 'ot1' ? 99 : (room.roomId === 'ward-a' ? 92 : 89)),
        status: room.status
      };
    }
  });

  // Local live streaming load simulation
  const [liveTrend, setLiveTrend] = useState([]);
  useEffect(() => {
    if (rooms.length === 0) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    setLiveTrend(prev => {
      const nextTrend = [...prev, {
        time: timeStr,
        consumption: totalPower,
        voltage: rooms[0]?.voltage || 230,
        carbon: totalPower * 0.475
      }];
      if (nextTrend.length > 25) nextTrend.shift();
      return nextTrend;
    });
  }, [totalPower, rooms]);

  const activeAlerts = alerts.filter(a => !a.resolved);

  const liveData = {
    kpis: {
      total_energy_consumption_kw: totalPower,
      live_voltage_v: rooms[0]?.voltage || 230.0,
      live_current_a: (totalPower * 1000) / ((rooms[0]?.voltage || 230) * 0.92),
      avg_temperature_c: avgTemp,
      avg_humidity_p: avgHumidity,
      avg_co2_ppm: avgCo2,
      occupancy_status: totalOccupancy,
      total_rooms: rooms.length,
      occupied_rooms: occupiedRooms,
      empty_rooms: emptyRooms,
      total_energy_kwh: totalEnergy,
      equipment_health_score: avgEqHealth,
      active_alerts: activeAlerts.length
    },
    departments,
    live_trend: liveTrend,
    recent_alerts: alerts
  };

  // User Actions
  const handleLogin = async (username, password) => {
    const loggedUser = await api.login(username, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const handleRegister = async (username, password, name, role) => {
    return await api.register(username, password, name, role);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppContext.Provider value={{
      user,
      liveData,
      alerts,
      rooms,
      equipment,
      settings,
      predictions,
      theme,
      systemOnline,
      loading: loading || firebaseLoading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      toggleRoomControl,
      changeEquipmentState,
      saveSettings,
      acknowledgeAlert,
      injectMockSpike,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
