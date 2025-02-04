import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import CareFacts from './pages/CareFacts';
import OurProcess from './pages/OurProcess';
import Plans from './pages/Plans';
import BookCaregiver from './pages/BookCaregiver';
import Home from './pages/Home';
import BecomeCaregiver from './pages/BecomeCaregiver';
import LoginPage from './main-app/pages/LoginPage';
import RegisterPage from './main-app/pages/RegisterPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './main-app/components/auth/ProtectedRoute';
import MainAppRoutes from './main-app/routes';
import { logout } from './main-app/services/auth';
import { AuthProvider } from './main-app/context/AuthContext';
import CreateGig from './main-app/pages/care-giver/CreateGig';
import Messages from './main-app/pages/Messages';


function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
    return (
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    );
  }
  
  function AppContent() {
    const location = useLocation();
  
    // Define unprotected routes
    const unprotectedRoutes = [
      '/',
      '/about-us',
      '/blog',
      '/care-facts',
      '/our-process',
      '/plans',
      '/book-caregiver',
      '/become-caregiver',
      '/login',
      '/register',
    ];
  
    // Check if current path is unprotected
    const isUnprotectedRoute = unprotectedRoutes.includes(location.pathname.toLowerCase());
  
    return (
      <div className="App">
        {isUnprotectedRoute && <Navbar />}
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/care-facts" element={<CareFacts />} />
          <Route path="/our-process" element={<OurProcess />} />
          {/* <Route path="/create-gig" element={<CreateGig />} /> */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/book-caregiver" element={<BookCaregiver />} />
          <Route path="/become-caregiver" element={<BecomeCaregiver />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <MainAppRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logout"
            element={() => {
              logout();
              return <Navigate to="/login" replace />;
            }}
          />
        </Routes>
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    );
  }
  
  export default App;  