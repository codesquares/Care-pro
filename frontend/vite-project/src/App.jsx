import React from 'react';
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

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    {/* Update to use 'Routes' and 'Route' components */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about-us" element={<AboutUs />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/care-facts" element={<CareFacts />} />
                    <Route path="/our-process" element={<OurProcess />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/book-caregiver" element={<BookCaregiver />} />
                    {/* Add other routes as needed */}
                </Routes>
                <Footer/>
            </div>
        </Router>
    );
}

export default App;
