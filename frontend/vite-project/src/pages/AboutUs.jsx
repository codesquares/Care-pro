import React from "react";
import { Helmet } from "react-helmet-async";
import AboutUsTopBanner from "../components/AboutUs/AboutUsTopBanner.jsx";
import IntroSection from "../components/AboutUs/IntroSection.jsx";
import HumanExperience from "../components/AboutUs/HumanExperience.jsx";
import MissionStatement from "../components/AboutUs/MissionStatement.jsx";
import OurValues from "../components/AboutUs/OurValues.jsx";
import OurApproach from "../components/AboutUs/OurApproach.jsx";
import BottomBanner from "../components/AboutUs/BottomBanner.jsx";

const AboutUs = () => {
  return (
    <>
      <Helmet>
        <title>About Us - CarePro</title>
        <meta name="description" content="Learn about CarePro's vision, mission, and the dedicated team connecting you with trusted caregivers." />
        <link rel="canonical" href="/about-us" />
      </Helmet>

      <div className="about-us-page">
        <AboutUsTopBanner />
        <IntroSection />
        <HumanExperience />
        <MissionStatement />
        <OurValues />
        <OurApproach />
        <BottomBanner />
      </div>
    </>
  );
};

export default AboutUs;