import { Link, useNavigate } from "react-router-dom";
import "./RefundPolicy.css";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="refund-policy-page">
      <div className="refund-policy-hero">
        <div className="refund-policy-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Refund Policy</h1>
          <p className="last-updated">Last Updated: December 5, 2025</p>
        </div>
      </div>

      <div className="refund-policy-container">
        <div className="refund-policy-content">
          <section className="policy-section">
            <h2>Our Commitment to You</h2>
            <p>
              At CarePro, we are committed to providing exceptional care services and ensuring customer satisfaction. 
              We understand that sometimes circumstances change, and we have established this refund policy to address 
              such situations fairly and transparently.
            </p>
          </section>

          <section className="policy-section">
            <h2>Refund Eligibility</h2>
            <p>Refunds may be considered under the following circumstances:</p>
            <ul>
              <li>
                <strong>Service Not Delivered:</strong> If a caregiver fails to show up for a confirmed booking without 
                prior notice or valid reason.
              </li>
              <li>
                <strong>Service Quality Issues:</strong> If the service provided significantly deviates from what was 
                agreed upon or advertised.
              </li>
              <li>
                <strong>Platform Technical Issues:</strong> If technical problems on our platform prevent you from 
                receiving the service you paid for.
              </li>
              <li>
                <strong>Cancellation Policy:</strong> Cancellations made in accordance with our cancellation terms may 
                be eligible for partial or full refunds.
              </li>
              <li>
                <strong>Duplicate Charges:</strong> If you were charged multiple times for the same service due to a 
                system error.
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Non-Refundable Situations</h2>
            <p>Refunds will not be provided in the following cases:</p>
            <ul>
              <li>Services that have been completed as agreed</li>
              <li>Late cancellations or no-shows by the client</li>
              <li>Change of mind after service commencement</li>
              <li>Minor disagreements that do not affect service quality</li>
              <li>Services cancelled outside of the cancellation policy window</li>
              <li>Requests made more than 30 days after service completion</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>How to Request a Refund</h2>
            <div className="refund-steps">
              <div className="refund-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Contact Support</h3>
                  <p>
                    Reach out to our customer support team through the platform's support chat, email, or contact form. 
                    Provide your booking details and explain the reason for your refund request.
                  </p>
                </div>
              </div>

              <div className="refund-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Provide Documentation</h3>
                  <p>
                    Submit any relevant evidence to support your claim, such as photos, messages, or other documentation 
                    that helps us understand the issue.
                  </p>
                </div>
              </div>

              <div className="refund-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Review Process</h3>
                  <p>
                    Our team will review your request within 3-5 business days. We may reach out to you or the caregiver 
                    for additional information during this process.
                  </p>
                </div>
              </div>

              <div className="refund-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Decision & Processing</h3>
                  <p>
                    Once approved, refunds are processed within 7-10 business days to your original payment method. 
                    You will receive a confirmation email with the refund details.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>Refund Processing Timeline</h2>
            <p>
              <strong>Review Period:</strong> 3-5 business days from the time of request submission
            </p>
            <p>
              <strong>Processing Time:</strong> 7-10 business days after approval for the refund to appear in your account
            </p>
            <p>
              <strong>Note:</strong> Depending on your bank or payment provider, it may take additional time for the 
              refund to reflect in your account.
            </p>
          </section>

          <section className="policy-section">
            <h2>Partial Refunds</h2>
            <p>
              In some cases, a partial refund may be issued if:
            </p>
            <ul>
              <li>The service was partially completed</li>
              <li>The issue affected only a portion of the service</li>
              <li>A cancellation occurred mid-service with mutual agreement</li>
            </ul>
            <p>
              The amount of the partial refund will be determined based on the specific circumstances and will be 
              communicated to you during the review process.
            </p>
          </section>

          <section className="policy-section">
            <h2>Dispute Resolution</h2>
            <p>
              If you disagree with a refund decision, you may request a secondary review by contacting our support 
              team within 7 days of the initial decision. We will escalate your case to our senior management team 
              for further evaluation.
            </p>
          </section>

          <section className="policy-section">
            <h2>Platform Fees</h2>
            <p>
              Service fees and platform charges are generally non-refundable unless the refund is due to a platform 
              error or technical issue on our end. Each case is evaluated individually.
            </p>
          </section>

          <section className="policy-section">
            <h2>Caregiver Compensation</h2>
            <p>
              When a refund is issued, we work fairly with both clients and caregivers. Caregivers will be compensated 
              for any work completed, and the refund amount will reflect the portion of service not delivered or not 
              meeting quality standards.
            </p>
          </section>

          <section className="policy-section">
            <h2>Contact Information</h2>
            <p>
              For refund requests or questions about this policy, please contact our support team:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> careproorg@gmail.com</p>
              <p><strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (WAT)</p>
              <p><strong>Response Time:</strong> Within 24 hours</p>
            </div>
          </section>

          <section className="policy-section">
            <h2>Changes to This Policy</h2>
            <p>
              We reserve the right to update or modify this refund policy at any time. Any changes will be posted on 
              this page with an updated "Last Updated" date. We encourage you to review this policy periodically to 
              stay informed about how we handle refunds.
            </p>
          </section>

          <section className="policy-section policy-footer">
            <p>
              This refund policy is part of our commitment to transparency and customer satisfaction. By using CarePro's 
              services, you acknowledge that you have read, understood, and agree to this refund policy.
            </p>
            <div className="policy-links">
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
              <span>|</span>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
