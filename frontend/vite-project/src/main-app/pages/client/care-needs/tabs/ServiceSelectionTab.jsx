// ============================================================================
// RETIRED — Client "Care Needs" setup wizard (step 1).
//
// The wizard promised caregiver matching and recommendations that no longer
// exist: caregivers are now assigned internally by CarePro from a care
// package (see the Assignment Console), and a client never picks or is
// matched to a caregiver themselves. Its saved data was read by nothing
// meaningful, and its save swallowed server errors and reported success. The
// /app/client/care-needs route now shows a FeatureMovedNotice
// (see client-route.jsx); the dashboard, profile and settings entry points
// were repointed at care packages and the free care assessment.
//
// The entire file below is commented out on purpose, not deleted, so it can be
// referenced later. To restore: uncomment the wizard files + their services,
// and restore the import + <Route> in client-route.jsx. If it is ever rebuilt,
// do NOT reuse the old save (it hid failures) or the old matching promises.
// ============================================================================

// import React from 'react';
// import './ServiceSelectionTab.css';
//
// const ServiceSelectionTab = ({ careNeeds, updateCareNeeds, validationErrors }) => {
//   const serviceCategories = [
//     {
//       id: 'Adult Care',
//       title: 'Adult Care',
//       description: 'General adult care and assistance with daily activities',
//       icon: '👥',
//       color: '#3b82f6'
//     },
//     {
//       id: 'Child Care',
//       title: 'Child Care',
//       description: 'Professional child care and supervision services',
//       icon: '👶',
//       color: '#10b981'
//     },
//     {
//       id: 'Pet Care',
//       title: 'Pet Care',
//       description: 'Pet sitting, walking, and care services',
//       icon: '🐕',
//       color: '#f59e0b'
//     },
//     {
//       id: 'Home Care',
//       title: 'Home Care',
//       description: 'Household management and domestic services',
//       icon: '🏠',
//       color: '#8b5cf6'
//     },
//     {
//       id: 'Post Surgery Care',
//       title: 'Post Surgery Care',
//       description: 'Specialized post-operative care and recovery support',
//       icon: '🏥',
//       color: '#ef4444'
//     },
//     {
//       id: 'Special Needs Care',
//       title: 'Special Needs Care',
//       description: 'Specialized care for individuals with special needs',
//       icon: '♿',
//       color: '#06b6d4'
//     },
//     {
//       id: 'Medical Support',
//       title: 'Medical Support',
//       description: 'Medical assistance and health monitoring',
//       icon: '⚕️',
//       color: '#dc2626'
//     },
//     {
//       id: 'Mobility Support',
//       title: 'Mobility Support',
//       description: 'Assistance with mobility and physical activities',
//       icon: '🦽',
//       color: '#7c3aed'
//     },
//     {
//       id: 'Therapy & Wellness',
//       title: 'Therapy & Wellness',
//       description: 'Therapeutic services and wellness support',
//       icon: '🧘',
//       color: '#059669'
//     },
//     {
//       id: 'Palliative',
//       title: 'Palliative Care',
//       description: 'Comfort care and end-of-life support services',
//       icon: '🕊️',
//       color: '#64748b'
//     }
//   ];
//
//   const handleServiceToggle = (serviceId) => {
//     const currentServices = careNeeds?.serviceCategories || [];
//     let updatedServices;
//
//     if (currentServices.includes(serviceId)) {
//       updatedServices = currentServices.filter(s => s !== serviceId);
//
//       // Also clear specific services for this category
//       const updatedSpecificServices = { ...careNeeds?.specificServices };
//       delete updatedSpecificServices[serviceId];
//
//       updateCareNeeds({
//         serviceCategories: updatedServices,
//         specificServices: updatedSpecificServices
//       });
//     } else {
//       updatedServices = [...currentServices, serviceId];
//
//       // Initialize specific services for this category
//       const updatedSpecificServices = {
//         ...careNeeds?.specificServices,
//         [serviceId]: []
//       };
//
//       updateCareNeeds({
//         serviceCategories: updatedServices,
//         specificServices: updatedSpecificServices
//       });
//     }
//   };
//
//   const isSelected = (serviceId) => {
//     return careNeeds?.serviceCategories?.includes(serviceId) || false;
//   };
//
//   return (
//     <div className="service-selection-tab">
//       <div className="tab-header">
//         <h2>Select Your Care Services</h2>
//         <p>Choose the types of care services you need. You can select multiple categories.</p>
//       </div>
//
//       {validationErrors.serviceCategories && (
//         <div className="validation-error">
//           <span className="error-icon">⚠️</span>
//           {validationErrors.serviceCategories}
//         </div>
//       )}
//
//       <div className="service-grid">
//         {serviceCategories.map(service => (
//           <div
//             key={service.id}
//             className={`service-card ${isSelected(service.id) ? 'selected' : ''}`}
//             onClick={() => handleServiceToggle(service.id)}
//             style={{
//               '--service-color': service.color,
//               '--service-color-light': `${service.color}20`,
//               '--service-color-hover': `${service.color}10`
//             }}
//           >
//             <div className="service-icon">{service.icon}</div>
//             <div className="service-content">
//               <h3 className="service-title">{service.title}</h3>
//               <p className="service-description">{service.description}</p>
//             </div>
//             <div className="selection-indicator">
//               {isSelected(service.id) && <span className="checkmark">✓</span>}
//             </div>
//           </div>
//         ))}
//       </div>
//
//       {careNeeds?.serviceCategories?.length > 0 && (
//         <div className="selection-summary">
//           <h3>Selected Services ({careNeeds.serviceCategories.length})</h3>
//           <div className="selected-services">
//             {careNeeds.serviceCategories.map(serviceId => {
//               const service = serviceCategories.find(s => s.id === serviceId);
//               return (
//                 <span key={serviceId} className="selected-service-badge">
//                   {service?.icon} {service?.title}
//                 </span>
//               );
//             })}
//           </div>
//         </div>
//       )}
//
//       <div className="tab-footer">
//         <div className="help-text">
//           <p>💡 <strong>Tip:</strong> Select every service that applies to you.</p>
//         </div>
//       </div>
//     </div>
//   );
// };
//
// export default ServiceSelectionTab;
