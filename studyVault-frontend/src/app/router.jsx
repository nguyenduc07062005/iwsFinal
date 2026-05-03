/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
import RouteErrorScreen from '../components/system/RouteErrorScreen.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import CompleteRegistration from '../pages/CompleteRegistration.jsx';
import Profile from '../pages/Profile.jsx';
import Landing from '../pages/Landing.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import AppShell from '../layouts/AppShell.jsx';
import DetailLayout from '../layouts/DetailLayout.jsx';
import GuestOnlyRoute from '../routes/GuestOnlyRoute.jsx';
import ProtectedWorkspaceRoute from '../routes/ProtectedWorkspaceRoute.jsx';
import AdminRoute from '../routes/AdminRoute.jsx';
import { isAuthenticated } from '../utils/auth.js';

const WorkspacePage = lazy(() => import('../pages/WorkspacePage.jsx'));
const Favorites = lazy(() => import('../pages/Favorites.jsx'));
const DocumentViewer = lazy(() => import('../pages/DocumentViewer.jsx'));
const Admin = lazy(() => import('../pages/Admin.jsx'));

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
    <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-7 text-center shadow-[0_28px_72px_-42px_rgba(61,43,43,0.55)] backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#a15a40]">
        Loading
      </p>
      <p className="mt-3 text-sm font-medium text-[#6c5f59]">
        Preparing the next screen.
      </p>
    </div>
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={<RouteFallback />}>
    {element}
  </Suspense>
);

const HomeRedirect = () => (
  <Navigate to={isAuthenticated() ? '/app' : '/login'} replace />
);

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RouteErrorScreen />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        element: <GuestOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: <Login /> },
              { path: 'register', element: <Register /> },
              { path: 'verify-email', element: <CompleteRegistration /> },
              { path: 'complete-registration', element: <CompleteRegistration /> },
              { path: 'forgot-password', element: <ForgotPassword /> },
              { path: 'reset-password', element: <ResetPassword /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedWorkspaceRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                path: 'app',
                element: withSuspense(<WorkspacePage />),
              },
              {
                path: 'app/favorites',
                element: withSuspense(<Favorites />),
              },
              {
                path: 'profile',
                element: <Profile />,
              },
              {
                path: 'admin',
                element: withSuspense(
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>,
                ),
              },
            ],
          },
          {
            element: <DetailLayout />,
            children: [
              {
                path: 'app/documents/:id',
                element: withSuspense(<DocumentViewer />),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <HomeRedirect />,
      },
    ],
  },
]);

export default router;
