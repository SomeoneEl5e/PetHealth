import React from "react";
import "./Home.css";
import FeatureItem from "../components/FeatureItem";

const mainImg = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773090954/pethealth/static/home_main.jpg";
const easyTrack = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773093787/pethealth/static/health-records.svg";
const vaccineShield = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773093787/pethealth/static/vaccination-shield.svg";
const insight = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773093787/pethealth/static/health-analytics.svg";
const aiAssistant = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773092703/pethealth/static/ai-assistant.svg";
const dashboardImg = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773092703/pethealth/static/dashboard-analytics.svg";
const multiPet = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773094192/pethealth/static/multi-pet-profiles.svg";
const teamMgmt = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773094192/pethealth/static/team-management.svg";

const FEATURES = [
  {
    imageSrc: aiAssistant,
    title: "AI Health Summaries",
    description:
      "Get instant, AI-generated health assessments for each pet based on their complete medical history.",
  },
  {
    imageSrc: vaccineShield,
    title: "Vaccination Management",
    description:
      "Track vaccination records and ensure every pet stays up to date with a clear, organized vaccine history.",
  },
  {
    imageSrc: easyTrack,
    title: "Complete Health Records",
    description:
      "Maintain detailed vet visit histories, medical notes, and health documents in one organized place.",
  },
  {
    imageSrc: insight,
    title: "Health Analytics",
    description:
      "Gain data-driven insights across your entire pet population with comprehensive statistics.",
  },
  {
    imageSrc: multiPet,
    title: "Multi-Pet Profiles",
    description:
      "Register and manage multiple pets from a single account, each with their own detailed health profile.",
  },
  {
    imageSrc: teamMgmt,
    title: "Team & Role Management",
    description:
      "Organize your association with role-based access control — Admin, Sub-Admin, and Editor permissions.",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-container">
        {/* ─── Hero Section ─── */}
        <section className="home-hero">
          <h1>Empowering Pet Associations with Intelligent Health Management</h1>
          <p className="home-hero__subtitle">
            PetHealth is a comprehensive platform built for pet associations to
            streamline health record management, automate vaccination tracking,
            and leverage AI-powered insights — all from one unified dashboard.
          </p>
          <img src={mainImg} alt="Happy pets" className="hero-image" />
        </section>

        {/* ─── Key Features ─── */}
        <section className="home-section">
          <h2>Key Features</h2>
          <p className="home-section__desc">
            Everything your association needs to deliver exceptional pet healthcare.
          </p>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <FeatureItem
                key={feature.title}
                imageSrc={feature.imageSrc}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        {/* ─── AI Highlight ─── */}
        <section className="home-highlight">
          <div className="home-highlight__content">
            <h2>AI-Powered Intelligence at Your Fingertips</h2>
            <p>
              Our integrated AI assistant analyzes each pet's complete health
              history — vaccinations, vet visits, and medical records — to
              generate comprehensive health summaries and actionable
              recommendations.
            </p>
            <ul className="home-highlight__list">
              <li>Automated health assessments per pet</li>
              <li>Smart detection of missed vaccinations</li>
              <li>Personalized care recommendations</li>
              <li>Natural language summaries for quick review</li>
            </ul>
          </div>
          <div className="home-highlight__image">
            <img src={aiAssistant} alt="AI-powered health analysis" />
          </div>
        </section>

        {/* ─── Management Section ─── */}
        <section className="home-highlight home-highlight--reverse">
          <div className="home-highlight__image">
            <img src={dashboardImg} alt="Management dashboard" />
          </div>
          <div className="home-highlight__content">
            <h2>Built for Association Management</h2>
            <p>
              PetHealth provides powerful management tools designed for team
              collaboration. Monitor your organization's activity with real-time
              analytics and manage team permissions with role-based access control.
            </p>
            <ul className="home-highlight__list">
              <li>Real-time activity monitoring and audit trails</li>
              <li>Population-level vaccination coverage analytics</li>
              <li>Role-based access control for your team</li>
              <li>Centralized breed and vaccine type management</li>
            </ul>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="home-cta">
          <h2>Ready to Transform Your Pet Health Management?</h2>
          <p>
            Join pet associations that trust PetHealth to keep their communities
            healthy, informed, and well-cared for.
          </p>
        </section>
      </div>
    </div>
  );
}
