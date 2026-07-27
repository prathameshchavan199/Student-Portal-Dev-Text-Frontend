
import {useContext } from "react";
import {AuthContext } from "../context/AuthContext";
import CyfenixLogo from "../assets/images/Cyfenix-Logo.png";
import{API_BASE_URL} from '../api/axiosSetup.js';

import {useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { DarkInput, PasswordField, GradientButton, FiMail } from '../components/UI.jsx';
import { useState } from 'react';
import axios from 'axios';



export default function Login() {
  const { user, setUser, authenticated, setAuthenticated, setRegistered } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();


const onSubmit = async (data) => {
  try {
    setLoading(true);
    setLoginError('');

    const response = await axios.post(
      `${API_BASE_URL}/api/users/login`,
      data,
      { withCredentials: true }
    );

    localStorage.setItem("name", response.data.name);
    localStorage.setItem("email", response.data.email);
    localStorage.setItem("user", JSON.stringify(response.data));
    if (response.data.idToken) localStorage.setItem("idToken", response.data.idToken);
    if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);

    setUser(response.data);
    setAuthenticated(true);
    setRegistered(response.data.registered);

    navigate(response.data.registered ? '/dashboard' : '/register');

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
          register={register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
        />
        <PasswordField
          label="Password"
          placeholder="••••••••"
          rightLink={<Link to="/forgot-password" className="small">Forgot Password?</Link>}
          error={errors.password?.message}
          register={register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
        />
        {loginError && (
          <div className="text-danger small mt-1 mb-2">{loginError}</div>
        )}
        <GradientButton type="submit" style={{ width: '100%', marginTop: 10}} disabled={loading}>
          {loading ? 'Logging in…' : 'Login →'}
        </GradientButton>
      </form>

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
