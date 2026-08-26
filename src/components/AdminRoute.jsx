import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/*
 * Gates TPO admin panel routes. The backend independently enforces this via
 * hasRole("TPO_ADMIN") on every /api/tpo/** call — this is just so a student
 * account doesn't even see the admin UI shell before hitting a 403.
 */
const AdminRoute = ({ children }) => {
  const { user, loading, authenticated } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'TPO_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
