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