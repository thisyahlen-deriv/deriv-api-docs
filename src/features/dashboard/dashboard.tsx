import React, { useEffect } from 'react';
import useAuthContext from '@site/src/hooks/useAuthContext';
import useAppManager from '@site/src/hooks/useAppManager';
import ManageDashboard from './manage-dashboard';
import { Login } from '../Login/Login';
import BrowserOnly from '@docusaurus/BrowserOnly';

const Dashboard = () => {
  const { is_logged_in } = useAuthContext();
  const { setIsDashboard } = useAppManager();

  useEffect(() => {
    setIsDashboard(true);
    return () => {
      setIsDashboard(false);
    };
  }, [setIsDashboard]);

  if (is_logged_in) return <ManageDashboard />;
  return <BrowserOnly>{() => <Login />}</BrowserOnly>;
};

export default Dashboard;
