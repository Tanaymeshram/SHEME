import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FirebaseProvider } from './context/FirebaseContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <FirebaseProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </FirebaseProvider>
  );
}
