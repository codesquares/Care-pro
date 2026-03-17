import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import '../styles/pages/team.css';
import bannerTeamImg from '../assets/bannerteam.jpg';

// Importing team member images
import segun from '../assets/segunidowu.png';
import lola from '../assets/lolaidowu2.jpg';
import victor from '../assets/victor.jpeg';
import james from '../assets/faniyi.jpeg'; // Using faniyi.jpeg as James as per previous design logic
import ifeoluwa from '../assets/ifeoluwa.jpeg';
import enoch from '../assets/enochaina.png';

const teamMembers = [
    {
        name: "Oluwasegun Idowu",
        role: "CEO",
        image: segun
    },
    {
        name: "Lola Idowu",
        role: "Co-Founder, Health Consultant",
        image: lola
    },
    {
        name: "Victor Gwatana",
        role: "Co-Founder, Design & Strategy Lead",
        image: victor
    },
    {
        name: "Micheal Faniyi",
        role: "Co-Founder, R&D",
        image: james
    },
    {
        name: "Ifeoluwa Adelokun",
        role: "Finance & Compliance Officer",
        image: ifeoluwa
    },
    {
        name: "Enoch Aina",
        role: "Operations Officer",
        image: enoch
    }
];

const Team = () => {
    return (
        <>
            <Helmet>
                <title>Our Team - CarePro</title>
                <meta name="description" content="Meet the dedicated team behind CarePro, providing a better home care experience." />
                <link rel="canonical" href="/team" />
            </Helmet>

            <div className="team-page">
                {/* HERO SECTION */}
                <header className="team-hero" style={{ backgroundImage: `url(${bannerTeamImg})` }}>
                    <div className="hero-content">
                        <p className="subtitle">Our Team</p>
                        <h1>
                            Your Trusted Partners,<br />
                            providing all you need for a<br />
                            better home care experience.
                        </h1>
                    </div>
                    {/* Decorative stars/blobs can be handled via CSS background-image or absolute elements */}
                </header>

                {/* TEAM GRID */}
                <section className="team-section">
                    <div className="team-grid">
                        {teamMembers.map((member, index) => (
                            <div className="team-card" key={index}>
                                <div className="member-image-wrapper">
                                    <img src={member.image} alt={member.name} className="member-image" />
                                </div>
                                <div className="member-info">
                                    <h3>{member.name}</h3>
                                    <p>{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA SECTION */}
                <section className="team-cta">
                    <div className="cta-banner">
                        <div className="cta-content">
                            <h2>Start your journey on Carepro</h2>
                            <p>Join thousands of families who trust CarePro for quality care.</p>
                            <div className="cta-buttons">
                                <Link to="/book-caregiver" className="btn-primary">Hire a Caregiver</Link>
                                <Link to="/become-caregiver" className="btn-secondary">Become a Caregiver</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default Team;
