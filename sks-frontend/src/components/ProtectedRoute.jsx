import { Navigate, useLocation } from 'react-router-dom';
import {
  expireSession,
  getToken,
  isAuthenticated,
  isTokenExpired,
} from '../utils/auth.js';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const hasToken = Boolean(getToken());
  const tokenExpired = hasToken && isTokenExpired();

  if (tokenExpired) {
    expireSession({
      redirectPath: `${location.pathname}${location.search}`,
    });
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
