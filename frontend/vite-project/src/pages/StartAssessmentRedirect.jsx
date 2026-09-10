import { useEffect } from "react";
import "./StartAssessmentRedirect.css";

const WHATSAPP_NUMBER = "2348131952778";
const WHATSAPP_MESSAGE = "Hi, I'd like a free care assessment for my family.";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const StartAssessmentRedirect = () => {
  useEffect(() => {
    window.location.href = WHATSAPP_LINK;
  }, []);

  return (
    <div className="start-assessment-redirect">
      <div className="start-assessment-redirect__card">
        <h1>Redirecting you to WhatsApp…</h1>
        <p>
          We're taking you to chat with our care team on WhatsApp. If nothing
          happens in a few seconds, tap the button below.
        </p>
        <a
          className="start-assessment-redirect__button"
          href={WHATSAPP_LINK}
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
};

export default StartAssessmentRedirect;
