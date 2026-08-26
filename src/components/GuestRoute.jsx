import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GuestRoute = ({ children }) => {
  const { user, authenticated, loading } = useContext(AuthContext);

  if (loading) return null;

  if (authenticated) {
    return (
      <Navigate to={user?.role === 'TPO_ADMIN' ? '/tpo/dashboard' : '/dashboard'} replace />
    );
  }

  return children;
};

export default GuestRoute;
