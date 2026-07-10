import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useLocalStorage('shems_theme', 'dark');
  const [systemOnline, setSystemOnline] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Poll live telemetry parameters and active alerts
  useEffect(() => {
    if (!user) return;

    const fetchLiveFeed = async () => {
      try {
        const data = await api.getLiveDashboard();
        setLiveData(data);
        
        const listAlerts = await api.getAlerts();
        setAlerts(listAlerts);
        
        setSystemOnline(true);
      } catch (err) {
        console.error("Gateway live polling failure:", err);
        setSystemOnline(false);
      }
    };

    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 3000); // 3-second heartbeat loop
    return () => clearInterval(interval);
  }, [user]);

  // Load Rooms, Equipment, and Settings once authenticated
  useEffect(() => {
    if (!user) return;

    const loadCoreData = async () => {
      try {
        const listRooms = await api.getRooms();
        setRooms(listRooms);
        
        const listEq = await api.getEquipment();
        setEquipment(listEq);

        const activeSettings = await api.getSettings();
        setSettings(activeSettings);
      } catch (err) {
        console.error("Error loading core data:", err);
      }
    };
    loadCoreData();
  }, [user]);

  // Sync page theme class on body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

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
    setLiveData(null);
    setAlerts([]);
    setRooms([]);
    setEquipment([]);
  };

  // HVAC Climate Controls
  const toggleRoomControl = async (roomId, controlType, value) => {
    try {
      const result = await api.updateRoomControl(roomId, controlType, value);
      if (result.success) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, [controlType]: value, power: result.room.power } : r));
      }
    } catch (error) {
      console.error("HVAC control update failed:", error);
    }
  };

  // Equipment Power Controls
  const changeEquipmentState = async (eqId, newStatus) => {
    try {
      const result = await api.toggleEquipmentState(eqId, newStatus);
      if (result.success) {
        setEquipment(prev => prev.map(e => e.id === eqId ? { ...e, status: newStatus, load: result.eq.load, idleTime: result.eq.idleTime } : e));
      }
    } catch (error) {
      console.error("Equipment status update failed:", error);
    }
  };

  // Settings updates
  const saveSettings = async (newSettings) => {
    try {
      const result = await api.updateSettings(newSettings);
      if (result.success) {
        setSettings(result.settings);
        return true;
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
    return false;
  };

  // Alert Actions
  const acknowledgeAlert = async (alertId) => {
    try {
      const result = await api.resolveAlert(alertId);
      if (result.success) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
      }
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  // Action to manually inject a spike alert for presentation/test purposes
  const injectMockSpike = async (dept) => {
    try {
      const newAlert = await api.triggerMockSpikeAlert(dept);
      setAlerts(prev => [newAlert, ...prev]);
    } catch (error) {
      console.error("Mock alert trigger failed:", error);
    }
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
      theme,
      systemOnline,
      loading,
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
