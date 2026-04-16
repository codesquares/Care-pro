import React from "react";
import { Helmet } from "react-helmet-async";
import "../styles/pages/privacy-policy.css";

const PrivacyPolicy = () => {
    return (
        <>
            <Helmet>
                <title>Privacy Policy - CarePro</title>
                <meta
                    name="description"
                    content="CarePro's Privacy Policy - Learn how we collect, use, and protect your personal information on our healthcare marketplace platform."
                />
                <link rel="canonical" href="/privacy-policy" />
            </Helmet>

            <div className="privacy-policy">
                {/* HERO HEADER */}
                <div className="privacy-header">
                    <p className="last-updated">Last updated: October 25, 2025</p>
                    <h1>
                        At CarePro, we are committed to protecting your privacy and
                        ensuring the security of your personal information.
                    </h1>
                </div>

                <div className="privacy-body">
                    <div className="privacy-container">
                        <div className="privacy-intro">
                            <p>
                                This Privacy Policy explains how we collect, use, disclose, and
                                safeguard your information when you use our healthcare
                                marketplace platform.
                            </p>
                        </div>

                        <div className="pp-content">
                            <section className="privacy-section">
                                <h2>1. Information We Collect</h2>

                                <h3>1.1 Personal Information</h3>
                                <p>
                                    When you create an account or use our services, we may collect:
                                </p>
                                <ul>
                                    <li>
                                        <strong>Identity Information:</strong> Full name, email
                                        address, phone number, date of birth
                                    </li>
                                    <li>
                                        <strong>Profile Information:</strong> Professional
                                        qualifications, certifications, work experience, profile
                                        photos
                                    </li>
                                    <li>
                                        <strong>Verification Data:</strong> Government-issued ID,
                                        background check information, professional licenses
                                    </li>
                                    <li>
                                        <strong>Financial Information:</strong> Payment methods,
                                        billing addresses, transaction history
                                    </li>
                                    <li>
                                        <strong>Location Data:</strong> Address, service areas, GPS
                                        location (when using mobile app)
                                    </li>
                                </ul>

                                <h3>1.2 Service Usage Information</h3>
                                <ul>
                                    <li>
                                        <strong>Platform Activity:</strong> Search history,
                                        bookings, messages, reviews, preferences
                                    </li>
                                    <li>
                                        <strong>Communication Data:</strong> Messages between users,
                                        customer support interactions
                                    </li>
                                    <li>
                                        <strong>Device Information:</strong> IP address, browser
                                        type, device identifiers, operating system
                                    </li>
                                    <li>
                                        <strong>Usage Analytics:</strong> Page views, feature
                                        usage, session duration, click patterns
                                    </li>
                                </ul>

                                <h3>1.3 Information from Third Parties</h3>
                                <ul>
                                    <li>
                                        <strong>Background Check Providers:</strong> Criminal
                                        history, employment verification
                                    </li>
                                    <li>
                                        <strong>Social Media Platforms:</strong> When you choose to
                                        connect your social accounts
                                    </li>
                                    <li>
                                        <strong>Payment Processors:</strong> Transaction and fraud
                                        prevention data
                                    </li>
                                    <li>
                                        <strong>Marketing Partners:</strong> Demographic and
                                        interest-based information
                                    </li>
                                </ul>
                            </section>
                        </div>

                        {/* FOOTER BOX */}
                        <div className="privacy-footer-box">
                            <h2>
                                This Privacy Policy is part of our Terms of Service and should be
                                read in conjunction with our{" "}
                                <a href="/terms-and-conditions" className="terms-link">
                                    Terms and Conditions
                                </a>
                                .
                            </h2>
                            <p>
                                For the most current version of this Privacy Policy, please visit
                                this page. We recommend reviewing this policy periodically to stay
                                informed about how we protect your information.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;