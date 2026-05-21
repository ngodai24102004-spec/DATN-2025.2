import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
// Import các trang của bạn
import LandingPage from './pages/Outside/Landing'; // Thêm dòng import trang Outside này
import Login from './pages/Auth/Login';
import Dashboard from './pages/BuildingAdmin/Dashboard';
import HistoryPage from './pages/BuildingAdmin/History';
import ControlPanel from './pages/BuildingAdmin/ControlPanel';
import ProtectedRoute from './route/ProtectedRoute';
import './styles/App.css';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
// Super Admin
import SystemManagement from './pages/SuperAdmin/SystemManagement';
import BuildingDetail from './pages/SuperAdmin/BuildingDetail';

// Gọi hàm kiểm tra đăng nhập khi ứng dụng khởi chạy

function App() {


  return (
    <AuthProvider>
      <NotificationProvider>

        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            className: 'z-[99999]',
          }}
        />

        <Router>
          <Routes>

            {/* SỬA DÒNG NÀY: Gán đường dẫn gốc "/" cho trang LandingPage */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />


            // Building Admin Routes (Yêu cầu đăng nhập)
            <Route
              path="/dashboard"
              element={
                <MainLayout>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </MainLayout>
              }
            />

            <Route
              path="/history"
              element={
                <MainLayout>
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                </MainLayout>
              }
            />

            <Route
              path="/control"
              element={
                <MainLayout>
                  <ProtectedRoute>
                    <ControlPanel />
                  </ProtectedRoute>
                </MainLayout>
              }
            />

            {/* Route dành cho Super Admin */}
            <Route
              path="/admin"
              element={
                <MainLayout>
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <SystemManagement />
                  </ProtectedRoute>
                </MainLayout>
              }
            />

            <Route
              path="/admin/building/:id"
              element={
                <MainLayout>
                  <ProtectedRoute requiredRole="SUPER_ADMIN">
                    <BuildingDetail />
                  </ProtectedRoute>
                </MainLayout>
              }
            />


            {/* Route fallback cho các đường dẫn không tồn tại */}

            <Route path="*" element={
              <MainLayout>
                <div className="p-8 text-center 
                         text-2xl font-bold 
                         items-center justify-center
              ">404 - Trang không tồn tại</div>
              </MainLayout>
            } />

          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;