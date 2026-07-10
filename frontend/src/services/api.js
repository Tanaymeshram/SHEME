const API_BASE = '/api';

// Helper to determine if we should fall back to mock data
let useMock = true;

// Verify backend status asynchronously
const detectBackend = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${API_BASE}/ping`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      useMock = false;
      console.log("SHEMS: Connected to live FastAPI backend.");
    }
  } catch (err) {
    useMock = true;
    console.log("SHEMS: Backend offline. Falling back to local simulated telemetry feed.");
  }
};

// Execute check immediately
detectBackend();

// Mock Data Generators for Local Sandbox
const MOCK_USERS_KEY = 'shems_mock_users';
const defaultUsers = [
  { username: 'admin', password: 'admin123', name: 'Dr. Sarah Jenkins', role: 'Admin' },
  { username: 'manager', password: 'manager123', name: 'Mark Vance', role: 'Energy Manager' },
  { username: 'tech', password: 'tech123', name: 'Alex Rivera', role: 'Technician' }
];

const getMockUsers = () => {
  const users = localStorage.getItem(MOCK_USERS_KEY);
  if (!users) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

// Telemetry state simulation
let mockTrendData = Array.from({ length: 20 }, (_, i) => ({
  time: `${12 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
  consumption: 120 + Math.random() * 40,
  voltage: 230 + (Math.random() - 0.5) * 6,
  carbon: 57 + Math.random() * 12
}));

let mockAlerts = [
  { id: '1', severity: 'Critical', department: 'ICU Wing B', message: 'Power spike: voltage exceeded safety limit of 245V.', sensor: 'Voltage Transducer', value: '248.2 V', timestamp: '2026-07-10 14:15:22', resolved: false },
  { id: '2', severity: 'Warning', department: 'Pharmacy Cold Store', message: 'Temperature breach: cooling system efficiency dropped.', sensor: 'Temp Sensor 14', value: '7.8 °C', timestamp: '2026-07-10 16:32:10', resolved: false },
  { id: '3', severity: 'Normal', department: 'Operation Theatre 1', message: 'HVAC scheduled air cycle completed.', sensor: 'Flow Controller', value: 'Normal', timestamp: '2026-07-10 18:01:05', resolved: true }
];

const roomsData = [
  { id: 'icu', name: 'ICU Wing B', temp: 21.5, humidity: 48, co2: 420, power: 34.5, occupancy: 12, maxOccupancy: 15, status: 'Normal', cooling: true, heating: false, lighting: true },
  { id: 'ot1', name: 'Operation Theatre 1', temp: 18.0, humidity: 55, co2: 380, power: 48.2, occupancy: 6, maxOccupancy: 8, status: 'Normal', cooling: true, heating: false, lighting: true },
  { id: 'emerg', name: 'Emergency ER', temp: 22.0, humidity: 50, co2: 490, power: 28.1, occupancy: 24, maxOccupancy: 30, status: 'Warning', cooling: true, heating: false, lighting: true },
  { id: 'lab', name: 'Central Lab', temp: 20.2, humidity: 45, co2: 440, power: 18.7, occupancy: 8, maxOccupancy: 12, status: 'Normal', cooling: true, heating: false, lighting: true },
  { id: 'pharm', name: 'Pharmacy Store', temp: 4.5, humidity: 40, co2: 390, power: 12.4, occupancy: 2, maxOccupancy: 5, status: 'Normal', cooling: true, heating: false, lighting: true },
  { id: 'ward-a', name: 'General Ward A', temp: 23.1, humidity: 52, co2: 580, power: 15.2, occupancy: 18, maxOccupancy: 20, status: 'Normal', cooling: false, heating: true, lighting: true }
];

const mockEquipment = [
  { id: 'eq-1', name: 'Siemens Magnetom MRI', dept: 'Radiology', load: 45.0, status: 'Active', idleTime: 12, health: 96, powerFactor: 0.94 },
  { id: 'eq-2', name: 'GE Revolution CT Scanner', dept: 'Radiology', load: 0.8, status: 'Idle', idleTime: 145, health: 88, powerFactor: 0.72 },
  { id: 'eq-3', name: 'Hamilton C6 Ventilator', dept: 'ICU Wing B', load: 1.2, status: 'Active', idleTime: 0, health: 99, powerFactor: 0.96 },
  { id: 'eq-4', name: 'Varian Halcyon Linear Accelerator', dept: 'Oncology', load: 0.2, status: 'Off', idleTime: 480, health: 91, powerFactor: 0.0 }
];

let mockSettings = {
  hvacTempMin: 18.0,
  hvacTempMax: 26.0,
  co2Threshold: 800,
  voltageTolerance: 10.0,
  currentThreshold: 150.0,
  loadSheddingMode: 'Manual',
  notificationsEnabled: true
};

export const api = {
  // Check backend server status
  async ping() {
    if (useMock) return { status: 'online', mode: 'sandbox' };
    const res = await fetch(`${API_BASE}/ping`);
    return res.json();
  },

  // Auth operations
  async login(username, password) {
    if (useMock) {
      const users = getMockUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) throw new Error('Access Denied. Check credentials.');
      const userWithoutPass = { username: user.username, name: user.name, role: user.role };
      localStorage.setItem('sheme_user', JSON.stringify(userWithoutPass));
      return userWithoutPass;
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('sheme_user', JSON.stringify(data.user));
    return data.user;
  },

  async register(username, password, name, role) {
    if (useMock) {
      const users = getMockUsers();
      if (users.find(u => u.username === username)) throw new Error('Username already exists.');
      users.push({ username, password, name, role });
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      return { success: true, message: 'Account registered successfully.' };
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  getCurrentUser() {
    const user = localStorage.getItem('sheme_user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('sheme_user');
  },

  // Telemetry Dashboard
  async getLiveDashboard() {
    if (useMock) {
      // Dynamic live stream simulation
      const lastVal = mockTrendData[mockTrendData.length - 1];
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      
      const newConsumption = Math.max(80, Math.min(250, lastVal.consumption + (Math.random() - 0.5) * 15));
      const newVoltage = Math.max(220, Math.min(245, lastVal.voltage + (Math.random() - 0.5) * 2));
      const newCarbon = newConsumption * 0.475;

      mockTrendData.push({ time: timeStr, consumption: newConsumption, voltage: newVoltage, carbon: newCarbon });
      if (mockTrendData.length > 25) mockTrendData.shift();

      const activeAlerts = mockAlerts.filter(a => !a.resolved);
      const totalLoad = mockTrendData.reduce((acc, curr) => acc + curr.consumption, 0) / mockTrendData.length;

      return {
        kpis: {
          total_energy_consumption_kw: newConsumption,
          live_voltage_v: newVoltage,
          live_current_a: (newConsumption * 1000) / (newVoltage * 0.92), // Power factor = 0.92
          avg_temperature_c: 21.2 + Math.sin(now.getTime() / 10000) * 1.5,
          avg_humidity_p: 48.5 + Math.cos(now.getTime() / 15000) * 2,
          avg_co2_ppm: Math.floor(420 + Math.random() * 30),
          occupancy_status: roomsData.reduce((acc, curr) => acc + curr.occupancy, 0),
          equipment_health_score: 94.5,
          active_alerts: activeAlerts.length
        },
        departments: {
          ICU: { temperature: roomsData[0].temp, humidity: roomsData[0].humidity, co2: roomsData[0].co2, voltage: newVoltage, current: 152.0, occupancy: roomsData[0].occupancy, equipment_health: 98, status: 'Normal' },
          OT: { temperature: roomsData[1].temp, humidity: roomsData[1].humidity, co2: roomsData[1].co2, voltage: newVoltage, current: 210.0, occupancy: roomsData[1].occupancy, equipment_health: 99, status: 'Normal' },
          Ward: { temperature: roomsData[5].temp, humidity: roomsData[5].humidity, co2: roomsData[5].co2, voltage: newVoltage, current: 66.0, occupancy: roomsData[5].occupancy, equipment_health: 92, status: 'Normal' },
          Emergency: { temperature: roomsData[2].temp, humidity: roomsData[2].humidity, co2: roomsData[2].co2, voltage: newVoltage, current: 122.0, occupancy: roomsData[2].occupancy, equipment_health: 89, status: 'Warning' }
        },
        live_trend: [...mockTrendData],
        recent_alerts: [...mockAlerts]
      };
    }

    const res = await fetch(`${API_BASE}/dashboard/live`);
    if (!res.ok) throw new Error('Failed to fetch dashboard feed.');
    return res.json();
  },

  // Rooms Page Actions
  async getRooms() {
    if (useMock) {
      return [...roomsData];
    }
    const res = await fetch(`${API_BASE}/rooms`);
    return res.json();
  },

  async updateRoomControl(roomId, type, value) {
    if (useMock) {
      const room = roomsData.find(r => r.id === roomId);
      if (room) {
        room[type] = value;
        // Adjust power dynamically
        if (type === 'cooling') room.power = value ? room.power + 5 : room.power - 5;
        if (type === 'heating') room.power = value ? room.power + 8 : room.power - 8;
        if (type === 'lighting') room.power = value ? room.power + 2 : room.power - 2;
        room.power = Math.max(1, room.power);
      }
      return { success: true, room };
    }
    const res = await fetch(`${API_BASE}/rooms/${roomId}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value })
    });
    return res.json();
  },

  // Equipment Page Actions
  async getEquipment() {
    if (useMock) {
      return [...mockEquipment];
    }
    const res = await fetch(`${API_BASE}/equipment`);
    return res.json();
  },

  async toggleEquipmentState(eqId, status) {
    if (useMock) {
      const eq = mockEquipment.find(e => e.id === eqId);
      if (eq) {
        eq.status = status;
        if (status === 'Active') {
          eq.load = eqId === 'eq-1' ? 45.0 : (eqId === 'eq-2' ? 32.0 : 1.2);
          eq.idleTime = 0;
        } else if (status === 'Idle') {
          eq.load = 0.8;
        } else {
          eq.load = 0.0;
        }
      }
      return { success: true, eq };
    }
    const res = await fetch(`${API_BASE}/equipment/${eqId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Energy Monitoring Page
  async getEnergyMonitoring() {
    if (useMock) {
      return {
        dailyLoads: [
          { name: '00:00', baseload: 80, peakload: 90, solar: 0 },
          { name: '04:00', baseload: 78, peakload: 85, solar: 0 },
          { name: '08:00', baseload: 120, peakload: 160, solar: 20 },
          { name: '12:00', baseload: 150, peakload: 220, solar: 55 },
          { name: '16:00', baseload: 140, peakload: 195, solar: 35 },
          { name: '20:00', baseload: 110, peakload: 130, solar: 0 }
        ],
        phaseDetails: {
          phaseA: { voltage: 231.2, current: 85.4, powerFactor: 0.93 },
          phaseB: { voltage: 229.8, current: 88.1, powerFactor: 0.91 },
          phaseC: { voltage: 230.5, current: 82.9, powerFactor: 0.92 }
        }
      };
    }
    const res = await fetch(`${API_BASE}/energy/monitoring`);
    if (!res.ok) throw new Error('Failed to fetch energy telemetry.');
    return res.json();
  },

  // AI Analytics & Insights
  async getAIAnalytics() {
    if (useMock) {
      return {
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
    }
    const res = await fetch(`${API_BASE}/analytics/ai`);
    if (!res.ok) throw new Error('Failed to compile AI insights.');
    return res.json();
  },

  // Settings Configurations
  async getSettings() {
    if (useMock) {
      return { ...mockSettings };
    }
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch configurations.');
    return res.json();
  },

  async updateSettings(settingsData) {
    if (useMock) {
      mockSettings = { ...mockSettings, ...settingsData };
      return { success: true, settings: mockSettings };
    }
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) throw new Error('Failed to update configurations.');
    return res.json();
  },

  // Alert Management
  async getAlerts() {
    if (useMock) {
      return [...mockAlerts];
    }
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async resolveAlert(alertId) {
    if (useMock) {
      const alert = mockAlerts.find(a => a.id === alertId);
      if (alert) alert.resolved = true;
      return { success: true, alert };
    }
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to resolve alert.');
    return res.json();
  },

  async triggerMockSpikeAlert(dept) {
    const alertId = (mockAlerts.length + 1).toString();
    const newAlert = {
      id: alertId,
      severity: 'Critical',
      department: dept || 'Laboratory',
      message: `Emergency trigger: Sudden load breach detected in local grids.`,
      sensor: 'Current Transformer',
      value: '220.4 A',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      resolved: false
    };
    mockAlerts.unshift(newAlert);
    return newAlert;
  },

  // Report Download Trigger
  async downloadReport(reportType, format) {
    if (useMock) {
      // Create a mock client-side download blob
      const csvContent = "data:text/csv;charset=utf-8,Timestamp,Department,KPI,Value\n" + 
        `2026-07-10 14:00,ICU Wing B,Energy Load,34.5 kW\n` +
        `2026-07-10 14:00,Operation Theatre,Energy Load,48.2 kW\n` +
        `2026-07-10 14:00,Emergency ER,Energy Load,28.1 kW\n` +
        `2026-07-10 14:00,Central Lab,Energy Load,18.7 kW`;
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      
      const ext = format === 'excel' ? 'xls' : (format === 'pdf' ? 'pdf' : 'csv');
      link.setAttribute("download", `SHEMS_${reportType.replace(/ /g, '_')}_Report.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_type: reportType, format: format })
    });
    if (!res.ok) throw new Error('Failed to download report.');
    
    // Get raw blob
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const ext = format === 'excel' ? 'xls' : (format === 'pdf' ? 'html' : 'csv');
    a.download = `SHEME_${reportType.replace(/ /g, '_')}_Report.${ext}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
