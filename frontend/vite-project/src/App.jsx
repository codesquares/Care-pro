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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import NotFoundPage from './pages/NotFoundPage';
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
import ErrorBoundary from './main-app/components/ErrorBoundary';
// import Messages from './main-app/pages/Messages';
import NotificationBell from './main-app/components/notifications/NotificationBell';
import ContentBlog from './components/ContentfulBlog/Blog';
import ContentBlogPost from './components/ContentfulBlog/BlogPost';
import { BlogProvider } from './main-app/context/BlogContext';
import PaymentSuccess from './main-app/pages/client/home-care-service/PaymentSuccess';
import { MessageProvider } from './main-app/context/MessageContext';
// import { NotificationProvider } from './main-app/context/NotificationContext';
import SplashScreen from './main-app/components/SplashScreen/SplashScreen';
import PublicMarketplace from './main-app/pages/client/client-dashboard/PublicMarketplace';
import PublicClientNavBar from './main-app/pages/client/PublicClientNavBar';
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
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
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
    '/privacy-policy',
    '/terms-and-conditions',
    '/login',
    '/register',
    '/forgot-password',
    '/confirm-email',
    '/resend-confirmation',
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
  const isUnprotectedRoute = unprotectedRoutes.includes(location.pathname.toLowerCase());
  const isRootRoute = location.pathname === '/';
  
  // Check if current route should show navbar and footer
  const shouldShowClientNavbar = isRootRoute;
  const shouldShowBasicNavbar = isUnprotectedRoute && 
                                !routesWithoutNavbar.includes(location.pathname) && 
                                !isRootRoute;
  const shouldShowFooter = !routesWithoutFooter.includes(location.pathname);

  

  return (
    <div className="App">
      {shouldShowBasicNavbar && <Navbar />}
      {shouldShowClientNavbar && <PublicClientNavBar />}
      <ScrollToTop />
      {/* Remove duplicate ToastContainer to prevent conflicts - main one is at bottom */}
      {/* <ConnectionStatusIndicator /> */}
      <Routes>
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contentful-blog" element={<ContentBlog />} />
        <Route path="/contentful-blog/:id" element={<ContentBlogPost />} />
        <Route path="/care-facts" element={<CareFacts />} />
        <Route path="/our-process" element={<OurProcess />} />
        {/* <Route path="/messages" element={<Messages />} /> */}
        <Route path="/plans" element={<Plans />} />
        <Route path="/book-caregiver" element={<BookCaregiver />} />
        <Route path="/become-caregiver" element={<BecomeCaregiver />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
        <Route path="/" element={<PublicMarketplace />} />
        <Route path="/splash" element={<SplashScreen />} />

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
        {/* Catch-all route for non-existent pages */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {shouldShowFooter && <Footer />}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        limit={3}
        containerId="main-toast-container"
      />
    </div>
  );
}

export default App;