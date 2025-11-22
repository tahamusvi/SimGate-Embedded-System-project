import React, { useState, useEffect } from 'react';
import { ForwardRule, DestinationChannel, ChannelType, RuleDestination } from '../types';
import { GitFork, Globe, Mail, MessageSquare, Send, ToggleLeft, ToggleRight, Trash2, Edit, X, Check, AlertCircle, Settings, Plus, ArrowLeftRight, Cable } from 'lucide-react';

interface RulesProps {
  rules: ForwardRule[];
  channels: DestinationChannel[];
  ruleDestinations: RuleDestination[];
}

export const Rules: React.FC<RulesProps> = ({ rules, channels, ruleDestinations }) => {
  const [localRules, setLocalRules] = useState<ForwardRule[]>(rules);
  const [localChannels, setLocalChannels] = useState<DestinationChannel[]>(channels);
  const [localDestinations, setLocalDestinations] = useState<RuleDestination[]>(ruleDestinations);

  // Update local state when props change
  useEffect(() => {
    setLocalRules(rules);
    setLocalChannels(channels);
    setLocalDestinations(ruleDestinations);
  }, [rules, channels, ruleDestinations]);
  
  // --- Rule State ---
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    priority: '100',
    filters: '{}'
  });

  // --- Channel State ---
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: ChannelType.TELEGRAM,
    config: '{}'
  });

  // --- Rule Destination Management State ---
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [currentRuleForDest, setCurrentRuleForDest] = useState<ForwardRule | null>(null);
  const [destForm, setDestForm] = useState({
    channelId: '',
    template: '',
    config: '{}'
  });
  const [isAddingDest, setIsAddingDest] = useState(false);


  // --- Helpers ---
  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getChannelIcon = (type: ChannelType) => {
    switch(type) {
      case ChannelType.TELEGRAM: return <Send className="h-5 w-5 text-blue-500" />;
      case ChannelType.EMAIL: return <Mail className="h-5 w-5 text-amber-500" />;
      case ChannelType.WEBHOOK: return <Globe className="h-5 w-5 text-purple-500" />;
      case ChannelType.SMS: return <MessageSquare className="h-5 w-5 text-green-500" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  // --- Rule Handlers ---
  const openAddRule = () => {
    setEditingRuleId(null);
    setRuleForm({ name: '', priority: '100', filters: '{\n  "contains": "ALERT"\n}' });
    setIsRuleModalOpen(true);
  };

  const openEditRule = (rule: ForwardRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      priority: rule.priority.toString(),
      filters: JSON.stringify(rule.filters, null, 2)
    });
    setIsRuleModalOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if(window.confirm('آیا از حذف این قانون اطمینان دارید؟')) {
      setLocalRules(prev => prev.filter(r => r.id !== id));
      setLocalDestinations(prev => prev.filter(rd => rd.rule_id !== id)); // Cascade delete
    }
  };

  const handleSaveRule = () => {
    if (!ruleForm.name) return;
    if (!isValidJson(ruleForm.filters)) {
      alert('فرمت JSON فیلد شروط صحیح نیست.');
      return;
    }

    const newRule: ForwardRule = {
      id: editingRuleId || `r-${Date.now()}`,
      project_id: 'p1',
      name: ruleForm.name,
      is_enabled: true,
      priority: parseInt(ruleForm.priority) || 100,
      filters: JSON.parse(ruleForm.filters),
      stop_processing: false
    };

    if (editingRuleId) {
      setLocalRules(prev => prev.map(r => r.id === editingRuleId ? { ...newRule, is_enabled: r.is_enabled } : r));
    } else {
      setLocalRules([...localRules, newRule]);
    }
    setIsRuleModalOpen(false);
  };

  const toggleRuleStatus = (id: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, is_enabled: !r.is_enabled } : r));
  };

  // --- Channel Handlers ---
  const openAddChannel = () => {
    setEditingChannelId(null);
    setChannelForm({ 
      name: '', 
      type: ChannelType.TELEGRAM, 
      config: '{\n  "chat_id": "-100..."\n}' 
    });
    setIsChannelModalOpen(true);
  };

  const openEditChannel = (channel: DestinationChannel) => {
    setEditingChannelId(channel.id);
    setChannelForm({
      name: channel.name,
      type: channel.type,
      config: JSON.stringify(channel.config, null, 2)
    });
    setIsChannelModalOpen(true);
  };

  const handleDeleteChannel = (id: string) => {
    if(window.confirm('آیا از حذف این کانال اطمینان دارید؟')) {
      setLocalChannels(prev => prev.filter(c => c.id !== id));
      setLocalDestinations(prev => prev.filter(rd => rd.channel_id !== id)); // Cascade delete
    }
  };

  const handleSaveChannel = () => {
    if (!channelForm.name) return;
    if (!isValidJson(channelForm.config)) {
      alert('فرمت JSON فیلد پیکربندی صحیح نیست.');
      return;
    }

    const newChannel: DestinationChannel = {
      id: editingChannelId || `c-${Date.now()}`,
      project_id: 'p1',
      name: channelForm.name,
      type: channelForm.type,
      is_enabled: true,
      config: JSON.parse(channelForm.config)
    };

    if (editingChannelId) {
      setLocalChannels(prev => prev.map(c => c.id === editingChannelId ? { ...newChannel, is_enabled: c.is_enabled } : c));
    } else {
      setLocalChannels([...localChannels, newChannel]);
    }
    setIsChannelModalOpen(false);
  };

  // --- Rule Destination (Link) Handlers ---
  const openDestModal = (rule: ForwardRule) => {
    setCurrentRuleForDest(rule);
    setIsAddingDest(false);
    setIsDestModalOpen(true);
  };

  const startAddDestination = () => {
    setDestForm({ channelId: localChannels[0]?.id || '', template: '', config: '{}' });
    setIsAddingDest(true);
  };

  const handleAddDestination = () => {
    if (!currentRuleForDest) return;
    if (!destForm.channelId) {
      alert("لطفا یک کانال انتخاب کنید");
      return;
    }
    if (!isValidJson(destForm.config)) {
      alert('JSON پیکربندی نامعتبر است');
      return;
    }

    const newDest: RuleDestination = {
      id: `rd-${Date.now()}`,
      rule_id: currentRuleForDest.id,
      channel_id: destForm.channelId,
      is_enabled: true,
      override_text_template: destForm.template,
      action_config: JSON.parse(destForm.config)
    };

    setLocalDestinations([...localDestinations, newDest]);
    setIsAddingDest(false);
  };

  const handleDeleteDestination = (destId: string) => {
    setLocalDestinations(prev => prev.filter(d => d.id !== destId));
  };

  const toggleDestStatus = (destId: string) => {
    setLocalDestinations(prev => prev.map(d => d.id === destId ? { ...d, is_enabled: !d.is_enabled } : d));
  };


  return (
    <div className="space-y-12">
      
      {/* Rules Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <GitFork className="h-6 w-6 text-primary-600" />
               قوانین ارجاع (Forward Rules)
             </h2>
             <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">تعریف منطق پردازش و فیلتر کردن پیام‌ها</p>
          </div>
          <button 
            onClick={openAddRule}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            قانون جدید
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">اولویت</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">نام قانون</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">شروط</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">وضعیت</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">عملیات (مقاصد)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">مدیریت</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {localRules.map(rule => {
                   const ruleDests = localDestinations.filter(d => d.rule_id === rule.id);
                   return (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300">
                          {rule.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{rule.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        <div className="group relative inline-block">
                          <code className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-xs font-mono text-pink-600 dark:text-pink-400 truncate max-w-[150px] inline-block" dir="ltr">
                            {JSON.stringify(rule.filters)}
                          </code>
                          <div className="absolute z-10 hidden group-hover:block bg-black text-white text-xs rounded p-2 bottom-full mb-1 whitespace-pre" dir="ltr">
                             {JSON.stringify(rule.filters, null, 2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button onClick={() => toggleRuleStatus(rule.id)}>
                          {rule.is_enabled ? 
                            <ToggleRight className="h-8 w-8 text-green-500 hover:text-green-600 transition-colors mx-auto" /> : 
                            <ToggleLeft className="h-8 w-8 text-gray-300 dark:text-slate-600 hover:text-gray-400 transition-colors mx-auto" />
                          }
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <button 
                           onClick={() => openDestModal(rule)}
                           className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                         >
                           <Cable className="h-3.5 w-3.5" />
                           {ruleDests.length} مقصد فعال
                         </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditRule(rule)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Channels Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Globe className="h-6 w-6 text-indigo-600" />
               کانال‌های مقصد (Channels)
             </h2>
             <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">تعریف درگاه‌های خروجی برای ارسال پیام</p>
          </div>
          <button 
            onClick={openAddChannel}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            کانال جدید
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localChannels.map(channel => (
            <div key={channel.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all group">
               <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                         {getChannelIcon(channel.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{channel.name}</h3>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">{channel.type}</span>
                      </div>
                    </div>
                    <div className={`h-2.5 w-2.5 rounded-full ${channel.is_enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300 dark:bg-slate-600'}`} title={channel.is_enabled ? 'فعال' : 'غیرفعال'} />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 to-transparent dark:from-slate-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur-sm"></div>
                    <div className="relative text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 p-3 rounded-lg font-mono overflow-hidden h-20 custom-scrollbar overflow-y-auto" dir="ltr">
                      <pre className="whitespace-pre-wrap break-all font-sans">
                        {JSON.stringify(channel.config, null, 2)}
                      </pre>
                    </div>
                  </div>
               </div>
               
               <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">
                  <button 
                    onClick={() => openEditChannel(channel)}
                    className="text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-1.5 rounded hover:bg-white dark:hover:bg-slate-600 transition-colors"
                  >
                    ویرایش
                  </button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-slate-600 my-auto"></div>
                  <button 
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 px-3 py-1.5 rounded hover:bg-white dark:hover:bg-slate-600 transition-colors"
                  >
                    حذف
                  </button>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Modals --- */}

      {/* Rule Edit Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingRuleId ? 'ویرایش قانون' : 'افزودن قانون جدید'}</h3>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">نام قانون</label>
                  <input 
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="مثال: لاگ دمای بالا"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">اولویت</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-center"
                    placeholder="100"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex justify-between">
                  <span>شروط فیلترینگ (JSON)</span>
                  <span className="text-xs text-gray-400 font-normal">معتبر: JSON Object</span>
                </label>
                <textarea 
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-300 font-mono text-sm focus:ring-2 focus:ring-primary-500"
                  value={ruleForm.filters}
                  onChange={(e) => setRuleForm({ ...ruleForm, filters: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                انصراف
              </button>
              <button onClick={handleSaveRule} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm font-medium">
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Edit Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingChannelId ? 'ویرایش کانال' : 'افزودن کانال جدید'}</h3>
              <button onClick={() => setIsChannelModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">نام کانال</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="مثال: گروه تلگرام پشتیبانی"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">نوع کانال</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  value={channelForm.type}
                  onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as ChannelType })}
                >
                  <option value={ChannelType.TELEGRAM}>تلگرام (Telegram)</option>
                  <option value={ChannelType.WEBHOOK}>وب‌هوک (Webhook)</option>
                  <option value={ChannelType.EMAIL}>ایمیل (Email)</option>
                  <option value={ChannelType.SMS}>پیامک (SMS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex justify-between">
                  <span>پیکربندی (JSON)</span>
                </label>
                <textarea 
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-300 font-mono text-sm focus:ring-2 focus:ring-primary-500"
                  value={channelForm.config}
                  onChange={(e) => setChannelForm({ ...channelForm, config: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setIsChannelModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                انصراف
              </button>
              <button onClick={handleSaveChannel} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm font-medium">
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Destination Management Modal (The Link) */}
      {isDestModalOpen && currentRuleForDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <div>
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">مدیریت مقاصد قانون</h3>
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">قانون: <span className="font-bold text-primary-600">{currentRuleForDest.name}</span></p>
              </div>
              <button onClick={() => setIsDestModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               
               {/* List of existing destinations */}
               {!isAddingDest && (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300">کانال‌های متصل شده</h4>
                       <button 
                         onClick={startAddDestination}
                         className="text-xs flex items-center gap-1 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 px-3 py-1.5 rounded hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-bold"
                       >
                         <Plus className="h-3 w-3" /> اتصال کانال جدید
                       </button>
                    </div>
                    
                    {localDestinations.filter(d => d.rule_id === currentRuleForDest.id).length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                         <Cable className="h-8 w-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                         <p className="text-sm text-gray-500 dark:text-slate-400">هیچ کانالی به این قانون متصل نشده است.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {localDestinations.filter(d => d.rule_id === currentRuleForDest.id).map(dest => {
                           const ch = localChannels.find(c => c.id === dest.channel_id);
                           return (
                             <div key={dest.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg group">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-white dark:bg-slate-600 rounded-lg border border-gray-100 dark:border-slate-500">
                                      {ch ? getChannelIcon(ch.type) : <Globe className="h-4 w-4" />}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{ch?.name || 'کانال حذف شده'}</p>
                                      {dest.override_text_template && <span className="text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-1.5 py-0.5 rounded">Override Template</span>}
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button onClick={() => toggleDestStatus(dest.id)} title={dest.is_enabled ? "فعال" : "غیرفعال"}>
                                     {dest.is_enabled ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-gray-400" />}
                                   </button>
                                   <button onClick={() => handleDeleteDestination(dest.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                      <Trash2 className="h-4 w-4" />
                                   </button>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                    )}
                 </div>
               )}

               {/* Add New Form */}
               {isAddingDest && (
                 <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-xl border border-gray-200 dark:border-slate-600 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                       <Plus className="h-4 w-4" /> اتصال کانال جدید
                    </h4>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">انتخاب کانال</label>
                          <select 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm"
                            value={destForm.channelId}
                            onChange={(e) => setDestForm({ ...destForm, channelId: e.target.value })}
                          >
                            <option value="" disabled>یک کانال انتخاب کنید...</option>
                            {localChannels.map(ch => (
                              <option key={ch.id} value={ch.id}>{ch.name} ({ch.type})</option>
                            ))}
                          </select>
                       </div>
                       
                       <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">قالب متن جایگزین (Override Template)</label>
                          <textarea 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="اختیاری: متن پیام را تغییر دهید..."
                            rows={2}
                            value={destForm.template}
                            onChange={(e) => setDestForm({ ...destForm, template: e.target.value })}
                          />
                       </div>

                       <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">پیکربندی عملیات (Action Config JSON)</label>
                          <textarea 
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                            placeholder="{}"
                            rows={2}
                            dir="ltr"
                            value={destForm.config}
                            onChange={(e) => setDestForm({ ...destForm, config: e.target.value })}
                          />
                       </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                       <button onClick={() => setIsAddingDest(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded border border-transparent">انصراف</button>
                       <button onClick={handleAddDestination} className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm">افزودن</button>
                    </div>
                 </div>
               )}

            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button onClick={() => setIsDestModalOpen(false)} className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium text-sm">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};