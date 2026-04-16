import React from "react";
import { Helmet } from "react-helmet-async";
import "../styles/pages/terms-and-conditions.css";

const TermsAndConditions = () => {
    return (
        <>
            <Helmet>
                <title>Terms and Conditions - CarePro</title>
                <meta
                    name="description"
                    content="Terms and conditions for using CarePro healthcare marketplace platform."
                />
                <link rel="canonical" href="/terms-and-conditions" />
            </Helmet>

            <div className="terms-and-conditions">

                {/* HERO HEADER */}
                <div className="terms-header">
                    <p className="last-updated">Last updated October 25, 2025</p>
                    <h1>Terms and Conditions</h1>
                </div>

                {/* BODY SECTION */}
                <div className="terms-body">
                    <div className="terms-container">

                        <div className="tc-terms-content">

                            <section className="terms-section">
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

                        {/* CONTACT BOX */}

                        <div className="contact-box">

                            <h2>
                                If you have any questions about these Terms and Conditions,
                                please contact us:
                            </h2>

                            <div className="contact-info">
                                <p>Email: legal@carepro.com</p>
                                <p>Customer Support: careproorg@gmail.com</p>
                                <p>Address: 12 Bisiriyu Lawal Str, Akowonjo, Lagos State</p>
                                <p>Phone: +234 813 195 2778</p>
                            </div>

                            <p className="emergency-note">
                                For urgent safety concerns or medical emergencies, please
                                contact your local emergency services immediately.
                            </p>

                        </div>

                    </div>
                </div>

            </div>
        </>
    );
};

export default TermsAndConditions;