import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { AcuerdosProvider } from './context/AcuerdosContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <AcuerdosProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AcuerdosProvider>
    </AuthProvider>
  );
}
