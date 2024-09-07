import Header from "../components/LandingPage/Header";
import BrandList from "../components/LandingPage/BrandList";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import PricingPlans from "../components/LandingPage/PricingPlans";
import FAQ from "../components/LandingPage/FAQ";
import ContactForm from "../components/LandingPage/ContactForm";
import CaregiverBanner from "../components/LandingPage/CaregiverBanner";

const Home = () => {
  return (
<>
<Header/>
<BrandList/>
<HealthcareFacts/>
<CaregiverProcess/>
<PricingPlans/>
<FAQ/>
<CaregiverBanner/>
<ContactForm/>
</>
  );
};

export default Home;