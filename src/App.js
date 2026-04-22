import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomeScreen from './Screens/HomeScreen';
import About from './Screens/About';
import ServiceScreen from './Screens/ServiceScreen';
import ContactUs from './Screens/ContactUs';
import LoginScreen from './Screens/LoginScreen';
import SignUpScreen from './Screens/SignUpScreen';
import Dashboard from './Screens/Dashboard';
import Unauthorized from './Screens/Unauthorized';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import ProtectedRoute from './Components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <main>
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
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Add other role-based routes here as they are created */}
          {/* 
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manager/*" element={<ProtectedRoute allowedRoles={['superadmin', 'manager']}><ManagerDashboard /></ProtectedRoute>} />
          */}

        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;