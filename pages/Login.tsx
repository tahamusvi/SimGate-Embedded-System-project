import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (access: string, refresh: string, username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://apitest.fpna.ir/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.access, data.refresh, username);
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
               <LogIn className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پنل مدیریت SIMGATE</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">برای دسترسی به داشبورد وارد شوید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">نام کاربری</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white transition-colors text-left placeholder-gray-400"
                  placeholder="Username"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">رمز عبور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white transition-colors text-left placeholder-gray-400"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                'ورود به سیستم'
              )}
            </button>
          </form>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 text-center border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            SimGate IoT Panel &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
};