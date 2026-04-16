import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { AcuerdosProvider } from './context/AcuerdosContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <AcuerdosProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AcuerdosProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
