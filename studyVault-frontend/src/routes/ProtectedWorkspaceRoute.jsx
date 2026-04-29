import { Outlet } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { DocumentsProvider } from '../components/DocumentsContext.jsx';
import { DocViewerProvider } from '../context/DocViewerContext.jsx';

const ProtectedWorkspaceRoute = () => {
  return (
    <ProtectedRoute>
      <DocumentsProvider>
        <DocViewerProvider>
          <Outlet />
        </DocViewerProvider>
      </DocumentsProvider>
    </ProtectedRoute>
  );
};

export default ProtectedWorkspaceRoute;
