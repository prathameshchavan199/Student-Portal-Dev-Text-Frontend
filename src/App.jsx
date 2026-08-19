import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Dashboardcopy from './pages/Dashboardcopy.jsx';

import Course from './pages/Course.jsx';
import CourseProgress from './pages/CourseProgress.jsx';
import CourseDetails from './pages/CourseDetails.jsx';
import CoursePayment from './pages/CoursePayment.jsx';
import CourseSuccess from './pages/CourseSuccess.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Assessment from './pages/Assessment.jsx';
import Tasks from './pages/Tasks.jsx';
import McqTest from './pages/McqTest.jsx';
import SpeakingTest from './pages/SpeakingTest.jsx';
import WritingTest from './pages/WritingTest.jsx';
import Profile from './pages/Profile.jsx';
import DocViewer from './pages/DocViewer.jsx';
import AddCourse from './pages/AddCourse.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import AuthCallback from './pages/AuthCallback.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/auth/callback" element={<GuestRoute><AuthCallback /></GuestRoute>} />
      {/*
        Always render Register here — for a first-time student it's the
        registration form, for an already-registered student (registered
        === true) it doubles as the "edit registration" form, prefilled
        with their submitted data. See Register.jsx's data-loading effect.
      */}
      <Route path="/register" element={
        <ProtectedRoute>
          <Register />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboardcopy/></ProtectedRoute>} /> */}
      <Route path="/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
      <Route path="/course-progress" element={<ProtectedRoute><CourseProgress /></ProtectedRoute>} />
      <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
      <Route path="/courses/:courseId/payment" element={<ProtectedRoute><CoursePayment /></ProtectedRoute>} />
      <Route path="/courses/:courseId/success" element={<ProtectedRoute><CourseSuccess /></ProtectedRoute>} />
      <Route path="/courses/:courseId/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
      <Route path="/assessment/:category" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/assessment/communication/test" element={<ProtectedRoute><SpeakingTest /></ProtectedRoute>} />
      <Route path="/assessment/communication/writing-test" element={<ProtectedRoute><WritingTest /></ProtectedRoute>} />
      <Route path="/assessment/:category/test" element={<ProtectedRoute><McqTest /></ProtectedRoute>} />
      <Route path="/courses-progress" element={<ProtectedRoute><CourseProgress /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:docFile" element={<ProtectedRoute><DocViewer /></ProtectedRoute>} />
      {/* <Route path="/admin/add-course" element={<ProtectedRoute><AddCourse /></ProtectedRoute>} /> */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
