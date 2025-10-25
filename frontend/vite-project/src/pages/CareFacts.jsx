import { Helmet } from 'react-helmet';
import GeneralBanner from '../components/GeneralBanner';
import HealthcareFacts from '../components/LandingPage/HealthcareFacts';
import WhyCarepro from '../components/WhyCare-Pro';

const CareFacts = () => {
  return (
    <div>
      <Helmet>
        <title>Healthcare Facts - CarePro</title>
        <meta name="description" content="Important healthcare facts and statistics that highlight the need for quality home care and professional caregiving services." />
        <meta name="keywords" content="healthcare facts, statistics, eldercare, home care, nursing, medical care, health information" />
      </Helmet>

      <GeneralBanner 
        title="Healthcare Facts"
        subtitle="Essential healthcare statistics and facts that demonstrate the importance of quality caregiving services"
        showButton={false}
      />

      <HealthcareFacts />
      
      <WhyCarepro />
    </div>
  );
};

export default CareFacts;