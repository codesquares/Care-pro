// ============================================================================
// RETIRED — Client "Care Needs" setup wizard (step 4).
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
// import './ReviewAndSaveTab.css';
//
// const ReviewAndSaveTab = ({ careNeeds, onEdit, onSave, isSaving }) => {
//   const serviceCategories = [
//     { id: 'Adult Care', icon: '👥', color: '#3b82f6' },
//     { id: 'Child Care', icon: '👶', color: '#10b981' },
//     { id: 'Pet Care', icon: '🐕', color: '#f59e0b' },
//     { id: 'Home Care', icon: '🏠', color: '#8b5cf6' },
//     { id: 'Post Surgery Care', icon: '🏥', color: '#ef4444' },
//     { id: 'Special Needs Care', icon: '♿', color: '#06b6d4' },
//     { id: 'Medical Support', icon: '⚕️', color: '#dc2626' },
//     { id: 'Mobility Support', icon: '🦽', color: '#7c3aed' },
//     { id: 'Therapy & Wellness', icon: '🧘', color: '#059669' },
//     { id: 'Palliative', icon: '🕊️', color: '#64748b' }
//   ];
//
//   const hasSpecificNeeds = () => {
//     return (
//       (careNeeds?.medicalNeeds && Object.values(careNeeds.medicalNeeds).some(val => 
//         Array.isArray(val) ? val.length > 0 : val !== '' && val !== false
//       )) ||
//       (careNeeds?.childCareNeeds && Object.values(careNeeds.childCareNeeds).some(val => 
//         Array.isArray(val) ? val.length > 0 : val !== ''
//       )) ||
//       (careNeeds?.petCareNeeds && Object.values(careNeeds.petCareNeeds).some(val => 
//         Array.isArray(val) ? val.length > 0 : val !== ''
//       )) ||
//       (careNeeds?.homeCareNeeds && Object.values(careNeeds.homeCareNeeds).some(val => 
//         Array.isArray(val) ? val.length > 0 : val !== ''
//       )) ||
//       (careNeeds?.therapyNeeds && Object.values(careNeeds.therapyNeeds).some(val => 
//         Array.isArray(val) ? val.length > 0 : val !== ''
//       ))
//     );
//   };
//
//   const hasCaregiverPreferences = () => {
//     if (!careNeeds?.caregiverRequirements) return false;
//     return Object.values(careNeeds.caregiverRequirements).some(val => 
//       Array.isArray(val) ? val.length > 0 : val !== ''
//     );
//   };
//
//   const renderServiceCategories = () => (
//     <div className="review-section">
//       <div className="section-header">
//         <h3>
//           <span className="section-icon">🏥</span>
//           Selected Services
//         </h3>
//         <button 
//           onClick={() => onEdit(0)}
//           className="edit-button"
//         >
//           Edit
//         </button>
//       </div>
//
//       {careNeeds?.serviceCategories?.length > 0 ? (
//         <div className="services-grid">
//           {careNeeds.serviceCategories.map(serviceId => {
//             const service = serviceCategories.find(s => s.id === serviceId);
//             return (
//               <div 
//                 key={serviceId}
//                 className="service-badge"
//                 style={{ '--service-color': service?.color }}
//               >
//                 <span className="service-icon">{service?.icon}</span>
//                 <span className="service-name">{service?.id}</span>
//               </div>
//             );
//           })}
//         </div>
//       ) : (
//         <div className="empty-state">
//           <span className="empty-icon">⚠️</span>
//           <p>No services selected</p>
//         </div>
//       )}
//     </div>
//   );
//
//   const renderSpecificNeeds = () => (
//     <div className="review-section">
//       <div className="section-header">
//         <h3>
//           <span className="section-icon">📋</span>
//           Specific Needs
//         </h3>
//         <button 
//           onClick={() => onEdit(1)}
//           className="edit-button"
//         >
//           Edit
//         </button>
//       </div>
//
//       {hasSpecificNeeds() ? (
//         <div className="needs-summary">
//           {/* Medical Needs */}
//           {careNeeds?.medicalNeeds?.primaryCondition && (
//             <div className="need-item">
//               <strong>Medical:</strong>
//               <span>{careNeeds.medicalNeeds.primaryCondition}</span>
//               {careNeeds.medicalNeeds.assistanceLevel && (
//                 <span className="detail">({careNeeds.medicalNeeds.assistanceLevel})</span>
//               )}
//             </div>
//           )}
//
//           {/* Child Care Needs */}
//           {careNeeds?.childCareNeeds?.ageRanges?.length > 0 && (
//             <div className="need-item">
//               <strong>Child Care:</strong>
//               <span>{careNeeds.childCareNeeds.ageRanges.join(', ')}</span>
//               {careNeeds.childCareNeeds.supervisionLevel && (
//                 <span className="detail">({careNeeds.childCareNeeds.supervisionLevel})</span>
//               )}
//             </div>
//           )}
//
//           {/* Pet Care Needs */}
//           {careNeeds?.petCareNeeds?.petTypes?.length > 0 && (
//             <div className="need-item">
//               <strong>Pet Care:</strong>
//               <span>{careNeeds.petCareNeeds.petTypes.join(', ')}</span>
//               {careNeeds.petCareNeeds.numberOfPets && (
//                 <span className="detail">({careNeeds.petCareNeeds.numberOfPets})</span>
//               )}
//             </div>
//           )}
//
//           {/* Home Care Needs */}
//           {careNeeds?.homeCareNeeds?.focusAreas?.length > 0 && (
//             <div className="need-item">
//               <strong>Home Care:</strong>
//               <span>{careNeeds.homeCareNeeds.focusAreas.slice(0, 3).join(', ')}</span>
//               {careNeeds.homeCareNeeds.focusAreas.length > 3 && (
//                 <span className="detail">+{careNeeds.homeCareNeeds.focusAreas.length - 3} more</span>
//               )}
//             </div>
//           )}
//
//           {/* Therapy Needs */}
//           {careNeeds?.therapyNeeds?.therapyTypes?.length > 0 && (
//             <div className="need-item">
//               <strong>Therapy:</strong>
//               <span>{careNeeds.therapyNeeds.therapyTypes.join(', ')}</span>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="empty-state">
//           <span className="empty-icon">📝</span>
//           <p>No specific needs configured</p>
//         </div>
//       )}
//     </div>
//   );
//
//   const renderCaregiverPreferences = () => (
//     <div className="review-section">
//       <div className="section-header">
//         <h3>
//           <span className="section-icon">👤</span>
//           Caregiver Preferences
//         </h3>
//         <button 
//           onClick={() => onEdit(2)}
//           className="edit-button"
//         >
//           Edit
//         </button>
//       </div>
//
//       {hasCaregiverPreferences() ? (
//         <div className="preferences-summary">
//           {/* Experience Level */}
//           {careNeeds?.caregiverRequirements?.experienceLevel && (
//             <div className="pref-item">
//               <strong>Experience:</strong>
//               <span>{careNeeds.caregiverRequirements.experienceLevel}</span>
//             </div>
//           )}
//
//           {/* Certifications */}
//           {careNeeds?.caregiverRequirements?.certifications?.length > 0 && (
//             <div className="pref-item">
//               <strong>Certifications:</strong>
//               <span>{careNeeds.caregiverRequirements.certifications.length} selected</span>
//               <div className="pref-list">
//                 {careNeeds.caregiverRequirements.certifications.slice(0, 3).map(cert => (
//                   <span key={cert} className="pref-tag">{cert}</span>
//                 ))}
//                 {careNeeds.caregiverRequirements.certifications.length > 3 && (
//                   <span className="pref-tag more">
//                     +{careNeeds.caregiverRequirements.certifications.length - 3} more
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}
//
//           {/* Languages */}
//           {careNeeds?.caregiverRequirements?.languages?.length > 0 && (
//             <div className="pref-item">
//               <strong>Languages:</strong>
//               <div className="pref-list">
//                 {careNeeds.caregiverRequirements.languages.map(lang => (
//                   <span key={lang} className="pref-tag">{lang}</span>
//                 ))}
//               </div>
//             </div>
//           )}
//
//           {/* Special Skills */}
//           {careNeeds?.caregiverRequirements?.specialSkills?.length > 0 && (
//             <div className="pref-item">
//               <strong>Special Skills:</strong>
//               <span>{careNeeds.caregiverRequirements.specialSkills.length} selected</span>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="empty-state">
//           <span className="empty-icon">👤</span>
//           <p>No caregiver preferences set</p>
//         </div>
//       )}
//     </div>
//   );
//
//   const getCompletionScore = () => {
//     let score = 0;
//     let total = 3;
//
//     // Service categories (required)
//     if (careNeeds?.serviceCategories?.length > 0) score += 1;
//
//     // Specific needs (conditional)
//     if (hasSpecificNeeds()) score += 1;
//
//     // Caregiver preferences (optional but recommended)
//     if (hasCaregiverPreferences()) score += 1;
//
//     return { score, total, percentage: Math.round((score / total) * 100) };
//   };
//
//   const completion = getCompletionScore();
//
//   return (
//     <div className="review-save-tab">
//       <div className="tab-header">
//         <h2>Review Your Care Preferences</h2>
//         <p>Review and confirm your care needs before saving.</p>
//       </div>
//
//       {/* Completion Status */}
//       <div className="completion-status">
//         <div className="completion-header">
//           <h3>Setup Completion</h3>
//           <span className="completion-percentage">{completion.percentage}%</span>
//         </div>
//         <div className="completion-bar">
//           <div 
//             className="completion-fill"
//             style={{ width: `${completion.percentage}%` }}
//           ></div>
//         </div>
//         <p className="completion-text">
//           {completion.score} of {completion.total} sections completed
//         </p>
//       </div>
//
//       {/* Review Sections */}
//       <div className="review-content">
//         {renderServiceCategories()}
//         {renderSpecificNeeds()}
//         {renderCaregiverPreferences()}
//       </div>
//
//       {/* Save Section */}
//       <div className="save-section">
//         <div className="save-header">
//           <h3>Ready to Save</h3>
//           <p>Review your selections before saving.</p>
//         </div>
//
//         <button
//           onClick={onSave}
//           disabled={isSaving || !careNeeds?.serviceCategories?.length}
//           className={`save-button ${!careNeeds?.serviceCategories?.length ? 'disabled' : ''}`}
//         >
//           {isSaving ? (
//             <>
//               <span className="save-spinner"></span>
//               Saving Your Preferences...
//             </>
//           ) : (
//             <>
//               <span className="save-icon">✅</span>
//               Save Care Preferences
//             </>
//           )}
//         </button>
//
//         {!careNeeds?.serviceCategories?.length && (
//           <p className="save-warning">
//             ⚠️ Please select at least one service category before saving.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };
//
// export default ReviewAndSaveTab;
