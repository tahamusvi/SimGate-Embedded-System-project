import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Messages } from './pages/Messages';
import { Rules } from './pages/Rules';
import { Login } from './pages/Login';
import { DeliveryHistory } from './pages/DeliveryHistory';
import { RULES, CHANNELS, RULE_DESTINATIONS, STATS_DATA, DELIVERY_ATTEMPTS } from './constants';
import { IncomingMessage, DeliveryAttempt } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // API State
  const [apiMessages, setApiMessages] = useState<IncomingMessage[]>([]);
  const [apiDeliveryAttempts, setApiDeliveryAttempts] = useState<DeliveryAttempt[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);

  // Check for existing token on load
  useEffect(() => {
    const storedAccess = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('username');
    if (storedAccess) {
      setAccessToken(storedAccess);
      if (storedUser) setUsername(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Login
  const handleLogin = (access: string, refresh: string, user: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('username', user);
    setAccessToken(access);
    setUsername(user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setAccessToken(null);
    setUsername('');
    setIsAuthenticated(false);
    setApiMessages([]);
    setApiDeliveryAttempts([]);
    setTrafficData([]);
  };

  // Fetch Data Function
  const fetchData = useCallback(async (isBackground = false) => {
    if (!accessToken) return;

    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setIsDataLoading(true);
    }

    try {
      const headers = {
        'Authorization': `JWT ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // 1. Fetch Messages
      const msgResponse = await fetch('https://apitest.fpna.ir/monitor/messages/', { headers });
      if (msgResponse.ok) {
        const data = await msgResponse.json();
        const mappedMessages: IncomingMessage[] = data.map((item: any) => ({
          id: item.id,
          from_number: item.from_number,
          to_number: item.to_number,
          body: item.body,
          received_at: item.received_at,
          raw_payload: {},
          processed: item.processed
        }));
        setApiMessages(mappedMessages);
      } else if (msgResponse.status === 401) {
          handleLogout(); // Token expired
          return;
      }


      // 2. Fetch SMS Traffic
      const trafficResponse = await fetch('https://apitest.fpna.ir/monitor/dashboard/sms-traffic/', { headers });
      if (trafficResponse.ok) {
        const data = await trafficResponse.json();
        const mappedTraffic = data.map((item: any) => {
          const date = new Date(item.time);
          return {
            name: date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            sms: item.sms_count
          };
        });
        setTrafficData(mappedTraffic);
      }

      // 3. Fetch Delivery History
      const deliveryResponse = await fetch('https://apitest.fpna.ir/monitor/deliveries/', { headers });
      if (deliveryResponse.ok) {
        const data = await deliveryResponse.json();
        const mappedDeliveries: DeliveryAttempt[] = data.map((item: any) => ({
          id: item.id,
          message_id: item.message_id || '',
          rule_id: item.rule_id || '',
          channel_id: item.channel_id || '',
          status: item.status,
          provider_message_id: item.provider_message_id || '',
          error: item.error || '',
          last_attempt_at: item.last_attempt_at,
          retry_count: item.retry_count || 0,
          channel_name: item.channel_name,
          rule_name: item.rule_name,
          message_content: item.message_content
        }));
        setApiDeliveryAttempts(mappedDeliveries);
      }

    } catch (error) {
      console.error("Failed to fetch data from API", error);
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken]);

  // Initial Fetch
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchData(false);
    }
  }, [isAuthenticated, accessToken, fetchData]);

  // Derived Data
  const displayMessages = apiMessages; 
  const displayDeliveries = apiDeliveryAttempts.length > 0 ? apiDeliveryAttempts : DELIVERY_ATTEMPTS;
  const projectRules = RULES;
  const projectChannels = CHANNELS;
  // Filter RuleDestinations valid for current project's rules
  const ruleIds = new Set(projectRules.map(r => r.id));
  const projectRuleDestinations = RULE_DESTINATIONS.filter(rd => ruleIds.has(rd.rule_id));

  const activeRulesCount = projectRules.filter(r => r.is_enabled).length;

  // Render Page Logic
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            messages={displayMessages} 
            chartData={trafficData.length > 0 ? trafficData : STATS_DATA}
            ruleCount={activeRulesCount}
            onNavigate={setCurrentPage}
          />
        );
      case 'messages':
        return (
          <Messages 
            messages={displayMessages} 
            rules={projectRules}
            channels={projectChannels}
            deliveryAttempts={displayDeliveries}
            onRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
          />
        );
      case 'delivery-history':
        return (
          <DeliveryHistory 
            attempts={displayDeliveries}
            messages={displayMessages}
            rules={projectRules}
            channels={projectChannels}
            onRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
          />
        );
      case 'rules':
        return (
          <Rules 
            rules={projectRules} 
            channels={projectChannels} 
            ruleDestinations={projectRuleDestinations}
          />
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (isDataLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
        <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
        <p className="text-lg font-medium animate-pulse">در حال دریافت اطلاعات...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={handleLogout}
        username={username}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ms-64 transition-all duration-300">
        <Header 
          onMenuToggle={() => setSidebarOpen(true)}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;