import React from "react";
import "../styles/components/why-care-pro.scss";
import background from "../assets/background.png"

const WhyCarepro = () => {
  const cards = [
    {
      title: "Reach More Patients",
      description:
        "Expand your visibility and connect with a wider patient base.The platform provides tools and resources to help caregivers market their services effectively, ensuring they can reach those in need of quality care and support.",
      highlighted: true,
    },
    {
      title: "Build your professional network",
      description:
        "The platform creates a community where caregivers can connect wth fellow professionals in the field. This gives craegivers the opportunity to share experiences, exchange knowledge, and build professional network that support their practice.",
      highlighted: false,
    },
    {
      title: "Better Opportunity",
      description:
        "Create a profile that showcases your skill, experience, and passion for caregiving. Attract more patient and connect with employers looking for dedicated professionals.",
      highlighted: false,
    },
  ];

  return (
    <section className="why-carepro">
      <h2 className="why-carepro__title">Why signup to Carepro?</h2>
      
      <div className="why-carepro__card-container">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`why-carepro__card ${
              card.highlighted ? "why-carepro__card--highlighted" : ""
            }`}
          >
          
            <h3 className="why-carepro__card-title">{card.title}</h3>
            <p className="why-carepro__card-description">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyCarepro;
