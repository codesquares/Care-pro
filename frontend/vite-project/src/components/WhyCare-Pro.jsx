import React from "react";
import "../styles/components/why-care-pro.scss";

const WhyCarepro = () => {
  const cards = [
    {
      title: "Reliable Senior Care",
      description:
        "Our trusted caregivers are dedicated to offering respectful and dignified care for seniors, promoting a fulfilling and independent lifestyle. We're here to make everyday life easier and more enjoyable.",
      highlighted: true,
    },
    {
      title: "Personalized Care",
      description:
        "Our compassionate caregivers provide tailored support, ensuring the comfort, safety, and well-being of your loved ones. From daily assistance to specialized care, we are here every step of the way.",
      highlighted: false,
    },
    {
      title: "Expert Medical Support",
      description:
        "From medication management to post-hospitalization care, our skilled caregivers provide the medical support your loved ones need. Receive professional care without leaving the comfort of home.",
      highlighted: false,
    },
  ];

  return (
    <section className="why-carepro">
      <h2 className="why-carepro__title">Why Carepro?</h2>
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
