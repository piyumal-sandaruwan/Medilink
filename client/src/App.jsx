import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public Pages
import Home from './pages/public/Home.jsx';
import DoctorsSearch from './pages/public/DoctorsSearch.jsx';
import DoctorDetail from './pages/public/DoctorDetail.jsx';
import Login from './pages/public/Login.jsx';
import RegisterPatient from './pages/public/RegisterPatient.jsx';
import RegisterDoctor from './pages/public/RegisterDoctor.jsx';

// Patient Pages
import MyAppointments from './pages/patient/MyAppointments.jsx';
import BookingPayment from './pages/patient/BookingPayment.jsx';
import PatientProfile from './pages/patient/PatientProfile.jsx';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import DoctorProfileEdit from './pages/doctor/DoctorProfileEdit.jsx';
import DoctorHospitals from './pages/doctor/DoctorHospitals.jsx';
import DoctorSchedules from './pages/doctor/DoctorSchedules.jsx';
import SessionAppointments from './pages/doctor/SessionAppointments.jsx';

// Hospital Admin Pages
import HospitalDashboard from './pages/hospital/HospitalDashboard.jsx';
import HospitalSchedules from './pages/hospital/HospitalSchedules.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import DoctorApprovals from './pages/admin/DoctorApprovals.jsx';
import ManageHospitals from './pages/admin/ManageHospitals.jsx';
import ManageSpecializations from './pages/admin/ManageSpecializations.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import AllAppointments from './pages/admin/AllAppointments.jsx';

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '14px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
          },
          success: {
            iconTheme: {
              primary: '#14b8a6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fff',
            },
          },
        }}
      />

      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<DoctorsSearch />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPatient />} />
          <Route path="/doctor-signup" element={<RegisterDoctor />} />

          {/* Patient Routes */}
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/checkout/:appointmentId"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <BookingPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/hospitals"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorHospitals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/schedules"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/schedules/:id/patients"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'hospital_admin', 'admin']}>
                <SessionAppointments />
              </ProtectedRoute>
            }
          />

          {/* Hospital Admin Routes */}
          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin']}>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/schedules"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin']}>
                <HospitalSchedules />
              </ProtectedRoute>
            }
          />

          {/* Platform Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DoctorApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageHospitals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/specializations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageSpecializations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllAppointments />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
