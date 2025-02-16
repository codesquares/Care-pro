import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import LoginPage from './main-app/page/LoginPage';
import RegisterPage from './main-app/page/RegisterPage';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ContentBlog from './components/ContentfulBlog/Blog';
import ContentBlogPost from './components/ContentfulBlog/BlogPost';
import { BlogProvider } from './main-app/context/BlogContext';


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

      <Router>
        <div className="App">
          <Navbar />
          <ScrollToTop />
          <Routes>
            {/* Update to use 'Routes' and 'Route' components */}
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/care-facts" element={<CareFacts />} />
            <Route path="/our-process" element={<OurProcess />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/book-caregiver" element={<BookCaregiver />} />
            <Route path="/become-caregiver" element={<BecomeCaregiver />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="Register" element={<RegisterPage />} />
            <Route path="/contentful-blog" element={<ContentBlog />} />
            <Route path="/contentful-blog/:id" element={<ContentBlogPost />} />

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
      </Router>

    </BlogProvider>

  );
}

// function AppContent() {
//   const location = useLocation();

  // // Define unprotected routes
  // const unprotectedRoutes = [
  //   '/',
  //   '/about-us',
  //   '/blog',
  //   '/contentful-blog',
  //   '/care-facts',
  //   '/our-process',
  //   '/plans',
  //   '/book-caregiver',
  //   '/become-caregiver',
  // ];

  // return (
  //   <div className="App">
  //     <Navbar />
  //     <ScrollToTop />
  //     <Routes>
  //       <Route path="/" element={<Home />} />
  //       <Route path="/about-us" element={<AboutUs />} />
  //       <Route path="/blog" element={<Blog />} />
  //       <Route path="/contentful-blog" element={<ContentBlog />} />
  //       <Route path="/contentful-blog/:id" element={<ContentBlogPost />} />
  //       <Route path="/care-facts" element={<CareFacts />} />
  //       <Route path="/our-process" element={<OurProcess />} />
  //       {/* <Route path="/create-gig" element={<CreateGig />} /> */}
  //       <Route path="/messages" element={<Messages />} />
  //       <Route path="/plans" element={<Plans />} />
  //       <Route path="/book-caregiver" element={<BookCaregiver />} />
  //       <Route path="/become-caregiver" element={<BecomeCaregiver />} />
  //     </Routes>
  //     <Footer />
  //     <ToastContainer
  //       position="bottom-right"
  //       autoClose={5000}
  //       hideProgressBar={false}
  //       newestOnTop={false}
  //       closeOnClick
  //       rtl={false}
  //       pauseOnFocusLoss
  //       draggable
  //       pauseOnHover
  //     />
  //   </div>
  // );
// }

export default App;
