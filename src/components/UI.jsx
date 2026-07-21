export function GradientButton({ children, className = '', ...props }) {
  return (
    <button className={`btn btn-grad w-100 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GlassCard({ children, className = '', ...props }) {
  return <div className={`glass-card ${className}`} {...props}>{children}</div>;
}

import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useState } from 'react';

export function DarkInput({ icon = null, label, error, register, ...props }) {
  const Icon = icon;
  return (
    <div className="mb-3">
      {label && <div className="label-sm">{label}</div>}
      <div className="input-icon-wrap">
        {Icon && <span className="icon-left"><Icon /></span>}
        <input className="form-control dark-input" {...register} {...props} />
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export function PasswordField({ label = 'Password', error, register, rightLink, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between">
        <div className="label-sm">{label}</div>
        {rightLink}
      </div>
      <div className="input-icon-wrap">
        <span className="icon-left"><FiLock /></span>
        <input
          type={show ? 'text' : 'password'}
          className="form-control dark-input"
          {...register}
          {...props}
        />
        <button type="button" className="icon-right" onClick={() => setShow(s => !s)}>
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export { FiMail, FiLock, FiUser, FiPhone };
