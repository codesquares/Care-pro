import ExpertTeam from "../components/AboutUs/ExpertTeam";
import StorySection from "../components/AboutUs/StorySection";
import WhyUsSection from "../components/AboutUs/WhyUs";
import BrandList from "../components/LandingPage/BrandList";
import FAQ from "../components/LandingPage/FAQ";

const AboutUs = () => {
  return (
    <div>
      <StorySection/>
      <WhyUsSection/>
      <BrandList/>
      <ExpertTeam/>
      <FAQ/>
    </div>
  );
};

export default AboutUs;