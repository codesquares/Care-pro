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
import OrderFaq from './main-app/pages/care-giver/OrderFaq';
import LoginPage from './main-app/pages/LoginPage';
import RegisterPage from './main-app/pages/RegisterPage';
import ForgotPasswordPage from './main-app/pages/ForgotPasswordPage';
import ConfirmEmailPage from './main-app/pages/ConfirmEmailPage';
import ResendConfirmationPage from './main-app/pages/ResendConfirmationPage';
import UnauthorizedPage from './main-app/pages/UnauthorizedPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './main-app/components/auth/ProtectedRoute';
import MainAppRoutes from './main-app/routes';
import { logout } from './main-app/services/auth';
import { AuthProvider } from './main-app/context/AuthContext';
import CreateGig from './main-app/pages/care-giver/CreateGig';
// import Messages from './main-app/pages/Messages';
import NotificationBell from './main-app/components/notifications/NotificationBell';
import ContentBlog from './components/ContentfulBlog/Blog';
import ContentBlogPost from './components/ContentfulBlog/BlogPost';
import { BlogProvider } from './main-app/context/BlogContext';
import PaymentSuccess from './main-app/pages/client/home-care-service/PaymentSuccess';
import { MessageProvider } from './main-app/context/MessageContext';
// import { NotificationProvider } from './main-app/context/NotificationContext';
import SplashScreen from './main-app/components/SplashScreen/SplashScreen';
// import ConnectionStatusIndicator from './main-app/components/notification/ConnectionStatusIndicator';
//Added for viewing Order Pages
import Order from './main-app/pages/client/orders/MyOrders';
import Order2 from './main-app/pages/client/orders/OrderTasks&Details';
import NotificationPoller from "./NotificationPoller"

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  return (
    
      <BlogProvider>
        <NotificationPoller />
        {/* <NotificationProvider> */}
          <MessageProvider>
            <Router>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </Router>
          </MessageProvider>
        {/* </NotificationProvider> */}
      </BlogProvider>
    
  );
}

function AppContent() {
  const location = useLocation();

  // Define unprotected routes
  const unprotectedRoutes = [
    '/',
    '/about-us',
    '/blog',
    '/contentful-blog',
    '/care-facts',
    '/our-process',
    '/plans',
    '/book-caregiver',
    '/become-caregiver',
    '/login',
    '/register',
    '/forgot-password',
    '/confirm-email',
    '/resend-confirmation',
    '/create-gig',
    '/unauthorized',
     '/splash',

    '/Caregivergigpage',

    '/MyOrders',
    '/OrderTasks&Details',
    '/order-faq',
    '/ResolutionCenter',
    '/CaregiverProfile',
    '/CaregiverSettings',
    '/Caregiver-Dashboard',

  ];

  // Define routes that should not have navbar
  const routesWithoutNavbar = ['/login', '/register', '/forgot-password', '/confirm-email', '/resend-confirmation'];
  
  // Define routes that should not have footer
  const routesWithoutFooter = ['/login', '/register', '/forgot-password', '/confirm-email', '/resend-confirmation'];

  // Check if current path is unprotected
  const isUnprotectedRoute = unprotectedRoutes.includes(location.pathname.toLowerCase()) && location.pathname !== '/';
  
  // Check if current route should show navbar and footer
  const shouldShowNavbar = isUnprotectedRoute && !routesWithoutNavbar.includes(location.pathname);
  const shouldShowFooter = !routesWithoutFooter.includes(location.pathname);

  

  return (
    <div className="App">
      {shouldShowNavbar && <Navbar />}
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={5000} />
      {/* <ConnectionStatusIndicator /> */}
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contentful-blog" element={<ContentBlog />} />
        <Route path="/contentful-blog/:id" element={<ContentBlogPost />} />
        <Route path="/care-facts" element={<CareFacts />} />
        <Route path="/our-process" element={<OurProcess />} />
        <Route path="/create-gig" element={<CreateGig />} />
        {/* <Route path="/messages" element={<Messages />} /> */}
        <Route path="/plans" element={<Plans />} />
        <Route path="/book-caregiver" element={<BookCaregiver />} />
        <Route path="/become-caregiver" element={<BecomeCaregiver />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
        <Route path="/" element={<SplashScreen />} />

        {/* <Route path="/Caregivergigpage" element={<Caregivergigpage />} /> */}


        <Route path="/MyOrders" element={<Order />} />
        <Route path="/OrderTasks&Details" element={<Order2 />} />
        <Route path="/order-faq" element={<OrderFaq />} />
        {/* <Route path="/ResolutionCenter" element={<ResolutionCenter />} /> */}
        {/* <Route path="/CaregiverProfile" element={<CaregiverProfile />} /> */}
        {/* <Route path="/CaregiverSettings" element={<CaregiverSettings />} /> */}
        {/* <Route path="/Caregiver-Dashboard" element={<CaregiverDashboard />} /> */}

        <Route path="/app/client/payment-success" element={<PaymentSuccess />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
      {shouldShowFooter && <Footer />}
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