import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
// Import các trang của bạn
import LandingPage from './pages/Outside/Landing'; // Thêm dòng import trang Outside này
import Login from './pages/Auth/Login';
import Dashboard from './pages/BuildingAdmin/Dashboard';
import ProtectedRoute from './route/ProtectedRoute';
import './styles/App.css';

// Gọi hàm kiểm tra đăng nhập khi ứng dụng khởi chạy

function App() {


  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* SỬA DÒNG NÀY: Gán đường dẫn gốc "/" cho trang LandingPage */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />


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
    </AuthProvider>
  );
}

export default App;