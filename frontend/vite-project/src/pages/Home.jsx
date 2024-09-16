import Header from "../components/LandingPage/Header";
import BrandList from "../components/LandingPage/BrandList";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import PricingPlans from "../components/LandingPage/PricingPlans";
import FAQ from "../components/LandingPage/FAQ";
import ContactForm from "../components/LandingPage/ContactForm";
import CaregiverBanner from "../components/LandingPage/CaregiverBanner";
import LandingImg from "../components/LandingPage/LandingImg";

const Home = () => {
  return (
<>
<Header/>
<BrandList/>
<CaregiverProcess/>
<PricingPlans/>
<HealthcareFacts/>
<FAQ/>
<CaregiverBanner/>
<ContactForm/>
<LandingImg/>
</>
  );
};

export default Home;