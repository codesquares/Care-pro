import { Helmet } from 'react-helmet';
import GeneralBanner from '../components/GeneralBanner';
import CaregiverProcess from '../components/LandingPage/CaregiverProcess';
import HealthcareFacts from '../components/LandingPage/HealthcareFacts';
import WhyCarepro from '../components/WhyCare-Pro';
import FAQ from '../components/LandingPage/FAQ';

const OurProcess = () => {
  return (
    <div>
      <Helmet>
        <title>Our Process - CarePro</title>
        <meta name="description" content="Learn about CarePro's comprehensive caregiver process and how we ensure quality healthcare services for our clients." />
        <meta name="keywords" content="caregiver process, healthcare, nursing, eldercare, home care, medical assistance" />
      </Helmet>

      <GeneralBanner 
        title="Our Process"
        subtitle="Discover how CarePro connects you with qualified caregivers through our comprehensive and trusted process"
        showButton={false}
      />

      <CaregiverProcess />
      
      <HealthcareFacts />
      
      <WhyCarepro />
      
      <FAQ />
    </div>
  );
};

export default OurProcess;