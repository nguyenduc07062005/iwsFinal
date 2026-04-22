import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js';

const GuestOnlyRoute = () => {
  if (isAuthenticated()) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

export default GuestOnlyRoute;
