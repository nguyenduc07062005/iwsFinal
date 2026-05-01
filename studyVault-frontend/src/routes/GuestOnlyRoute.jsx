import { Navigate, Outlet } from 'react-router-dom';
import { hasValidAccessToken } from '../utils/auth.js';

const GuestOnlyRoute = () => {
  if (hasValidAccessToken()) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;
