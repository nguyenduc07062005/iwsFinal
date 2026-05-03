import { Navigate } from 'react-router-dom';
import { getRoleFromToken } from '../utils/auth.js';

/**
 * Route guard that only allows users with the 'admin' role to access
 * the wrapped route. Non-admin users are redirected to the workspace.
 */
const AdminRoute = ({ children }) => {
    const role = getRoleFromToken();

    if (role !== 'admin') {
        return <Navigate to="/app" replace />;
    }

    return children;
};

export default AdminRoute;
