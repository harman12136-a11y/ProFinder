import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Discover from './pages/Discover';
import Library from './pages/Library';
import CreatorProfile from './pages/CreatorProfile';
import Settings from './pages/Settings';
import SoftwareDetail from './pages/SoftwareDetail';
import ListSoftware from './pages/ListSoftware';
import EditSoftware from './pages/EditSoftware';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import CreateBundle from './pages/CreateBundle';
import Services from './pages/Services';
import RegisterService from './pages/RegisterService';
import ServiceDetail from './pages/ServiceDetail';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/marketplace" element={<Navigate to="/discover" replace />} />
            <Route path="/library" element={
              <ProtectedRoute><Library /></ProtectedRoute>
            } />
            <Route path="/creator/:id" element={<CreatorProfile />} />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/software/:id" element={<SoftwareDetail />} />
            <Route path="/list-software" element={
              <ProtectedRoute><ListSoftware /></ProtectedRoute>
            } />
            <Route path="/edit-software/:id" element={
              <ProtectedRoute><EditSoftware /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
            <Route path="/create-bundle" element={
              <ProtectedRoute><CreateBundle /></ProtectedRoute>
            } />
            <Route path="/services" element={<Services />} />
            <Route path="/register-service" element={
              <ProtectedRoute><RegisterService /></ProtectedRoute>
            } />
            <Route path="/service/:userId" element={<ServiceDetail />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
