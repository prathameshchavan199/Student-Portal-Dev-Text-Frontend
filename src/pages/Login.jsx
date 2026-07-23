
import {useContext } from "react";
import {AuthContext } from "../context/AuthContext";
import CyfenixLogo from "../assets/images/Cyfenix-Logo.png";


import {useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { DarkInput, PasswordField, GradientButton, FiMail } from '../components/UI.jsx';
import { useState } from 'react';
import axios from 'axios';



export default function Login() {
  const { user, setUser, authenticated, setAuthenticated, setRegistered } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

//  const onSubmit = async (data) => {
//    try {
//      const { email, password } = data;
 
//      const payload = {
      
//        email,
//        password,
//      };
 
//      console.log('Submitting login data:', payload);
//      const response = await axios.post(
//        'http://13.201.129.245:8081/api/users/login',
//        payload,{
//             withCredentials: true
//         }
//      );

//      console.log(response.data.name);
// console.log(response.data.email);

//      alert("Login successful! Token stored in localStorage."+response.data.email);
 
//      console.log('User logged in successfully:', response.data);
 
//      // alert('Account created successfully!');
 
//      navigate('/dashboard');
 
//    } catch (error) {
//      console.error('Error logging in:', error);
 
//      const errorMessage =
//        error.response?.data?.message ||
//        error.message ||
//        'An error occurred during login.';
 
//      // alert(errorMessage);
//    }
//  };


const onSubmit = async (data) => {
  try {
    setLoading(true);

    const response = await axios.post(
      'http://13.201.129.245:8081/api/users/login',
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
