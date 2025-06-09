import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  function toggleSidebar() {
    setSidebarOpen(prev => !prev);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col">
        <Navbar username="João Visionário" onToggleSidebar={toggleSidebar} />
        <main className="p-6 bg-white min-h-screen">{children}</main>
      </div>
    </div>
  );
}
