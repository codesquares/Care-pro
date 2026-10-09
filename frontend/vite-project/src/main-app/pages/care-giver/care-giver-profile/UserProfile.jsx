
import ProfileHeader from "./ProfileHeader";
// RETIRED (gigs): import GigsSection from "./GigsSection";
import Reviews from "./Reviews";
import AssignmentsSummaryList from "../assignments/AssignmentsSummaryList";
import useCaregiverAssignments from "../assignments/useCaregiverAssignments";
import "./user-profile.css";

const UserProfile = () => {
  const { pending, active, loading, error, reload } = useCaregiverAssignments();
  return (
    <div className="user-profile">
      <aside className="profile-left">
        <ProfileHeader />
      </aside>
      <main className="profile-right">
        <section className="asn-profile-section" data-testid="profile-assignments">
          <h3>Assignments</h3>
          <AssignmentsSummaryList pending={pending} active={active} loading={loading} error={error} onRetry={reload} />
        </section>
        {/* RETIRED — gigs section (Manage Gigs) removed for caregivers; preserved for restore.
        <GigsSection /> */}
        <Reviews />
      </main>
    </div>
  );
};


export default UserProfile;
