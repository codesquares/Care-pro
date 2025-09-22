// import React, { useState, useEffect } from 'react';
// import '../client-dashboard/filterBar.css';

// /**
//  * Enhanced FilterBar component that allows clients to filter services by various criteria
//  * including sort order, price range, service category, location, and ratings
//  * Supports advanced filtering for popular, highly rated, and price-optimized gigs
//  */
// const FilterBar = ({ onFilterChange }) => {
//   // Filter states
//   const [sortBy, setSortBy] = useState('');
//   const [priceRange, setPriceRange] = useState({
//     min: '',
//     max: ''
//   });
//   const [serviceType, setServiceType] = useState('');
//   const [location, setLocation] = useState('');
//   const [minRating, setMinRating] = useState('');
//   const [quickFilter, setQuickFilter] = useState('');
  
//   // Available service categories - fetch from API in a real implementation
//   const serviceCategories = [
//     'Adult Care',
//     'Post Surgery Care',
//     'Child Care',
//     'Pet Care',
//     'Home Care',
//     'Special Needs Care',
//     'Elderly Care',
//     'Rehabilitation'
//   ];
  
//   // Available locations - fetch from API in a real implementation
//   const locations = [
//     'Lagos',
//     'Abuja',
//     'Port Harcourt',
//     'Ibadan',
//     'Kano',
//     'Enugu',
//     'Kaduna'
//   ];
  
//   // Handle quick filter change
//   const handleQuickFilterChange = (value) => {
//     // If clicking on the already selected filter, deselect it
//     if (quickFilter === value) {
//       setQuickFilter('');
      
//       // Reset sortBy if it was set by the quick filter
//       if ((value === 'popular' && sortBy === 'popularity') ||
//           (value === 'top-rated' && sortBy === 'rating-high') ||
//           (value === 'affordable' && sortBy === 'price-low') ||
//           (value === 'premium' && sortBy === 'price-high')) {
//         setSortBy('');
//       }
//     } else {
//       setQuickFilter(value);
      
//       // Set the appropriate sort based on quick filter
//       switch (value) {
//         case 'popular':
//           setSortBy('popularity');
//           break;
//         case 'top-rated':
//           setSortBy('rating-high');
//           // Also set minimum rating to 4
//           setMinRating('4');
//           break;
//         case 'affordable':
//           setSortBy('price-low');
//           break;
//         case 'premium':
//           setSortBy('price-high');
//           break;
//         default:
//           break;
//       }
//     }
    
//     applyFilters({ 
//       quickFilter: value === quickFilter ? '' : value,
//       sortBy: value === quickFilter ? '' : 
//         value === 'popular' ? 'popularity' :
//         value === 'top-rated' ? 'rating-high' :
//         value === 'affordable' ? 'price-low' :
//         value === 'premium' ? 'price-high' : sortBy,
//       minRating: value === 'top-rated' && value !== quickFilter ? '4' : minRating
//     });
//   };
  
//   // Handle sort change
//   const handleSortChange = (e) => {
//     const value = e.target.value;
//     setSortBy(value);
    
//     // Clear quick filter if it was related to sort
//     if ((quickFilter === 'popular' && value !== 'popularity') || 
//         (quickFilter === 'top-rated' && value !== 'rating-high') ||
//         (quickFilter === 'affordable' && value !== 'price-low') ||
//         (quickFilter === 'premium' && value !== 'price-high')) {
//       setQuickFilter('');
//     }
    
//     applyFilters({ sortBy: value });
//   };
  
//   // Handle price range change
//   const handlePriceChange = (type, e) => {
//     const value = e.target.value;
//     const updatedRange = { ...priceRange, [type]: value };
//     setPriceRange(updatedRange);
    
//     // Only apply filters if both min and max are set, or one is set and the other is ''
//     applyFilters({ priceRange: updatedRange });
//   };
  
//   // Handle service type change
//   const handleServiceTypeChange = (e) => {
//     const value = e.target.value;
//     setServiceType(value);
//     applyFilters({ serviceType: value });
//   };
  
//   // Handle location change
//   const handleLocationChange = (e) => {
//     const value = e.target.value;
//     setLocation(value);
//     applyFilters({ location: value });
//   };
  
//   // Handle minimum rating change
//   const handleMinRatingChange = (e) => {
//     const value = e.target.value;
//     setMinRating(value);
    
//     // Clear top-rated quick filter if rating is changed to less than 4
//     if (quickFilter === 'top-rated' && parseFloat(value) < 4) {
//       setQuickFilter('');
//     }
    
//     applyFilters({ minRating: value });
//   };
  
//   // Apply all filters
//   const applyFilters = (updatedFilters) => {
//     const filters = {
//       sortBy,
//       priceRange,
//       serviceType,
//       location,
//       minRating,
//       quickFilter,
//       ...updatedFilters
//     };
    
//     onFilterChange(filters);
//   };
  
//   // Reset all filters
//   const resetFilters = () => {
//     setSortBy('');
//     setPriceRange({ min: '', max: '' });
//     setServiceType('');
//     setLocation('');
//     setMinRating('');
//     setQuickFilter('');
    
//     onFilterChange({
//       sortBy: '',
//       priceRange: { min: '', max: '' },
//       serviceType: '',
//       location: '',
//       minRating: '',
//       quickFilter: ''
//     });
//   };
  
//   return (
//     <div className="filter-bar" style={{display: 'block', visibility: 'visible'}}>
//       <h3>Filter Services</h3>
      
//       {/* Quick Filters */}
//       <div className="quick-filters" style={{display: 'flex', visibility: 'visible'}}>
//         <button 
//           className={`quick-filter-btn ${quickFilter === 'popular' ? 'active' : ''}`}
//           onClick={() => handleQuickFilterChange('popular')}
//         >
//           <i className="fas fa-fire"></i> Popular
//         </button>
        
//         <button 
//           className={`quick-filter-btn ${quickFilter === 'top-rated' ? 'active' : ''}`}
//           onClick={() => handleQuickFilterChange('top-rated')}
//         >
//           <i className="fas fa-star"></i> Top Rated
//         </button>
        
//         <button 
//           className={`quick-filter-btn ${quickFilter === 'affordable' ? 'active' : ''}`}
//           onClick={() => handleQuickFilterChange('affordable')}
//         >
//           <i className="fas fa-tags"></i> Affordable
//         </button>
        
//         <button 
//           className={`quick-filter-btn ${quickFilter === 'premium' ? 'active' : ''}`}
//           onClick={() => handleQuickFilterChange('premium')}
//         >
//           <i className="fas fa-crown"></i> Premium
//         </button>
//       </div>
      
//       <div className="filter-options">
//         <div className="filter-group">
//           <label>Sort By</label>
//           <select value={sortBy} onChange={handleSortChange}>
//             <option value="">Select...</option>
//             <option value="popularity">Most Popular</option>
//             <option value="rating-high">Highest Rated</option>
//             <option value="rating-low">Lowest Rated</option>
//             <option value="price-high">Price: High to Low</option>
//             <option value="price-low">Price: Low to High</option>
//             <option value="newest">Newest First</option>
//           </select>
//         </div>
        
//         <div className="filter-group">
//           <label>Price Range (₦)</label>
//           <div className="price-inputs">
//             <input
//               type="number"
//               placeholder="Min"
//               value={priceRange.min}
//               onChange={(e) => handlePriceChange('min', e)}
//             />
//             <span>to</span>
//             <input
//               type="number"
//               placeholder="Max"
//               value={priceRange.max}
//               onChange={(e) => handlePriceChange('max', e)}
//             />
//           </div>
//         </div>
        
//         <div className="filter-group">
//           <label>Service Type</label>
//           <select value={serviceType} onChange={handleServiceTypeChange}>
//             <option value="">All Services</option>
//             {serviceCategories.map((category, index) => (
//               <option key={index} value={category}>{category}</option>
//             ))}
//           </select>
//         </div>
        
//         <div className="filter-group">
//           <label>Location</label>
//           <select value={location} onChange={handleLocationChange}>
//             <option value="">All Locations</option>
//             {locations.map((loc, index) => (
//               <option key={index} value={loc}>{loc}</option>
//             ))}
//           </select>
//         </div>
        
//         <div className="filter-group">
//           <label>Minimum Rating</label>
//           <select value={minRating} onChange={handleMinRatingChange}>
//             <option value="">Any Rating</option>
//             <option value="5">5 Stars Only</option>
//             <option value="4">4+ Stars</option>
//             <option value="3">3+ Stars</option>
//             <option value="2">2+ Stars</option>
//             <option value="1">1+ Stars</option>
//           </select>
//         </div>
        
//         <button className="reset-button" onClick={resetFilters}>
//           Reset Filters
//         </button>
//       </div>
//     </div>
//   );
// };

// export default FilterBar;


// src/components/FilterBarDropdown.js
import React from 'react';
import './filterDropdownBar.css';
import { FaRedoAlt } from 'react-icons/fa';

const FilterBarDropdown = ({ filters, onFilterChange }) => {
  const handleServiceTypeChange = (e) => {
    onFilterChange({ ...filters, serviceType: e.target.value });
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    const [min, max] = value.split('-');
    onFilterChange({ 
      ...filters, 
      priceRange: { min: min || '', max: max || '' } 
    });
  };

  const handleLocationChange = (e) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

    // Reset all dropdown filters
  const resetDropdownFilters = () => {
    onFilterChange({
      ...filters,
      serviceType: '',
      priceRange: { min: '', max: '' },
      location: ''
    });
  };

  return (
    <div className="filter-dropdown-bar">
      <select value={filters.serviceType} onChange={handleServiceTypeChange}>
        <option value="">Service options</option>
        <option value="Adult Care">Adult Care</option>
        <option value="Post Surgery Care">Post Surgery Care</option>
        <option value="Child Care">Child Care</option>
        <option value="Pet Care">Pet Care</option>
        <option value="Home Care">Home Care</option>
        <option value="Special Needs Care">Special Needs Care</option>
        <option value="Elderly Care">Elderly Care</option>
        <option value="Rehabilitation">Rehabilitation</option>
      </select>

      <select onChange={handleBudgetChange}>
        <option value="">Budget</option>
        <option value="0-5000">₦0 - ₦5,000</option>
        <option value="5000-10000">₦5,000 - ₦10,000</option>
        <option value="10000-20000">₦10,000 - ₦20,000</option>
        <option value="20000-">₦20,000+</option>
      </select>

      <select value={filters.location} onChange={handleLocationChange}>
        <option value="">Location</option>
        <option value="Lagos">Lagos</option>
        <option value="Abuja">Abuja</option>
        <option value="Port Harcourt">Port Harcourt</option>
        <option value="Ibadan">Ibadan</option>
        <option value="Kano">Kano</option>
        <option value="Enugu">Enugu</option>
        <option value="Kaduna">Kaduna</option>
      </select>

       {/* Reset Icon */}
      <button
        className="reset-icon-btn"
        onClick={resetDropdownFilters}
        title="Reset Filters"
      >
        <FaRedoAlt />
      </button>
    </div>
  );
};

export default FilterBarDropdown;
