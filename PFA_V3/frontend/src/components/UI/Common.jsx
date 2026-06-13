import React from 'react';
import './UI.css';

export const Card = ({ children, title, subtitle, icon, className = '', ...props }) => (
  <div className={`glass card ${className}`} {...props}>
    {(title || icon) && (
      <div className="card-header">
        <div className="card-title-group">
          {icon && <div className="card-icon">{icon}</div>}
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>
    )}
    <div className="card-body">
      {children}
    </div>
  </div>
);

export const Button = ({ children, variant = 'primary', size = 'md', icon, ...props }) => (
  <button className={`btn btn-${variant} btn-${size}`} {...props}>
    {icon && <span className="btn-icon">{icon}</span>}
    {children}
  </button>
);

export const Badge = ({ children, status = 'default' }) => (
  <span className={`badge badge-${status}`}>
    {children}
  </span>
);

export const Input = ({ label, error, ...props }) => (
  <div className="input-group">
    {label && <label>{label}</label>}
    <input className={`input ${error ? 'input-error' : ''}`} {...props} />
    {error && <span className="error-text">{error}</span>}
  </div>
);
