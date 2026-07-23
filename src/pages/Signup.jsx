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
  FiUser,
} from '../components/UI.jsx';

import { FaGoogle } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';


export default function Signup() {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(52);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const pwd = watch('password');


  // FORM SUBMIT


  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { name, email, password } = data;

      const payload = {
        name,
        email,
        password,
      };

      console.log('Submitting signup data:', payload);
      const response = await axios.post(
        'http://13.201.129.245:8081/api/users/signup',
        payload,
        {
          withCredentials: true
        }
      );




      console.log('User signed up successfully:', response.data);

      setSignupEmail(email);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpVerified(false);
      setResendSeconds(52);
      setShowOtpModal(true);
      

    } catch (error) {
      console.error('Error signing up:', error);
      console.error('Error response data:', error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred during sign up.';

      // alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showOtpModal || resendSeconds <= 0) return undefined;

    const timer = setInterval(() => {
      setResendSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpModal, resendSeconds]);

  useEffect(() => {
    if (showOtpModal) {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [showOtpModal]);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setOtpError('');

    if (digit && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedOtp = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otp.length)
      .split('');

    if (!pastedOtp.length) return;

    const nextOtp = otp.map((_, index) => pastedOtp[index] || '');
    setOtp(nextOtp);
    setOtpError('');
    otpRefs.current[Math.min(pastedOtp.length, otp.length) - 1]?.focus();
  };
const handleVerifyOtp = async (event) => {
  event.preventDefault();

  const enteredOtp = otp.join('');
  setOtpError('');

  try {
    const response = await axios.post(
      'http://13.201.129.245:8081/api/users/verify-otp',
      {
        email: signupEmail,
        otp: enteredOtp,
      },
      {
        withCredentials: true,
      }
      
    );

    console.log('OTP verification response:', response.data);
    

    if (!response.data.success) {
      setOtpVerified(false);
      setOtpError(response.data.message || 'OTP verification failed. Please check the code and try again.');
      return;
    }

    setOtpVerified(true);
    window.setTimeout(() => navigate('/login'), 700);
    
    localStorage.setItem('registered', 'false');
    // console.log(localStorage.getItem('registered'));

  } catch (error) {
    console.error('OTP verification error:', error);

    setOtpVerified(false);
    setOtpError(
      error.response?.data?.message ||
      'Failed to verify OTP. Please try again.'
    );
  }
};
  // const handleVerifyOtp = async (event) => {
  //   event.preventDefault();
  //   try {
  //     const enteredOtp = otp.join('');
  //    try{
  //     const response = await axios.post(
  //       'http://13.201.129.245:8081/api/users/verify-otp',
  //       { email: signupEmail, otp: enteredOtp },
  //       { withCredentials: true }
  //     );
  //     console.log('OTP verification response:', response.data);
  //     if(response.data.success===false){
  //       alert('OTP verification failed: ' + response.data.message);
  //       return;
  //     }else if(response.data.success===true){
  //       alert('OTP verified successfully! You can now log in.');
  //       navigate('/login');
  //     }
      
  //     }catch (error) {console.error('OTP verification error:', error);}

  //      console.log('Verifying OTP sent: ', enteredOtp);

  //   } catch (error) {
      
  //     console.log('Error verifying OTP:', error);

      
  //     return;
  //   }
    
  // };

  const handleChangeEmail = () => {
    setShowOtpModal(false);
    setOtpError('');
    setOtpVerified(false);
  };

  const handleResendCode = () => {
    if (resendSeconds > 0) return;
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpVerified(false);
    setResendSeconds(52);
    otpRefs.current[0]?.focus();
  };
  return (
    <AuthLayout
      title="Join the academic tech community."
      subtitle="Create your account to start your registration."
    >
      <div className="grad-header text-center mb-4">
        Student Portal
      </div>

      <h2 className="auth-title text-center">
        Create Account
      </h2>

      <p className="auth-sub text-center">
        Join the academic tech community today.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DarkInput
          icon={FiUser}
          label="Full Name"
          placeholder="John Doe"
          error={errors.name?.message}
          register={register('name', {
            required: 'Full name is required',
          })}
        />

        <DarkInput
          icon={FiMail}
          label="Email Address"
          placeholder="student@university.edu"
          error={errors.email?.message}
          register={register('email', {
            required: 'Email is required',

            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Invalid email address',
            },
          })}
        />

        <PasswordField
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          register={register('password', {
            required: 'Password is required',

            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
        />

        <PasswordField
          label="Confirm Password"
          placeholder="••••••••"
          error={errors.confirm?.message}
          register={register('confirm', {
            required: 'Please confirm password',

            validate: (value) =>
              value === pwd || 'Passwords do not match',
          })}
        />

        <GradientButton type="submit" disabled={loading} style={{ width: '100%', marginTop: 10 }}>
          Sign Up →
        </GradientButton>
      </form>

      <div className="divider-or">
        OR REGISTER WITH
      </div>

      <div className="d-flex gap-2">
        <button
          type="button"
          className="social-btn d-flex align-items-center justify-content-center gap-2"
        >
          <FaGoogle />
          Google
        </button>
      </div>

      <p
        className="text-center text-muted-2 mt-3 mb-0"
        style={{ fontSize: 14 }}
      >
        Already have an account?{' '}
        <Link to="/login">Login</Link>
      </p>

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
              Enter the 6-digit code sent to
              <strong>{signupEmail}</strong>
            </p>

            <div className="otp-input-row">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
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
