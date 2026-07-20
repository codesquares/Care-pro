import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import config from "../config";
import "../../styles/main-app/pages/EmailUnsubscribePage.css";

const resolveCategoryLabel = (category) => {
  if (!category) return "email";

  const normalized = category.toLowerCase();
  if (normalized.includes("marketing") || normalized.includes("promotion")) {
    return "marketing";
  }
  if (normalized.includes("new_gig") || normalized.includes("gig")) {
    return "new gig opportunity";
  }
  if (normalized.includes("care_request") || normalized.includes("care request")) {
    return "care request update";
  }

  return category.replace(/[_-]+/g, " ");
};

const EmailUnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const category = searchParams.get("category") || searchParams.get("type") || "";

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const endpointBase = useMemo(() => {
    return (
      import.meta.env.VITE_EMAIL_UNSUBSCRIBE_ENDPOINT ||
      `${config.BASE_URL}/EmailPreferences/unsubscribe`
    );
  }, []);

  useEffect(() => {
    const submitUnsubscribe = async () => {
      if (!token) {
        setStatus("error");
        setMessage("This unsubscribe link is missing a token.");
        return;
      }

      const query = new URLSearchParams({ token });
      if (category) {
        query.set("category", category);
      }

      try {
        const getResponse = await fetch(`${endpointBase}?${query.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (getResponse.ok) {
          const data = await getResponse.json().catch(() => ({}));
          setStatus("success");
          setMessage(data?.message || "Your unsubscribe request has been processed.");
          return;
        }

        const postResponse = await fetch(endpointBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, category: category || null }),
        });

        if (postResponse.ok) {
          const data = await postResponse.json().catch(() => ({}));
          setStatus("success");
          setMessage(data?.message || "Your unsubscribe request has been processed.");
          return;
        }

        const errorData = await postResponse.json().catch(() => ({}));
        setStatus("error");
        setMessage(errorData?.message || "We could not process this unsubscribe link.");
      } catch (error) {
        setStatus("error");
        setMessage(error?.message || "We could not process this unsubscribe link.");
      }
    };

    submitUnsubscribe();
  }, [category, endpointBase, token]);

  const categoryLabel = resolveCategoryLabel(category);

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-card">
        <h1>Email Preferences</h1>

        {status === "loading" && (
          <p className="unsubscribe-status">Processing your unsubscribe request...</p>
        )}

        {status === "success" && (
          <>
            <p className="unsubscribe-success">
              You have been unsubscribed from {categoryLabel} emails.
            </p>
            {message ? <p className="unsubscribe-message">{message}</p> : null}
          </>
        )}

        {status === "error" && (
          <>
            <p className="unsubscribe-error">Unable to process this unsubscribe request.</p>
            {message ? <p className="unsubscribe-message">{message}</p> : null}
          </>
        )}

        <div className="unsubscribe-actions">
          <Link className="unsubscribe-btn primary" to="/login?returnTo=/app/client/settings">
            Manage Full Preferences
          </Link>
          <Link className="unsubscribe-btn secondary" to="/">
            Back to CarePro
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailUnsubscribePage;
