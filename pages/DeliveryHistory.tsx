import React, { useState,useEffect } from 'react';
import { DeliveryAttempt, IncomingMessage, ForwardRule, DestinationChannel, DeliveryStatus, ChannelType } from '../types';
import { Search, Filter, ChevronDown, RefreshCw, CheckCircle2, AlertTriangle, Clock, Send, Globe, Mail, MessageSquare, X, History } from 'lucide-react';

interface DeliveryHistoryProps {
  attempts: DeliveryAttempt[];
  messages: IncomingMessage[];
  rules: ForwardRule[];
  channels: DestinationChannel[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({ 
  attempts, 
  messages, 
  rules, 
  channels,
  onRefresh,
  isRefreshing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [localChannels, setLocalChannels] = useState<DestinationChannel[]>(channels);


  // Helpers to resolve names (Prioritize direct string from API)
  const getRuleName = (attempt: DeliveryAttempt) => {
    if (attempt.rule_name) return attempt.rule_name;
    return rules.find(r => r.id === attempt.rule_id)?.name || 'نامشخص';
  };

  const getChannelName = (attempt: DeliveryAttempt) => {
    if (attempt.channel_name) return attempt.channel_name;
    return channels.find(c => c.id === attempt.channel_id)?.name || 'نامشخص';
  };

  const getMessageContent = (attempt: DeliveryAttempt) => {
    if (attempt.message_content) return attempt.message_content;
    return messages.find(m => m.id === attempt.message_id)?.body || 'پیام یافت نشد';
  };

  const getChannelType = (attempt: DeliveryAttempt) => {
    // If we have channel_id, we can guess type, otherwise generic
    const channel = channels.find(c => c.id === attempt.channel_id);
    return channel?.type;
  };

  const getChannelIcon = (type?: ChannelType, name?: string) => {
    // Simple heuristic if we don't have type but have name
    if (!type && name) {
        if (name.includes('تلگرام')) return <Send className="h-4 w-4 text-blue-500" />;
        if (name.includes('بله')) return <MessageSquare className="h-4 w-4 text-green-500" />;
    }

    switch(type) {
      case ChannelType.TELEGRAM: return <Send className="h-4 w-4 text-blue-500" />;
      case ChannelType.EMAIL: return <Mail className="h-4 w-4 text-amber-500" />;
      case ChannelType.WEBHOOK: return <Globe className="h-4 w-4 text-purple-500" />;
      case ChannelType.SMS: return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <Globe className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChannelAndRuleText = (attempt: DeliveryAttempt) => {
    const channelName = getChannelName(attempt);
    const ruleName = getRuleName(attempt);

    return `${channelName} قانون: ${ruleName}`.toLowerCase();
  };

  // Filtering
  const filteredAttempts = attempts.filter(attempt => {
    const msgBody = getMessageContent(attempt);
    const chName = getChannelName(attempt);
    const ruleName = getRuleName(attempt);
    
    const searchString = `${msgBody} ${chName} ${ruleName}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : attempt.status === statusFilter;
    // For channel filter, we check if either the ID matches OR the name contains the filter (if filter is not an ID)
    // But here we rely on dropdown which has IDs. If API doesn't return IDs, this filter might be tricky.
    // We'll assume local channels are still relevant or we filter by name if id is missing.
    const matchesChannel = channelFilter === 'all' ? true
    : getChannelAndRuleText(attempt).includes(
        localChannels.find(c => c.id === channelFilter)?.name.toLowerCase() ?? ''
      );

    return matchesSearch && matchesStatus && matchesChannel;
  });

  // Sort by date desc
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    const dateA = new Date(a.last_attempt_at || 0).getTime();
    const dateB = new Date(b.last_attempt_at || 0).getTime();
    return dateB - dateA;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setChannelFilter('all');
  };

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(
          'https://apitest.fpna.ir/monitor/get-destination-Channel-list/',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error('Fetch channels error:', data);
          return;
        }

        setLocalChannels(data);

      } catch (err) {
        console.error('Network error while fetching channels:', err);
      }
    };

    fetchChannels();
  }, []);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || channelFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">تاریخچه ارسال‌ها</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">گزارش وضعیت ارسال پیام‌ها به کانال‌های مقصد</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          <span className="text-sm font-medium">بروزرسانی</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="lg:flex-1 relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Search className="h-5 w-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="جستجو در پیام، کانال یا فرستنده..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm placeholder-gray-400"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48 relative">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full pr-4 pl-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="sent">ارسال موفق</option>
                    <option value="failed">ناموفق</option>
                    <option value="pending">در انتظار</option>
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>

            {/* Channel Filter */}
            <div className="w-full lg:w-56 relative">
                 <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="w-full pr-4 pl-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer"
                >
                    <option value="all">همه کانال‌ها</option>
                    {localChannels.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>

            {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center justify-center px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32">وضعیت</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-40">زمان تلاش</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">کانال و قانون</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">جزئیات / خطا</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">متن پیام</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {sortedAttempts.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-slate-400">
                      <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-full mb-3">
                          <History className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="font-medium">هیچ گزارش ارسالی یافت نشد.</p>
                    </div>
                  </td>
                </tr>
              )}
              {sortedAttempts.map((attempt) => {
                const chName = getChannelName(attempt);
                const ruleName = getRuleName(attempt);
                const msgBody = getMessageContent(attempt);
                const chType = getChannelType(attempt);
                
                return (
                <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {attempt.status === DeliveryStatus.SENT && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 me-1.5" /> موفق
                      </span>
                    )}
                    {attempt.status === DeliveryStatus.FAILED && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                        <AlertTriangle className="h-3.5 w-3.5 me-1.5" /> ناموفق
                      </span>
                    )}
                    {attempt.status === DeliveryStatus.PENDING && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                        <Clock className="h-3.5 w-3.5 me-1.5" /> در حال ارسال
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 text-right" dir="ltr">
                    {attempt.last_attempt_at ? (
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-700 dark:text-slate-300">{new Date(attempt.last_attempt_at).toLocaleTimeString('fa-IR')}</span>
                            <span className="text-xs opacity-75">{new Date(attempt.last_attempt_at).toLocaleDateString('fa-IR')}</span>
                        </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-200">
                            {getChannelIcon(chType, chName)}
                            <span>{chName}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            قانون: {ruleName}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                     {attempt.status === DeliveryStatus.FAILED ? (
                         <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800 text-xs font-mono break-all" dir="ltr">
                            {attempt.error || 'خطای نامشخص'}
                         </div>
                     ) : (
                         <div className="flex flex-col gap-1">
                             {attempt.provider_message_id && (
                                 <span className="text-xs font-mono text-gray-500 dark:text-slate-500" dir="ltr">Ref: {attempt.provider_message_id}</span>
                             )}
                             <span className="text-xs text-green-600 dark:text-green-400">تحویل داده شد</span>
                         </div>
                     )}
                  </td>
                   <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-slate-300 max-w-xs truncate" dir="auto">
                     {msgBody}
                   </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};