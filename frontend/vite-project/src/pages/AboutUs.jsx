import ExpertTeam from "../components/AboutUs/ExpertTeam";
import StorySection from "../components/AboutUs/StorySection";
import WhyUsSection from "../components/AboutUs/WhyUs";
import BrandList from "../components/LandingPage/BrandList";
import CaregiverBanner from "../components/LandingPage/CaregiverBanner";


const AboutUs = () => {
  return (
    <div>
      <StorySection/>
      <WhyUsSection/>
      <ExpertTeam/>
      <BrandList/>
      <CaregiverBanner/>
    </div>
  );
};

export default AboutUs;