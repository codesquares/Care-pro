import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import "./StartAssessmentRedirect.css";

const WHATSAPP_NUMBER = "2348131952778";
const DEFAULT_MESSAGE = "Hi, I'd like a free care assessment for my family.";

const buildMessage = (category, tier) => {
  if (category && tier) {
    return `Hi, I'd like a free care assessment for my family. I'm interested in the "${tier}" (${category}) package.`;
  }
  if (category) {
    return `Hi, I'd like a free care assessment for my family. I'm interested in the ${category} package.`;
  }
  return DEFAULT_MESSAGE;
};

const StartAssessmentRedirect = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const tier = searchParams.get("tier");

  const whatsappLink = useMemo(() => {
    const message = buildMessage(category, tier);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [category, tier]);

  useEffect(() => {
    window.location.href = whatsappLink;
  }, [whatsappLink]);

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
          href={whatsappLink}
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
};

export default StartAssessmentRedirect;
