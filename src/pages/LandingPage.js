import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="page landing-page">
    <div className="welcome-box">
      <h1 className="main-title">Travel Planner ✈️</h1>
      <p className="tagline"> map your journey, find the best routes, and discover the cheapest way to explore the world.</p>
      <Link to="/build" className="button primary-button">
        Get Started
      </Link>
    </div>
  </div>
);

export default LandingPage;