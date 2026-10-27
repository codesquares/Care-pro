// ============================================================================
// RETIRED — Client "Care Needs" setup wizard (routed wrapper).
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

// import CareNeedsWizard from './CareNeedsWizard';
//
// /**
//  * CareNeedsSettings - wrapper component that renders the Care Needs Wizard.
//  * This is the routed component for /app/client/care-needs.
//  */
// const CareNeedsSettings = () => {
//   return <CareNeedsWizard />;
// };
//
// export default CareNeedsSettings;
