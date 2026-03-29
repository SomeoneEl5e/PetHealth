/**
 * FeatureItem Component
 * ---------------------
 * A reusable card for displaying a feature with an image, title,
 * and description. Used on the Home and About pages.
 *
 * Props:
 * - imageSrc: URL for the feature illustration
 * - title: feature heading text
 * - description: feature explanation text
 */
import React from 'react';
import './FeatureItem.css';

function FeatureItem({ imageSrc, title, description }) {
  return (
    <div className="feature-item">
      <img src={imageSrc} alt={title} className="feature-image" />
      <h4 className="feature-title">{title}</h4>
      <p className="feature-description">{description}</p>
    </div>
  );
}

export default FeatureItem;