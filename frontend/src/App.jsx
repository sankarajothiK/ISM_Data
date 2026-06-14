import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { FiUsers, FiBriefcase, FiGrid, FiLogOut, FiMenu, FiX, FiCheckCircle, FiDownload } from 'react-icons/fi';

// Lazy load or direct import pages (which we will create next)
import ApplyPage from './pages/ApplyPage';
import SuccessPage from './pages/SuccessPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationListPage from './pages/ApplicationListPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import JobManagementPage from './pages/JobManagementPage';
import QRCodePage from './pages/QRCodePage';
import Logo from './components/Logo';
import { authService } from './services/api';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// Admin Layout with Sidebar Navigation
const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState({ username: 'Admin' });

  React.useEffect(() => {
    // Fetch profile info on load
    if (authService.isAuthenticated()) {
      authService.getMe()
        .then(res => {
          if (res.success) setAdminUser(res.user);
        })
        .catch(() => {
          // Token expired, handled by axios interceptors
        });
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/admin/login';
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiGrid className="w-5 h-5" /> },
    { name: 'Applications', path: '/admin/applications', icon: <FiUsers className="w-5 h-5" /> },
    { name: 'Job Positions', path: '/admin/jobs', icon: <FiBriefcase className="w-5 h-5" /> },
    { name: 'Permanent QR Code', path: '/admin/qrcode', icon: <FiDownload className="w-5 h-5" /> },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar for desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 -hidden lg:block'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Logo variant="sidebar" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col justify-between flex-1 h-[calc(100vh-4rem)] bg-slate-900 py-6">
          <nav className="space-y-1 px-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="px-4 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between px-4 py-2 mb-4 bg-slate-950 rounded-lg">
              <div className="truncate">
                <p className="text-sm font-semibold truncate text-slate-200">{adminUser.username}</p>
                <p className="text-xs text-brand-400 capitalize">{adminUser.role || 'Administrator'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700">
            <FiMenu className="w-6 h-6" />
          </button>
          <Logo variant="light" className="scale-90" />
          <div className="w-6"></div> {/* Spacer to center the logo */}
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/applications" element={<ApplicationListPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
            <Route path="/jobs" element={<JobManagementPage />} />
            <Route path="/qrcode" element={<QRCodePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Candidate Routes */}
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/application-success" element={<SuccessPage />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/apply" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
