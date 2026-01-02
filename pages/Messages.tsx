import React, { useState } from 'react';
import { IncomingMessage, SimEndpoint, ForwardRule, DestinationChannel, DeliveryAttempt, DeliveryStatus, ChannelType } from '../types';
import { CheckCircle2, Clock, FileJson, Search, Smartphone, Filter, X, ChevronDown, ListFilter, Send, Globe, Mail, MessageSquare, AlertTriangle, ArrowLeftRight, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface MessagesProps {
  messages: IncomingMessage[];
  endpoints: SimEndpoint[];
  rules?: ForwardRule[];
  channels?: DestinationChannel[];
  deliveryAttempts?: DeliveryAttempt[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

type SortKey = 'processed' | 'received_at' | 'from_number' | 'endpoint_id' | 'body';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export const Messages: React.FC<MessagesProps> = ({ 
  messages, 
  endpoints, 
  rules = [], 
  channels = [], 
  deliveryAttempts = [],
  onRefresh,
  isRefreshing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all');
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<IncomingMessage | null>(null);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'received_at', direction: 'desc' });

  const getEndpointNameString = (id: string): string => {
    const ep = endpoints.find(e => e.id === id);
    return ep ? ep.name : id;
  };

  const getEndpointName = (id: string) => {
    const ep = endpoints.find(e => e.id === id);
    return ep ? ep.name : <span className="font-mono text-xs">{id.substring(0, 8)}...</span>;
  };

  const getChannelIcon = (type: ChannelType) => {
    switch(type) {
      case ChannelType.TELEGRAM: return <Send className="h-4 w-4 text-blue-500" />;
      case ChannelType.EMAIL: return <Mail className="h-4 w-4 text-amber-500" />;
      case ChannelType.WEBHOOK: return <Globe className="h-4 w-4 text-purple-500" />;
      case ChannelType.SMS: return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = m.body.toLowerCase().includes(searchTerm.toLowerCase()) || m.from_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'processed' ? m.processed : !m.processed;
    const matchesEndpoint = endpointFilter === 'all' ? true : m.endpoint_id === endpointFilter;
    
    return matchesSearch && matchesStatus && matchesEndpoint;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    let aValue: any = '';
    let bValue: any = '';

    switch (sortConfig.key) {
      case 'processed':
        aValue = a.processed ? 1 : 0;
        bValue = b.processed ? 1 : 0;
        break;
      case 'received_at':
        aValue = new Date(a.received_at).getTime();
        bValue = new Date(b.received_at).getTime();
        break;
      case 'from_number':
        aValue = a.from_number;
        bValue = b.from_number;
        break;
      case 'endpoint_id':
        aValue = getEndpointNameString(a.endpoint_id);
        bValue = getEndpointNameString(b.endpoint_id);
        break;
      case 'body':
        aValue = a.body;
        bValue = b.body;
        break;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setEndpointFilter('all');
  };

  const persianDigits = (value: string | number) => {
    const map = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return value
      .toString()
      .replace(/\d/g, d => map[Number(d)]);
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || endpointFilter !== 'all';

  // Get Delivery Attempts for Selected Message
  const currentAttempts = selectedMessage 
    ? deliveryAttempts.filter(da => da.message_id === selectedMessage.id) 
    : [];

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-primary-500" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-primary-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">صندوق پیام</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">مشاهده و بررسی پیام‌های دریافتی از ماژول‌ها</p>
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

      {/* Advanced Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4 mb-4 lg:mb-0">
            <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Search Input */}
                <div className="md:col-span-5 relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="جستجو در متن، فرستنده..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm placeholder-gray-400 dark:placeholder-slate-500"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Status Select */}
                <div className="md:col-span-3 relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <ListFilter className="h-5 w-5" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full pr-10 pl-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="processed">پردازش شده</option>
                        <option value="pending">در انتظار</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {/* Endpoint Select */}
                <div className="md:col-span-4 relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <select
                        value={endpointFilter}
                        onChange={(e) => setEndpointFilter(e.target.value)}
                        className="w-full pr-10 pl-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
                    >
                        <option value="all">همه سیم‌کارت‌ها</option>
                        {endpoints.map(ep => (
                            <option key={ep.id} value={ep.id}>{ep.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-gray-100 dark:border-slate-700 pt-4 lg:pt-0">
                 {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="hidden md:inline">حذف فیلترها</span>
                    </button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600">
                   <span>{filteredMessages.length}</span>
                   <span className="text-gray-400 dark:text-slate-500 text-xs">پیام</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th 
                  scope="col" 
                  onClick={() => handleSort('processed')}
                  className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group/th w-32"
                >
                  <div className="flex items-center justify-center gap-1">
                     وضعیت <SortIcon column="processed" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('received_at')}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group/th w-40"
                >
                  <div className="flex items-center justify-start gap-1">
                     زمان دریافت <SortIcon column="received_at" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('from_number')}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group/th w-40"
                >
                  <div className="flex items-center justify-start gap-1">
                     فرستنده <SortIcon column="from_number" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('endpoint_id')}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group/th w-48"
                >
                  <div className="flex items-center justify-start gap-1">
                     درگاه (سیم) <SortIcon column="endpoint_id" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort('body')}
                  className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors group/th"
                >
                  <div className="flex items-center justify-start gap-1">
                     متن پیام <SortIcon column="body" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24">جزئیات</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {sortedMessages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-slate-400">
                      <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-full mb-3">
                          <Filter className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="font-medium">هیچ پیامی با این مشخصات یافت نشد.</p>
                      {hasActiveFilters && (
                          <button onClick={clearFilters} className="mt-2 text-sm text-primary-600 hover:underline">حذف فیلترها</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {sortedMessages.map((msg) => (
                <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {msg.processed ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 me-1.5" /> پردازش شده
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20">
                        <Clock className="h-3.5 w-3.5 me-1.5" /> در انتظار
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-mono text-right" dir="ltr">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-slate-300">{new Date(msg.received_at).toLocaleTimeString('fa-IR')}</span>
                        <span className="text-xs opacity-75">{new Date(msg.received_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white font-mono text-right" dir="ltr">
                    {persianDigits(msg.from_number)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">{getEndpointName(msg.endpoint_id)}</span>
                        <div className="p-1.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-500 dark:text-blue-400">
                            <Smartphone className="h-4 w-4" />
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 min-w-[300px] max-w-lg truncate text-right" dir="auto">
                    {msg.body}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button 
                      onClick={() => setSelectedMessage(msg)}
                      className="text-gray-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                      title="مشاهده جزئیات"
                    >
                      <FileJson className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">جزئیات پیام</h3>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                   <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 uppercase font-bold">فرستنده</p>
                   <p className="font-mono font-bold text-lg text-gray-800 dark:text-slate-200 tracking-tight" dir="ltr">{selectedMessage.from_number}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                   <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 uppercase font-bold">گیرنده (پایانه)</p>
                   <p className="font-mono font-bold text-lg text-gray-800 dark:text-slate-200 tracking-tight" dir="ltr">{selectedMessage.to_number}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">متن پیام:</p>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm leading-relaxed shadow-inner">
                  {selectedMessage.body}
                </div>
              </div>

              {/* Delivery Logs Section */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
                  تاریخچه ارسال‌ها (Forwarding Logs)
                </p>
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                   {currentAttempts.length === 0 ? (
                     <div className="p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
                        این پیام هنوز به هیچ کانالی ارسال نشده است.
                     </div>
                   ) : (
                     <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
                       <thead className="bg-gray-50 dark:bg-slate-800/50">
                         <tr>
                           <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 dark:text-slate-400">قانون</th>
                           <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 dark:text-slate-400">کانال</th>
                           <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 dark:text-slate-400">وضعیت</th>
                           <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 dark:text-slate-400">زمان / خطا</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                         {currentAttempts.map(attempt => {
                           const ruleName = rules.find(r => r.id === attempt.rule_id)?.name || 'نامشخص';
                           const channel = channels.find(c => c.id === attempt.channel_id);
                           return (
                             <tr key={attempt.id}>
                               <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300 font-medium">{ruleName}</td>
                               <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">
                                 <div className="flex items-center gap-1.5">
                                   {channel && getChannelIcon(channel.type)}
                                   <span>{channel?.name || 'Unknown'}</span>
                                 </div>
                               </td>
                               <td className="px-4 py-3 text-center">
                                  {attempt.status === DeliveryStatus.SENT ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">موفق</span>
                                  ) : attempt.status === DeliveryStatus.FAILED ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">ناموفق</span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300">در صف</span>
                                  )}
                               </td>
                               <td className="px-4 py-3 text-xs">
                                 {attempt.status === DeliveryStatus.FAILED ? (
                                   <span className="text-red-500 flex items-center gap-1" title={attempt.error}>
                                     <AlertTriangle className="h-3 w-3" />
                                     {attempt.error.substring(0, 15)}...
                                   </span>
                                 ) : (
                                   <span className="text-gray-500 dark:text-slate-500 font-mono" dir="ltr">
                                      {attempt.last_attempt_at ? new Date(attempt.last_attempt_at).toLocaleTimeString('fa-IR') : '-'}
                                   </span>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-purple-500" /> Payload خام (JSON)
                </p>
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-700" dir="ltr">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(selectedMessage.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex justify-end">
               <button 
                 onClick={() => setSelectedMessage(null)}
                 className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
               >
                 بستن
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};