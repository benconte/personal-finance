import React from 'react';
import { createBrowserRouter, redirect, Outlet, useNavigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { getSession, clearSession } from './utils/storage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import OverviewPage from './components/OverviewPage';
import TransactionsPage from './components/TransactionsPage';
import BudgetsPage from './components/BudgetsPage';
import PotsPage from './components/PotsPage';
import RecurringBillsPage from './components/RecurringBillsPage';
import { FinanceLogo } from './components/ui';

function ProtectedLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-beige-100 font-sans lg:flex-row">
      <div className="flex h-[70px] w-full shrink-0 items-center justify-center rounded-b-[8px] bg-grey-900 lg:hidden">
        <FinanceLogo />
      </div>
      <main className="flex-1 overflow-y-auto p-4 lg:order-2 lg:p-8 lg:pb-8 pb-4">
        <Outlet />
      </main>
      <Sidebar />
    </div>
  );
}

function OverviewRoute() {
  const navigate = useNavigate();
  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };
  return <OverviewPage onLogout={handleLogout} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <LoginPage 
      onAuthSuccess={() => navigate('/', { replace: true })} 
      onNavigateToSignup={() => navigate('/signup')} 
    />
  );
}

function SignupRoute() {
  const navigate = useNavigate();
  return (
    <SignupPage 
      onAuthSuccess={() => navigate('/', { replace: true })} 
      onNavigateToLogin={() => navigate('/login')} 
    />
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    loader: () => {
      if (!getSession()) return redirect('/login');
      return null;
    },
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <OverviewRoute /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'budgets', element: <BudgetsPage /> },
      { path: 'pots', element: <PotsPage /> },
      { path: 'recurring-bills', element: <RecurringBillsPage /> },
    ],
  },
  {
    path: '/login',
    loader: () => {
      if (getSession()) return redirect('/');
      return null;
    },
    element: <LoginRoute />,
  },
  {
    path: '/signup',
    loader: () => {
      if (getSession()) return redirect('/');
      return null;
    },
    element: <SignupRoute />,
  },
]);

function App(): React.ReactElement {
  return <RouterProvider router={router} />;
}

export default App;
