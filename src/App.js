import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeScreen from './Screens/HomeScreen';
import About from './Screens/About';
import ServiceScreen from './Screens/ServiceScreen';
import ContactUs from './Screens/ContactUs';
import LoginScreen from './Screens/LoginScreen';
import SignUpScreen from './Screens/SignUpScreen';
import Dashboard from './Screens/QueryManagement.jsx';
import Unauthorized from './Screens/Unauthorized';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import ProtectedRoute from './Components/ProtectedRoute';
import './App.css';
import SuperAdminDashboard from './Screens/dashboards/SuperAdminDashboard';
import ManagerDashboard from './Screens/dashboards/ManagerDashboard';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeScreen />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/our-services" element={<ServiceScreen />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'manager']}>
                {user?.role === 'superadmin' ? <SuperAdminDashboard /> : <ManagerDashboard />}
              </ProtectedRoute>
            } 
          />
          
          {/* Add other role-based routes here as they are created */}
          {/* 
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/manager/*" element={<ProtectedRoute allowedRoles={['superadmin', 'manager']}><ManagerDashboard /></ProtectedRoute>} />
          */}

        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;