import StorySection from "../components/AboutUs/StorySection";
import WhyUsSection from "../components/AboutUs/WhyUs";
import BrandList from "../components/LandingPage/BrandList";
import OurApproach from "../main-app/components/OurApproach";
import genralImg from "../assets/nurse.png";
import BottomBanner from "../components/BottomBanner.jsx";
import AboutUsTopBanner from "../components/AboutUsTopBanner.jsx";
import AboutUsTeam from "../components/AbaoutUsTeam.jsx";


const AboutUs = () => {
  return (
    <div>
    
      <AboutUsTopBanner/>
      <StorySection/>
      <OurApproach/>
      <WhyUsSection/>
      <AboutUsTeam/>
      <BrandList/>
      <BottomBanner/>
      
    </div>

  );
};

export default AboutUs;