import StorySection from "../components/AboutUs/StorySection";
import OurValues from "../components/AboutUs/OurValues.jsx";
import BrandList from "../components/LandingPage/BrandList";
import OurApproach from "../components/AboutUs/OurApproach.jsx";
import BottomBanner from "../components/AboutUs/BottomBanner.jsx";
import AboutUsTopBanner from "../components/AboutUs/AboutUsTopBanner.jsx";
import AboutUsTeam from "../components/AboutUs/AbaoutUsTeam.jsx";


const AboutUs = () => {
  return (
    <div>
      <AboutUsTopBanner/>
      <StorySection/>
      <OurApproach/>
      <OurValues/>
      <AboutUsTeam/>
      {/* <BrandList/> */}
      {/* <BottomBanner/>  */}
    </div>

  );
};

export default AboutUs;