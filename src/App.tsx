import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { Toaster } from './components/ui/toaster';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {isAuthenticated ? <DashboardPage /> : <LoginPage />}
      <Toaster />
    </>
  );
}

export default App;
