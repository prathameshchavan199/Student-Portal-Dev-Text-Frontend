import { useContext, useEffect, useState } from "react";
import {AuthContext } from "../context/AuthContext";
import CyfenixLogo from "../assets/images/Cyfenix-Logo.png";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../api/axiosSetup.js';

import {useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { DarkInput, PasswordField, GradientButton, FiMail } from '../components/UI.jsx';
import axios from 'axios';



export default function Login() {
  const { user, setUser, authenticated, setRegistered } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();

  // Clear the login error banner as soon as the user starts editing either
  // field again — it should only reappear after the next failed Sign In.
  const emailValue = watch('email');
  const passwordValue = watch('password');
  useEffect(() => {
    setLoginError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValue, passwordValue]);

  const handleGoogleLogin = () => {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?response_type=code` +
      `&client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=email+openid+profile` +
      `&access_type=offline` +
      `&prompt=select_account`;
  };


const onSubmit = async (data) => {
  try {
    setLoading(true);
    setLoginError('');

    const payload = { ...data, email: data.email.trim().toLowerCase() };

    const response = await axios.post(
      `${API_BASE_URL}/api/users/login`,
      payload,
      { withCredentials: true }
    );
    localStorage.setItem("user", response.data);
    localStorage.setItem("name", response.data.name);
    localStorage.setItem("email", response.data.email);
    localStorage.setItem("user", JSON.stringify(response.data));
    localStorage.setItem("id", JSON.stringify(response.data.id));
    localStorage.setItem("provider", "LOCAL");
    if (response.data.idToken) localStorage.setItem("idToken", response.data.idToken);
    if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);

    setUser(response.data);
    setRegistered(response.data.registered);

    if (response.data.role === 'TPO_ADMIN') {
      navigate('/tpo/dashboard');
    } else {
      navigate(response.data.registered ? '/dashboard' : '/register');
    }

  } catch (error) {
    console.error('Error logging in:', error);

    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (serverMessage) {
      setLoginError(serverMessage);
    } else if (status === 404) {
      setLoginError('This email is not registered. Please sign up first.');
    } else if (status === 401) {
      setLoginError('Wrong credentials. Please check your email and password.');
    } else {
      setLoginError('Unable to log in. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
  return (
    
    <AuthLayout title="Welcome back to your Student Portal." subtitle="Access your courses, projects, and registration in one place.">
      <div className="grad-header text-center mb-4">Student Portal</div>
      <h2 className="auth-title text-center">Welcome Back</h2>
      <p className="auth-sub text-center">Please enter your credentials to access your portal.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DarkInput
          icon={FiMail}
          label="Email Address"
          placeholder="student@university.edu"
          error={errors.email?.message}
          register={register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/, message: 'Invalid email' },
            validate: (value) =>
              !/[A-Z]/.test(value) || /[a-z]/.test(value) ||
              'Email address must be entered in lowercase letters.',
          })}
        />
        <PasswordField
          label="Password"
          placeholder="••••••••"
          rightLink={<Link to="/forgot-password" className="small">Forgot Password?</Link>}
          error={errors.password?.message}
          register={register('password', { required: 'Password is required' })}
        />
        {loginError && (
          <div className="text-danger small mt-1 mb-2">{loginError}</div>
        )}
        <GradientButton type="submit" style={{ width: '100%', marginTop: 10}} disabled={loading}>
          {loading ? 'Logging in…' : 'Login →'}
        </GradientButton>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <button type="button" className="google-signin-btn" onClick={handleGoogleLogin}>
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        Sign in with Google
      </button>

      <p className="text-center text-muted-2 mt-3 mb-0" style={{ fontSize: 14 }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>

      <div className="footer-mini">
        © 2026 Tech Student Portal. All rights reserved.
        <div><a href="#">Support</a>·<a href="#">Privacy Policy</a>·<a href="#">Terms</a></div>
      </div>
    </AuthLayout>
  );
}