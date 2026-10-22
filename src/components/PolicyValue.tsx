import React from 'react';
import { config } from '../config';

interface PolicyValueProps {
  value: string;
  isEmail?: boolean;
  isPhone?: boolean;
  className?: string;
}

export const PolicyValue: React.FC<PolicyValueProps> = ({ value, isEmail, isPhone, className }) => {
  if (!value) return null;
  const trimmed = value.trim();

  // If value starts with "[", render as-is highlighted in yellow
  if (trimmed.startsWith('[')) {
    return (
      <mark
        className={className}
        style={{
          background: '#fef08a',
          color: '#854d0e',
          padding: '1px 6px',
          borderRadius: '4px',
          fontWeight: 600,
          display: 'inline-block',
        }}
      >
        {value}
      </mark>
    );
  }

  if (isEmail) {
    return (
      <a
        href={`mailto:${trimmed}`}
        className={className}
        style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline' }}
      >
        {trimmed}
      </a>
    );
  }

  if (isPhone) {
    return (
      <a
        href={`tel:${trimmed.replace(/[\s\-()]/g, '')}`}
        className={className}
        style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'underline' }}
      >
        {trimmed}
      </a>
    );
  }

  return <span className={className}>{trimmed}</span>;
};

// Renders "{name} ({registrationNo}) · {address} · {email} · {phone}"
// If registrationNo is empty, omits ({registrationNo}).
export const BusinessDetailsLine: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { name, registrationNo, address, email, phone } = config.business;
  const regTrimmed = registrationNo ? registrationNo.trim() : '';

  return (
    <div style={{ fontSize: '12px', color: '#8896ab', lineHeight: 1.6, ...style }}>
      <PolicyValue value={name} />
      {regTrimmed && (
        <>
          {' ('}
          <PolicyValue value={regTrimmed} />
          {')'}
        </>
      )}
      {' · '}
      <PolicyValue value={address} />
      {' · '}
      <PolicyValue value={email} isEmail />
      {' · '}
      <PolicyValue value={phone} isPhone />
    </div>
  );
};
