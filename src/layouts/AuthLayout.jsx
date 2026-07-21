import { motion } from 'framer-motion';
import CyfenixLogo from "../assets/images/Cyfenix-Logo.png";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-brand col-lg-5 d-none d-lg-flex">
        <div className="inner">
          <div className="d-flex align-items-center justify-content-start">
            {/* <div className="brand-logo">SP</div>
            <strong style={{ fontSize: 18 }}>Student Portal</strong> */}
            <img src={CyfenixLogo} alt="Cyfenix Logo" style={{ width: 150 }} />
          </div>
          <div className="login-page-text">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {title || 'Welcome to the academic tech community.'}
            </motion.h1>
            <p className="mt-3">{subtitle || 'Manage your registration, projects, courses, and job opportunities — all in one premium dashboard.'}</p>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            © 2026 Tech Student Portal · All rights reserved
          </div>
        </div>
      </div>
      <div className="auth-form-col col-lg-7">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card auth-card"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
