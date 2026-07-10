import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationPanel from '../components/NotificationPanel';

export default function MainLayout() {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 transition-colors duration-300 font-sans relative overflow-hidden">
      {/* Decorative gradient glowing lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse-slow pointer-events-none"></div>

      {/* 1. Sidebar Left Panel */}
      <Sidebar />

      {/* 2. Main Content Right Panel */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenNotifications={() => setNotificationOpen(true)} />

        {/* Scrollable inner view */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto z-10 flex flex-col justify-between">
          <div className="space-y-6 md:space-y-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* 3. Notifications Drawer Overlays */}
      <NotificationPanel 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
    </div>
  );
}
