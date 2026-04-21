import { useState } from 'react';
import type { AuthPage } from './types/auth';
import { getSession } from './utils/storage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';

function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => getSession() !== null,
  );
  const [authPage, setAuthPage] = useState<AuthPage>('signup');

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center">
        <p className="text-grey-900 text-lg font-medium">
          ✅ Logged in — dashboard coming soon.
        </p>
      </div>
    );
  }

  if (authPage === 'login') {
    return (
      <LoginPage
        onAuthSuccess={() => setIsAuthenticated(true)}
        onNavigateToSignup={() => setAuthPage('signup')}
      />
    );
  }

  return (
    <SignupPage
      onAuthSuccess={() => setIsAuthenticated(true)}
      onNavigateToLogin={() => setAuthPage('login')}
    />
  );
}

export default App;
