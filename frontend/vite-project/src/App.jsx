import  { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './App.css'
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
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 


function ScrollToTop() {
    const location = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);
    return null;
}

function App() {
    return (
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
                    <Route path="/become-caregiver" element={<BecomeCaregiver/>} />
                    {/* Add other routes as needed */}
                </Routes>
                <Footer/>
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
    );
}

export default App;
