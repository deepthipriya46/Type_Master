import React from 'react';

/**
 * ParAcademyLogo - Official brand logo for PAR ACADEMY
 * Renders the custom electric-blue-to-cyan gradient wordmark and sub-rule.
 */
export default function ParAcademyLogo({
  height = 44,
  className = '',
  style = {},
  collapsed = false,
  onClick = null
}) {
  if (collapsed) {
    return (
      <div
        className={`par-academy-logo-collapsed ${className}`}
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          cursor: onClick ? 'pointer' : 'default',
          overflow: 'hidden',
          padding: '4px',
          boxSizing: 'border-box',
          ...style
        }}
        title="PAR ACADEMY"
      >
        <img
          src="/par_academy_logo.png"
          alt="PAR"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            transform: 'scale(1.2)'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`par-academy-logo ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
      title="PAR ACADEMY"
    >
      <img
        src="/par_academy_logo.png"
        alt="PAR ACADEMY"
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(0, 229, 255, 0.15))'
        }}
      />
    </div>
  );
}
