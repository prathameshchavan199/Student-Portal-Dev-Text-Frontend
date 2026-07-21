import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import axios from 'axios';
import {
  DarkInput,
  PasswordField,
  GradientButton,
  FiMail,
} from '../components/UI.jsx';
import { FiCheckCircle } from 'react-icons/fi';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(52);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const otpRefs = useRef([]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm();

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors },
  } = useForm();

  const navigate = useNavigate();
  const newPwd = watch('newPassword');

  useEffect(() => {
    if (!showOtpModal || resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpModal, resendSeconds]);

  useEffect(() => {
    if (showOtpModal) {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [showOtpModal]);

  // Step 1 — send OTP to registered email
  const onEmailSubmit = async (data) => {
    try {
      setLoading(true);
      setServerError('');
      await axios.post(
        'http://3.111.47.41:8081/api/users/forgot-password',
        { email: data.email },
        { withCredentials: true },
      );
      setEmail(data.email);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpVerified(false);
      setResendSeconds(52);
      setShowOtpModal(true);
    } catch (error) {
      setServerError(
        error.response?.data?.message || 'Could not send reset code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // const resetOpt = async (data) =>{
  //   const res=       await axios.post(
  //       'http://3.111.47.41:8081/api/users/reset-password',
  //       { email: data.email },
  //       { withCredentials: true },
  //     );

  // }

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError('');
    if (digit && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otp.length)
      .split('');
    if (!pasted.length) return;
    const next = otp.map((_, i) => pasted[i] || '');
    setOtp(next);
    setOtpError('');
    otpRefs.current[Math.min(pasted.length, otp.length) - 1]?.focus();
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    const enteredOtp = otp.join('');
    setOtpError('');
    try {
      const response = await axios.post(
        'http://3.111.47.41:8081/api/users/verify-otp',
        { email, otp: enteredOtp },
        { withCredentials: true },
      );
      if (!response.data.success) {
        setOtpError(response.data.message || 'Invalid OTP. Please try again.');
        return;
      }
      setVerifiedOtp(enteredOtp);
      setOtpVerified(true);
      window.setTimeout(() => {
        setShowOtpModal(false);
        setStep('reset');
      }, 700);
    } catch (error) {
      setOtpError(
        error.response?.data?.message || 'Failed to verify OTP. Please try again.',
      );
    }
  };

  const handleChangeEmail = () => {
    setShowOtpModal(false);
    setOtpError('');
    setOtpVerified(false);
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0) return;
    try {
      await axios.post(
        'http://3.111.47.41:8081/api/users/forgot-password',
        { email },
        { withCredentials: true },
      );
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpVerified(false);
      setResendSeconds(52);
      otpRefs.current[0]?.focus();
    } catch {
      setOtpError('Could not resend code. Please try again.');
    }
  };

  // Step 3 — set new password
  const onResetSubmit = async (data) => {
    try {
      setResetLoading(true);
      setServerError('');
      await axios.post(
        'http://3.111.47.41:8081/api/users/reset-password',
        { email, otp: verifiedOtp, newPassword: data.newPassword },
        { withCredentials: true },
      );
      navigate('/login');
    } catch (error) {
      setServerError(
        error.response?.data?.message || 'Failed to reset password. Please try again.',
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password securely."
      subtitle="We'll verify your identity before letting you set a new password."
    >
      <div className="grad-header text-center mb-4">Student Portal</div>

      {step === 'email' && (
        <>
          <h2 className="auth-title text-center">Forgot Password</h2>
          <p className="auth-sub text-center">
            Enter your registered email to receive a verification code.
          </p>

          <form onSubmit={handleEmailSubmit(onEmailSubmit)}>
            <DarkInput
              icon={FiMail}
              label="Registered Email Address"
              placeholder="student@university.edu"
              error={emailErrors.email?.message}
              register={registerEmail('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Invalid email address',
                },
              })}
            />

            {serverError && (
              <div className="text-danger small mt-1 mb-2">{serverError}</div>
            )}

            <GradientButton type="submit" disabled={loading} style={{ width: '100%', marginTop: 10 }}>
              {loading ? 'Sending Code…' : 'Send Verification Code →'}
            </GradientButton>
          </form>

          <p className="text-center text-muted-2 mt-3 mb-0" style={{ fontSize: 14 }}>
            Remember your password?{' '}
            <Link to="/login">Login</Link>
          </p>
        </>
      )}

      {step === 'reset' && (
        <>
          <h2 className="auth-title text-center">Set New Password</h2>
          <p className="auth-sub text-center">
            Identity verified. Create a strong new password for your account.
          </p>

          <form onSubmit={handleResetSubmit(onResetSubmit)}>
            <PasswordField
              label="New Password"
              placeholder="••••••••"
              error={resetErrors.newPassword?.message}
              register={registerReset('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />

            <PasswordField
              label="Confirm New Password"
              placeholder="••••••••"
              error={resetErrors.confirmPassword?.message}
              register={registerReset('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPwd || 'Passwords do not match',
              })}
            />

            {serverError && (
              <div className="text-danger small mt-1 mb-2">{serverError}</div>
            )}

            <GradientButton
              type="submit"
              disabled={resetLoading}
              style={{ width: '100%', marginTop: 10 }}
            >
              {resetLoading ? 'Saving…' : 'Save New Password →'}
            </GradientButton>
          </form>
        </>
      )}

      {showOtpModal && (
        <div className="otp-modal-backdrop" role="presentation">
          <form
            className="otp-modal"
            onSubmit={handleVerifyOtp}
            aria-label="Verify email OTP"
          >
            <div className={`otp-icon ${otpVerified ? 'verified' : ''}`}>
              {otpVerified ? <FiCheckCircle /> : <FiMail />}
            </div>

            <h3>Verify Email</h3>
            <p>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <div className="otp-input-row">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <div className="otp-resend">
              <span>Didn't receive the code?</span>
              <button type="button" onClick={handleResendCode}>
                Resend Code
                {resendSeconds > 0 && ` (0:${String(resendSeconds).padStart(2, '0')})`}
              </button>
            </div>

            {otpError && <div className="otp-error">{otpError}</div>}

            <GradientButton type="submit" className="otp-submit">
              Verify &amp; Proceed
            </GradientButton>

            <button
              type="button"
              className="otp-change-email"
              onClick={handleChangeEmail}
            >
              Change Email
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
