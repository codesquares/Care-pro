import React from 'react';
import { Helmet } from 'react-helmet-async';
import '../styles/pages/privacy-policy.scss';

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | CarePro</title>
        <meta name="description" content="CarePro's Privacy Policy - Learn how we collect, use, and protect your personal information on our healthcare marketplace platform." />
      </Helmet>
      
      <div className="privacy-policy-page">
        <div className="privacy-container">
          <div className="privacy-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: October 25, 2025</p>
            <p className="intro">
              At CarePro, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              healthcare marketplace platform.
            </p>
          </div>

          <div className="privacy-content">
            <section className="privacy-section">
              <h2>1. Information We Collect</h2>
              
              <h3>1.1 Personal Information</h3>
              <p>When you create an account or use our services, we may collect:</p>
              <ul>
                <li><strong>Identity Information:</strong> Full name, email address, phone number, date of birth</li>
                <li><strong>Profile Information:</strong> Professional qualifications, certifications, work experience, profile photos</li>
                <li><strong>Verification Data:</strong> Government-issued ID, background check information, professional licenses</li>
                <li><strong>Financial Information:</strong> Payment methods, billing addresses, transaction history</li>
                <li><strong>Location Data:</strong> Address, service areas, GPS location (when using mobile app)</li>
              </ul>

              <h3>1.2 Service Usage Information</h3>
              <ul>
                <li><strong>Platform Activity:</strong> Search history, bookings, messages, reviews, preferences</li>
                <li><strong>Communication Data:</strong> Messages between users, customer support interactions</li>
                <li><strong>Device Information:</strong> IP address, browser type, device identifiers, operating system</li>
                <li><strong>Usage Analytics:</strong> Page views, feature usage, session duration, click patterns</li>
              </ul>

              <h3>1.3 Information from Third Parties</h3>
              <ul>
                <li><strong>Background Check Providers:</strong> Criminal history, employment verification</li>
                <li><strong>Social Media Platforms:</strong> When you choose to connect your social accounts</li>
                <li><strong>Payment Processors:</strong> Transaction and fraud prevention data</li>
                <li><strong>Marketing Partners:</strong> Demographic and interest-based information</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>2. How We Use Your Information</h2>
              
              <h3>2.1 Platform Operations</h3>
              <ul>
                <li>Creating and managing user accounts</li>
                <li>Facilitating connections between clients and caregivers</li>
                <li>Processing payments and managing transactions</li>
                <li>Providing customer support and resolving disputes</li>
                <li>Enabling communication through our messaging system</li>
              </ul>

              <h3>2.2 Safety and Security</h3>
              <ul>
                <li>Verifying user identities and professional qualifications</li>
                <li>Conducting background checks and screening processes</li>
                <li>Detecting and preventing fraud, abuse, and illegal activities</li>
                <li>Monitoring platform usage for safety compliance</li>
                <li>Implementing security measures to protect user data</li>
              </ul>

              <h3>2.3 Service Improvement</h3>
              <ul>
                <li>Analyzing usage patterns to improve platform functionality</li>
                <li>Developing new features and services</li>
                <li>Personalizing user experience and recommendations</li>
                <li>Conducting research and analytics for service enhancement</li>
              </ul>

              <h3>2.4 Marketing and Communication</h3>
              <ul>
                <li>Sending service-related notifications and updates</li>
                <li>Marketing our services and promoting new features</li>
                <li>Conducting surveys and gathering feedback</li>
                <li>Sending newsletters and promotional content (with consent)</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. Information Sharing and Disclosure</h2>
              
              <h3>3.1 With Other Users</h3>
              <p>We share limited information to facilitate connections:</p>
              <ul>
                <li><strong>Public Profile Information:</strong> Name, photo, qualifications, reviews, service areas</li>
                <li><strong>Service Details:</strong> Availability, pricing, service descriptions</li>
                <li><strong>Communication:</strong> Messages between matched users through our platform</li>
              </ul>

              <h3>3.2 With Service Providers</h3>
              <ul>
                <li><strong>Payment Processors:</strong> Stripe, PayPal for transaction processing</li>
                <li><strong>Background Check Providers:</strong> For identity and criminal history verification</li>
                <li><strong>Cloud Storage:</strong> AWS, Google Cloud for data hosting and storage</li>
                <li><strong>Analytics Services:</strong> Google Analytics for usage analysis</li>
                <li><strong>Communication Tools:</strong> Email and SMS service providers</li>
              </ul>

              <h3>3.3 Legal Requirements</h3>
              <p>We may disclose information when required by law or to:</p>
              <ul>
                <li>Comply with court orders, subpoenas, or legal processes</li>
                <li>Protect our rights, property, or safety</li>
                <li>Investigate fraud, security issues, or violations of our Terms</li>
                <li>Cooperate with law enforcement or regulatory authorities</li>
              </ul>

              <h3>3.4 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction, subject to the same privacy protections.</p>
            </section>

            <section className="privacy-section">
              <h2>4. Data Security and Protection</h2>
              
              <h3>4.1 Security Measures</h3>
              <ul>
                <li><strong>Encryption:</strong> All data transmission uses SSL/TLS encryption</li>
                <li><strong>Access Controls:</strong> Restricted access to personal information on a need-to-know basis</li>
                <li><strong>Regular Audits:</strong> Periodic security assessments and vulnerability testing</li>
                <li><strong>Employee Training:</strong> Regular privacy and security training for all staff</li>
                <li><strong>Incident Response:</strong> Comprehensive procedures for data breach management</li>
              </ul>

              <h3>4.2 Data Storage</h3>
              <ul>
                <li>Data is stored on secure, encrypted servers with industry-standard protection</li>
                <li>Regular backups are maintained to prevent data loss</li>
                <li>Access logs are monitored and maintained for security purposes</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>5. Your Privacy Rights and Choices</h2>
              
              <h3>5.1 Account Management</h3>
              <ul>
                <li><strong>Access:</strong> View and download your personal information</li>
                <li><strong>Update:</strong> Modify your profile and account settings</li>
                <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              </ul>

              <h3>5.2 Communication Preferences</h3>
              <ul>
                <li>Opt out of marketing emails via unsubscribe links</li>
                <li>Manage notification preferences in your account settings</li>
                <li>Control marketing communications through your profile</li>
              </ul>

              <h3>5.3 Location Services</h3>
              <ul>
                <li>Enable or disable location tracking in your device settings</li>
                <li>Control location-based features within the app</li>
                <li>Manage location data sharing preferences</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>6. Cookies and Tracking Technologies</h2>
              
              <h3>6.1 Types of Cookies</h3>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and personalization choices</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>

              <h3>6.2 Managing Cookies</h3>
              <p>You can control cookies through your browser settings. Note that disabling essential cookies may affect platform functionality.</p>
            </section>

            <section className="privacy-section">
              <h2>7. Third-Party Services and Links</h2>
              
              <p>Our platform may contain links to third-party websites or integrate with external services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information.</p>
              
              <h3>7.1 Integrated Services</h3>
              <ul>
                <li><strong>Payment Processing:</strong> Stripe, PayPal payment gateways</li>
                <li><strong>Identity Verification:</strong> Dojah verification services</li>
                <li><strong>Communication:</strong> Email and SMS providers</li>
                <li><strong>Analytics:</strong> Google Analytics for platform insights</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>8. Data Retention</h2>
              
              <h3>8.1 Retention Periods</h3>
              <ul>
                <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                <li><strong>Inactive Accounts:</strong> Data may be retained for up to 3 years after last activity</li>
                <li><strong>Financial Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Safety Records:</strong> Background check data retained as required by law</li>
                <li><strong>Legal Holds:</strong> Data may be retained longer when required for legal proceedings</li>
              </ul>

              <h3>8.2 Deletion Process</h3>
              <p>When data is no longer needed, it is securely deleted or anonymized in accordance with industry best practices and legal requirements.</p>
            </section>

            <section className="privacy-section">
              <h2>9. International Data Transfers</h2>
              
              <p>CarePro operates primarily in Nigeria, but we may transfer data internationally for processing and storage. We ensure appropriate safeguards are in place when transferring data across borders, including:</p>
              <ul>
                <li>Standard contractual clauses with international partners</li>
                <li>Compliance with applicable data protection laws</li>
                <li>Adequate security measures during data transfer</li>
                <li>Regular assessment of international transfer arrangements</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>10. Children's Privacy</h2>
              
              <p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a minor, please contact us immediately.</p>
            </section>

            <section className="privacy-section">
              <h2>11. Changes to This Privacy Policy</h2>
              
              <p>We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will:</p>
              <ul>
                <li>Notify users of material changes via email or platform notifications</li>
                <li>Update the "Last Modified" date at the top of this policy</li>
                <li>Provide a summary of significant changes when applicable</li>
                <li>Maintain previous versions for reference</li>
              </ul>
              
              <p>Your continued use of our services after any changes constitutes acceptance of the updated Privacy Policy.</p>
            </section>

            <section className="privacy-section">
              <h2>12. Contact Information</h2>
              
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
              
              <div className="contact-info">
                <h3>CarePro Privacy Team</h3>
                <p><strong>Email:</strong> privacy@oncarepro.com</p>
                <p><strong>Phone:</strong> +234 813 195 2778</p>
                <p><strong>Address:</strong> 12 Bisiriyu Lawal Street, Akowonjo, Lagos State, Nigeria</p>
                
                <h3>Data Protection Officer</h3>
                <p><strong>Email:</strong> dpo@oncarepro.com</p>
                
                <h3>Response Time</h3>
                <p>We aim to respond to all privacy-related inquiries within 30 days. For urgent matters, please indicate "URGENT" in your subject line.</p>
              </div>
            </section>

            <section className="privacy-section">
              <h2>13. Regulatory Compliance</h2>
              
              <p>CarePro is committed to compliance with applicable data protection regulations, including:</p>
              <ul>
                <li><strong>Nigeria Data Protection Regulation (NDPR)</strong></li>
                <li><strong>General Data Protection Regulation (GDPR)</strong> for EU users</li>
                <li><strong>California Consumer Privacy Act (CCPA)</strong> for California residents</li>
                <li><strong>Healthcare-specific regulations</strong> as applicable to our services</li>
              </ul>
              
              <p>We regularly review and update our practices to ensure ongoing compliance with evolving privacy laws and regulations.</p>
            </section>
          </div>

          <div className="privacy-footer">
            <p>
              This Privacy Policy is part of our Terms of Service and should be read in conjunction with our 
              <a href="/terms-and-conditions"> Terms and Conditions</a>.
            </p>
            <p>
              For the most current version of this Privacy Policy, please visit this page. 
              We recommend reviewing this policy periodically to stay informed about how we protect your information.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;