import React from 'react';
import { IncomingMessage } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Smartphone, MessageCircle, GitFork } from 'lucide-react';

interface DashboardProps {
  messages: IncomingMessage[];
  chartData: any[];
  ruleCount: number;
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ messages, chartData, ruleCount, onNavigate }) => {
  const todayMessages = messages.length; // Mock count
  const processedCount = messages.filter(m => m.processed).length;
  const successRate = todayMessages > 0 ? Math.round((processedCount / todayMessages) * 100) : 100;

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, trend }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <div className="mt- flex items-center text-sm">
        <span className={`flex items-center gap-1 font-small ${'text-gray-450 dark:text-gray-250'}`}>
          {subValue}
        </span>
      </div>
    </div>
  );

  // Helper to safely render date which might be ISO string or pre-formatted Persian string
  const renderLastConnection = (dateStr?: string) => {
    if (!dateStr) return 'نامشخص';
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('fa-IR');
    }
    return dateStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">داشبورد وضعیت</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="پیام‌های دریافتی" 
          value={todayMessages} 
          icon={MessageCircle}
          subValue="پیام دریافت شده بر روی سیم کارت" 
          colorClass="bg-indigo-500" 
        />
        <StatCard 
          title="سیم‌کارت‌های فعال" 
          value="۱۲" 
          icon={Smartphone} 
          subValue="" 
          colorClass="bg-emerald-500" 
        />
        <StatCard 
          title="نرخ پردازش موفق" 
          value={`${successRate}%`} 
          icon={Activity} 
          subValue="پیام‌های پردازش شده بدون خطا" 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title="قوانین فعال" 
          value={ruleCount} 
          icon={GitFork} 
          subValue="قوانین فعال در پروژه" 
          colorClass="bg-purple-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">ترافیک پیامک (۲۴ ساعت گذشته)</h3>
          <div className="h-80 w-full" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="sms" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">آخرین پیام‌ها</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              {messages.slice(0, 5).map(msg => (
                <div key={msg.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${msg.processed ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white" >{msg.body}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-mono" >{msg.from_number}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('messages')}
            className="mt-4 w-full py-2 text-sm text-primary-600 dark:text-primary-400 font-medium border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
           دیدن همه پیام‌ها
          </button>
        </div>
      </div>
    </div>
  );
};