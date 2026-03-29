/**
 * About Page
 * ----------
 * Public informational page describing PetHealth's mission, features,
 * and the team behind it.
 *
 * Sections:
 * 1. Hero — platform introduction
 * 2. Mission — why PetHealth exists
 * 3. For Pet Owners — feature cards for individual users
 * 4. AI Section — AI engine capabilities
 * 5. For Associations — management suite features
 * 6. Technology — tech stack overview
 * 7. Team — co-founders
 * 8. Contact — email link
 */
import React from "react";
import "./About.css";

const missionImg = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773092703/pethealth/static/pet-care-mission.svg";
const aiImg = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773092703/pethealth/static/ai-assistant.svg";
const dashboardImg = "https://res.cloudinary.com/dvjtqajgu/image/upload/v1773092703/pethealth/static/dashboard-analytics.svg";

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* ─── Hero ─── */}
        <section className="about-hero">
          <h1>About PetHealth</h1>
          <p>
            PetHealth is a modern platform dedicated to helping pet associations
            manage health records, track vaccinations, and leverage cutting-edge
            AI to ensure every pet receives the best possible care.
          </p>
        </section>

        {/* ─── Mission ─── */}
        <section className="about-highlight">
          <div className="about-highlight__content">
            <h2>Our Mission</h2>
            <p>
              We believe every pet deserves consistent, well-documented
              healthcare. PetHealth was created to bridge the gap between pet
              owners and associations, providing a centralized platform where
              health data is organized, accessible, and actionable.
            </p>
            <p>
              Our goal is to give pet associations the tools they need to monitor
              community health, ensure vaccination compliance, and make
              data-driven decisions — all while keeping the experience intuitive
              for everyday pet owners.
            </p>
          </div>
          <div className="about-highlight__image">
            <img src={missionImg} alt="Our mission — caring for pets" />
          </div>
        </section>

        {/* ─── For Pet Owners ─── */}
        <section className="about-section">
          <h2>For Pet Owners</h2>
          <p className="about-section__desc">
            A simple, intuitive experience designed for day-to-day pet care management.
          </p>
          <div className="about-features">
            <div className="about-feature-card">
              <span className="about-feature-card__icon">🐾</span>
              <h4>Multi-Pet Dashboard</h4>
              <p>Register and manage multiple pets from a single account with individual health profiles.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-card__icon">💉</span>
              <h4>Vaccination Tracking</h4>
              <p>View complete vaccination history and track every vaccine with a clear, organized timeline.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-card__icon">📋</span>
              <h4>Vet Visit History</h4>
              <p>Log every vet visit with dates, reasons, veterinarian names, and detailed notes.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-card__icon">🤖</span>
              <h4>AI Health Reports</h4>
              <p>Get AI-generated health summaries and personalized care recommendations per pet.</p>
            </div>
          </div>
        </section>

        {/* ─── AI Section ─── */}
        <section className="about-highlight about-highlight--reverse">
          <div className="about-highlight__image">
            <img src={aiImg} alt="AI-powered health analysis" />
          </div>
          <div className="about-highlight__content">
            <h2>Powered by Artificial Intelligence</h2>
            <p>
              At the heart of PetHealth is an AI engine that transforms raw
              health data into meaningful insights. By analyzing vaccination
              records, vet visits, and medical histories, our AI delivers:
            </p>
            <ul className="about-check-list">
              <li>Comprehensive per-pet health summaries</li>
              <li>Early detection of missed or overdue vaccinations</li>
              <li>Actionable care recommendations</li>
              <li>Natural language reports readable by any pet owner</li>
            </ul>
          </div>
        </section>

        {/* ─── For Associations ─── */}
        <section className="about-highlight">
          <div className="about-highlight__content">
            <h2>For Associations &amp; Management</h2>
            <p>
              PetHealth goes beyond individual pet care. Our management suite
              gives association leaders full visibility and control over their
              organization's health operations.
            </p>
            <ul className="about-check-list">
              <li>Comprehensive statistics dashboard with population-level insights</li>
              <li>Vaccination coverage analytics across your community</li>
              <li>Role-based access control — Admin, Sub-Admin, and Editor roles</li>
              <li>Real-time activity monitoring with full audit trails</li>
              <li>Centralized management of vaccine types, breeds, and pet types</li>
              <li>Team performance tracking and collaboration tools</li>
            </ul>
          </div>
          <div className="about-highlight__image">
            <img src={dashboardImg} alt="Association management dashboard" />
          </div>
        </section>

        {/* ─── Technology ─── */}
        <section className="about-tech">
          <h3>Built with Modern Technology</h3>
          <p>
            PetHealth leverages React for a responsive interface, Node.js and
            MongoDB for reliable data management, Cloudinary for secure media
            storage, and OpenAI for intelligent health analysis.
          </p>
        </section>

        {/* ─── Team ─── */}
        <section className="about-section">
          <h2>Meet Our Team</h2>
          <p className="about-section__desc">
            The people behind PetHealth, passionate about pets and technology.
          </p>
          <div className="about-team">
            <div className="about-team__member">
              <div className="about-team__avatar">LO</div>
              <h4>Liav Ovadia</h4>
              <p>Co-Founder &amp; Developer</p>
            </div>
            <div className="about-team__member">
              <div className="about-team__avatar">RA</div>
              <h4>Ron Afriat</h4>
              <p>Co-Founder &amp; Developer</p>
            </div>
          </div>
        </section>

        {/* ─── Contact ─── */}
        <section className="about-contact">
          <h2>Get in Touch</h2>
          <p>
            Have questions, feedback, or want to learn more?
            Reach out to us at{" "}
            <a href="mailto:support@pethealth.com">support@pethealth.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
