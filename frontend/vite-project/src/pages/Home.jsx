import Header from "../components/LandingPage/Header";
import BrandList from "../components/LandingPage/BrandList";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import PricingPlans from "../components/LandingPage/PricingPlans";
import FAQ from "../components/LandingPage/FAQ";
import ContactForm from "../components/LandingPage/ContactForm";
import CaregiverBanner from "../components/LandingPage/CaregiverBanner";
import LandingImg from "../components/LandingPage/LandingImg";
import GenaralBanner from "../components/GeneralBanner";
import genralImg from "../assets/generalImg.png";

const Home = () => {
  return (
<>
<Header/>
<BrandList/>
<div className="withpadding">
<GenaralBanner
  title="Hire a Caregiver today!"
  description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
  buttonText="Hire a Caregiver"
  imageUrl={genralImg}
  onButtonClick={() => console.log('Button clicked')}
  backgroundColor="#373732"
  borderRadius={true}
/>
</div>

{/* <CaregiverProcess/> */}
{/* <PricingPlans/> */}
{/* <HealthcareFacts/> */}
{/* <FAQ/> */}
{/* <CaregiverBanner/> */}
{/* <ContactForm/> */}
<LandingImg/>
</>
  );
};

export default Home;