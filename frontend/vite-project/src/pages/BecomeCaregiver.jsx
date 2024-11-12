import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurse.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";

const BecomeCaregiver = () => {
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Become Caregiver today!"
        description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
        buttonText="Become a Caregiver"
        imageUrl={genralImg}
        onButtonClick={() => console.log("Book a Caregiver clicked")}
        backgroundColor="#015476"
      />
      <CaregiverProcess
        buttonText="Become a Caregiver"
        title="How it Works"
        btnBgColor="#015476"
         />
      <HealthcareFacts/>
      <FAQ/>
    </div>
  );
};

export default BecomeCaregiver;