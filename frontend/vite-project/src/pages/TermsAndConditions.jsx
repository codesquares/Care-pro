import React from 'react';
import { Helmet } from 'react-helmet-async';
import '../styles/pages/terms-and-conditions.scss';

const TermsAndConditions = () => {
  return (
    <>
      <Helmet>
        <title>Terms and Conditions - CarePro</title>
        <meta name="description" content="Terms and conditions for using CarePro healthcare marketplace platform. Learn about our service agreement, user responsibilities, and policies." />
        <meta name="keywords" content="terms and conditions, service agreement, healthcare marketplace, caregiver platform, user agreement" />
        <meta property="og:title" content="Terms and Conditions - CarePro" />
        <meta property="og:description" content="Comprehensive terms and conditions for CarePro healthcare marketplace platform." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/terms-and-conditions" />
      </Helmet>

      <div className="terms-and-conditions">
        <div className="terms-container">
          <div className="terms-header">
            <h1>Terms and Conditions</h1>
            <p className="last-updated">Last updated: October 25, 2025</p>
          </div>

          <div className="terms-content">
            <section className="terms-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing and using CarePro ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this platform.
              </p>
              <p>
                These Terms and Conditions govern your use of our healthcare marketplace platform that connects clients with qualified caregivers for 
                various healthcare and personal care services.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Description of Service</h2>
              <p>
                CarePro is an online marketplace platform that facilitates connections between clients seeking healthcare and personal care services 
                and qualified caregivers who provide such services. We do not directly provide healthcare services but serve as an intermediary platform.
              </p>
              <h3>2.1 Platform Services</h3>
              <ul>
                <li>Caregiver profiles and verification systems</li>
                <li>Client-caregiver matching and communication tools</li>
                <li>Booking and scheduling management</li>
                <li>Payment processing and escrow services</li>
                <li>Review and rating systems</li>
                <li>Customer support and dispute resolution</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. User Registration and Accounts</h2>
              <h3>3.1 Account Creation</h3>
              <p>
                To use our services, you must create an account by providing accurate, current, and complete information. You are responsible for 
                safeguarding your account credentials and for all activities that occur under your account.
              </p>
              <h3>3.2 Account Types</h3>
              <ul>
                <li><strong>Client Accounts:</strong> For individuals seeking healthcare and personal care services</li>
                <li><strong>Caregiver Accounts:</strong> For qualified professionals providing healthcare and personal care services</li>
              </ul>
              <h3>3.3 Account Verification</h3>
              <p>
                All users may be subject to identity verification processes. Caregivers must undergo additional verification including background checks, 
                credential verification, and skills assessment as required by applicable regulations.
              </p>
            </section>

            <section className="terms-section">
              <h2>4. Client Terms and Responsibilities</h2>
              <h3>4.1 Booking Services</h3>
              <p>
                Clients may browse caregiver profiles, request services, and make bookings through our platform. All bookings are subject to 
                caregiver availability and acceptance.
              </p>
              <h3>4.2 Client Responsibilities</h3>
              <ul>
                <li>Provide accurate information about care requirements and health conditions</li>
                <li>Ensure a safe working environment for caregivers</li>
                <li>Respect caregivers' professional boundaries and qualifications</li>
                <li>Make timely payments for services rendered</li>
                <li>Communicate respectfully and professionally</li>
                <li>Report any issues or concerns promptly</li>
              </ul>
              <h3>4.3 Medical Information</h3>
              <p>
                Clients are responsible for sharing relevant medical information necessary for safe care provision while maintaining their right to 
                privacy. Critical health information should be disclosed to ensure appropriate care matching.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Caregiver Terms and Responsibilities</h2>
              <h3>5.1 Professional Standards</h3>
              <p>
                Caregivers must maintain current licenses, certifications, and qualifications required for their services. They must adhere to 
                professional standards and applicable healthcare regulations.
              </p>
              <h3>5.2 Caregiver Responsibilities</h3>
              <ul>
                <li>Maintain current professional licenses and certifications</li>
                <li>Provide services within their scope of practice and qualifications</li>
                <li>Maintain client confidentiality and privacy</li>
                <li>Document services provided accurately</li>
                <li>Report incidents or emergencies as required by law</li>
                <li>Communicate professionally with clients and platform staff</li>
                <li>Comply with all applicable healthcare regulations and laws</li>
              </ul>
              <h3>5.3 Independent Contractor Status</h3>
              <p>
                Caregivers using our platform are independent contractors, not employees of CarePro. Caregivers are responsible for their own taxes, 
                insurance, and regulatory compliance.
              </p>
            </section>

            <section className="terms-section">
              <h2>6. Payment Terms</h2>
              <h3>6.1 Payment Processing</h3>
              <p>
                CarePro facilitates payment processing between clients and caregivers. Payments are processed securely through our payment partners 
                and may be subject to platform fees.
              </p>
              <h3>6.2 Platform Fees</h3>
              <p>
                CarePro charges service fees for platform usage, which may include booking fees, payment processing fees, and commission on transactions. 
                Current fee structures are available in your account dashboard.
              </p>
              <h3>6.3 Refunds and Cancellations</h3>
              <p>
                Refund and cancellation policies vary based on service type and timing. Clients may be eligible for refunds under specific circumstances 
                as outlined in our cancellation policy. Disputes regarding payments will be handled through our resolution process.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. Prohibited Uses and Conduct</h2>
              <h3>7.1 Platform Misuse</h3>
              <p>You may not use our platform for any unlawful purposes or any purposes prohibited under these terms. Prohibited activities include:</p>
              <ul>
                <li>Providing false or misleading information</li>
                <li>Impersonating another person or entity</li>
                <li>Harassment, discrimination, or abusive behavior</li>
                <li>Attempting to bypass platform fees or payment systems</li>
                <li>Sharing inappropriate or explicit content</li>
                <li>Violating healthcare regulations or professional standards</li>
                <li>Attempting to damage or disrupt platform functionality</li>
              </ul>
              <h3>7.2 Professional Boundaries</h3>
              <p>
                All interactions must maintain appropriate professional boundaries. Romantic or sexual relationships between clients and caregivers 
                met through our platform are strictly prohibited and may result in account termination.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. Platform Policies</h2>
              <h3>8.1 Background Checks and Verification</h3>
              <p>
                CarePro implements verification processes for caregivers, which may include background checks, reference verification, and credential 
                validation. However, we cannot guarantee the accuracy of all information provided by users.
              </p>
              <h3>8.2 Reviews and Ratings</h3>
              <p>
                Our platform includes a review and rating system to help users make informed decisions. Reviews must be honest, relevant, and based on 
                actual experiences. Fake or misleading reviews are prohibited.
              </p>
              <h3>8.3 Communication Guidelines</h3>
              <p>
                All communication through our platform should remain professional and related to care services. We reserve the right to monitor 
                communications for safety and quality assurance purposes.
              </p>
            </section>

            <section className="terms-section">
              <h2>9. Limitation of Liability</h2>
              <h3>9.1 Platform Limitations</h3>
              <p>
                CarePro serves as an intermediary platform and is not responsible for the quality, safety, or legality of services provided by caregivers. 
                We do not practice medicine or provide healthcare services directly.
              </p>
              <h3>9.2 Liability Disclaimer</h3>
              <p>
                To the fullest extent permitted by law, CarePro shall not be liable for any indirect, incidental, special, consequential, or punitive 
                damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other 
                intangible losses resulting from your use of our platform.
              </p>
              <h3>9.3 Insurance Requirements</h3>
              <p>
                Caregivers are strongly encouraged to maintain appropriate professional liability insurance. Clients should verify insurance coverage 
                before engaging services.
              </p>
            </section>

            <section className="terms-section">
              <h2>10. Intellectual Property</h2>
              <p>
                The CarePro platform, including its original content, features, and functionality, is owned by CarePro and is protected by international 
                copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <h3>10.1 User Content</h3>
              <p>
                Users retain ownership of content they submit but grant CarePro a license to use, modify, and display such content as necessary for 
                platform operation and service provision.
              </p>
            </section>

            <section className="terms-section">
              <h2>11. Dispute Resolution</h2>
              <h3>11.1 Internal Resolution</h3>
              <p>
                We encourage users to resolve disputes directly when possible. Our customer support team is available to assist with conflict resolution 
                and mediation services.
              </p>
              <h3>11.2 Escalation Process</h3>
              <p>
                For disputes that cannot be resolved through direct communication, we provide a structured escalation process including mediation services 
                and, if necessary, binding arbitration as permitted by law.
              </p>
              <h3>11.3 Emergency Situations</h3>
              <p>
                In case of medical emergencies or safety concerns, users should contact emergency services immediately. Platform dispute resolution is not 
                intended for urgent safety matters.
              </p>
            </section>

            <section className="terms-section">
              <h2>12. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our platform. 
                By using our services, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
              <h3>12.1 Health Information</h3>
              <p>
                We handle health-related information with special care in compliance with applicable healthcare privacy regulations including HIPAA where 
                applicable. Users are responsible for only sharing health information necessary for safe care provision.
              </p>
            </section>

            <section className="terms-section">
              <h2>13. Platform Modifications and Termination</h2>
              <h3>13.1 Service Changes</h3>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of our platform at any time. We will provide reasonable notice of 
                significant changes that affect user experience.
              </p>
              <h3>13.2 Account Termination</h3>
              <p>
                We may terminate or suspend accounts for violations of these terms, illegal activities, or other reasons that compromise platform safety 
                and integrity. Users may also terminate their accounts at any time.
              </p>
              <h3>13.3 Effect of Termination</h3>
              <p>
                Upon termination, your right to use the platform will cease immediately. Certain provisions of these terms will survive termination, 
                including liability limitations and intellectual property rights.
              </p>
            </section>

            <section className="terms-section">
              <h2>14. Regulatory Compliance</h2>
              <h3>14.1 Healthcare Regulations</h3>
              <p>
                Users are responsible for compliance with all applicable healthcare regulations in their jurisdiction, including licensing requirements, 
                scope of practice limitations, and patient safety regulations.
              </p>
              <h3>14.2 Platform Compliance</h3>
              <p>
                CarePro strives to maintain compliance with applicable regulations governing healthcare marketplaces and digital platforms. We may modify 
                our services to maintain regulatory compliance.
              </p>
            </section>

            <section className="terms-section">
              <h2>15. Governing Law and Jurisdiction</h2>
              <p>
                These Terms and Conditions are governed by and construed in accordance with applicable laws. Any disputes arising from these terms or 
                platform usage will be subject to the jurisdiction of appropriate courts as determined by applicable law and user location.
              </p>
            </section>

            <section className="terms-section">
              <h2>16. Changes to Terms</h2>
              <p>
                We reserve the right to update these Terms and Conditions at any time. Users will be notified of significant changes through platform 
                notifications or email. Continued use of the platform after changes constitutes acceptance of updated terms.
              </p>
              <p>
                We recommend reviewing these terms periodically to stay informed about your rights and responsibilities as a platform user.
              </p>
            </section>

            <section className="terms-section">
              <h2>17. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="contact-info">
                <p><strong>Email:</strong> legal@carepro.com</p>
                <p><strong>Customer Support:</strong> careproorg@gmail.com</p>
                <p><strong>Address:</strong> 12 Bisiriyu Lawal Str, Akowonjo, Lagos State</p>
                <p><strong>Phone:</strong> +234 813 195 2778</p>
              </div>
              <p>
                For urgent safety concerns or medical emergencies, please contact your local emergency services immediately.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsAndConditions;