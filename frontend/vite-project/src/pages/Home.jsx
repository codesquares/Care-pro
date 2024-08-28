import Header from "../components/LandingPage/Header";
import BrandList from "../components/LandingPage/BrandList";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import PricingPlans from "../components/LandingPage/PricingPlans";
import FAQ from "../components/LandingPage/FAQ";

const Home = () => {
  return (
<>
<Header/>
<BrandList/>
<HealthcareFacts/>
<CaregiverProcess/>
<PricingPlans/>
<FAQ/>
</>
  );
};

export default Home;