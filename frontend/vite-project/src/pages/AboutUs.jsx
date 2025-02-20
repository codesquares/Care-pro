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
      <BottomBanner
        title="Become Caregiver today!"
        description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
        buttonText="Become a Caregiver"
        imageUrl={genralImg}
        onButtonClick={() => setIsModalOpen(true)}
        backgroundColor="#015476"
      />
      
    </div>

  );
};

export default AboutUs;