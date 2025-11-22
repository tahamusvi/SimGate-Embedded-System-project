import React, { useState, useRef, useEffect } from 'react';
import { SimEndpoint } from '../types';
import { Signal, Smartphone, Battery, Calendar, MoreVertical, Plus, X, Trash2, Edit, Settings, Copy, Check, RefreshCw } from 'lucide-react';

interface SimEndpointsProps {
  endpoints: SimEndpoint[];
}

export const SimEndpoints: React.FC<SimEndpointsProps> = ({ endpoints }) => {
  const [localEndpoints, setLocalEndpoints] = useState<SimEndpoint[]>(endpoints);
  
  // Sync props to state when API data arrives
  useEffect(() => {
    setLocalEndpoints(endpoints);
  }, [endpoints]);
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', imei: '', token: '' });

  // Config Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedConfigSim, setSelectedConfigSim] = useState<SimEndpoint | null>(null);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSignalColor = (level?: number) => {
    if (level === undefined || level === null) return 'text-gray-300 dark:text-slate-600';
    if (level > 70) return 'text-green-500 dark:text-green-400';
    if (level > 30) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  // Helper to safely render date which might be ISO string or pre-formatted Persian string
  const renderLastConnection = (dateStr?: string) => {
    if (!dateStr) return 'نامشخص';
    
    // Check if it is a standard date string that JS can parse
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('fa-IR');
    }
    // If not (e.g. already Persian string from server), return as is
    return dateStr;
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', imei: '', token: `sk_live_${Math.random().toString(36).substr(2, 9)}` });
    setEditingId(null);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const openEditModal = (sim: SimEndpoint) => {
    setFormData({
      name: sim.name,
      phone: sim.phone_number,
      imei: sim.imei,
      token: sim.api_token
    });
    setEditingId(sim.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این دستگاه اطمینان دارید؟')) {
      setLocalEndpoints(prev => prev.filter(s => s.id !== id));
    }
    setActiveMenuId(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.token) return;
    
    if (editingId) {
      // Update existing
      setLocalEndpoints(prev => prev.map(sim => 
        sim.id === editingId ? {
          ...sim,
          name: formData.name,
          phone_number: formData.phone,
          imei: formData.imei,
          api_token: formData.token
        } : sim
      ));
    } else {
      // Add new
      const sim: SimEndpoint = {
        id: `e-${Date.now()}`,
        project_id: 'p1',
        name: formData.name,
        phone_number: formData.phone,
        imei: formData.imei,
        api_token: formData.token,
        is_active: true,
        last_heartbeat: new Date().toISOString(),
        signal_strength: 100
      };
      setLocalEndpoints([...localEndpoints, sim]);
    }
    
    setIsModalOpen(false);
  };

  const handleConfigure = (sim: SimEndpoint) => {
    setSelectedConfigSim(sim);
    setIsConfigModalOpen(true);
  };

  const generateNewToken = () => {
    setFormData({ ...formData, token: `sk_live_${Math.random().toString(36).substr(2, 12)}` });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت سیم‌کارت‌ها</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">دستگاه‌های ESP32 و وضعیت اتصال آن‌ها</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">افزودن دستگاه جدید</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {localEndpoints.map(sim => (
          <div key={sim.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-visible hover:shadow-md transition-shadow group relative">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="relative">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === sim.id ? null : sim.id);
                    }}
                    className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                   >
                     <MoreVertical className="h-5 w-5" />
                   </button>
                   
                   {/* Dropdown Menu */}
                   {activeMenuId === sim.id && (
                     <div ref={menuRef} className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-gray-100 dark:border-slate-600 z-10 overflow-hidden">
                       <button 
                        onClick={() => openEditModal(sim)}
                        className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-2"
                       >
                         <Edit className="h-4 w-4" /> ویرایش
                       </button>
                       <button 
                        onClick={() => handleDelete(sim.id)}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                       >
                         <Trash2 className="h-4 w-4" /> حذف
                       </button>
                     </div>
                   )}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{sim.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-mono tracking-wider mb-6" dir="ltr">{sim.phone_number}</p>
              
              <div className="space-y-3 border-t border-gray-100 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                    <Signal className={`h-4 w-4 ${getSignalColor(sim.signal_strength)}`} />
                    قدرت سیگنال
                  </span>
                  <span className="font-medium font-mono text-gray-700 dark:text-slate-300" dir="ltr">{sim.signal_strength}% - dBm</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                    <Battery className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                    وضعیت
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${sim.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {sim.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                    آخرین ارتباط
                  </span>
                  <span className="font-medium text-xs text-gray-600 dark:text-slate-400" dir="ltr">
                    {renderLastConnection(sim.last_heartbeat)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/30 px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
               <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">IMEI: {sim.imei ? sim.imei.substring(0, 8) + '...' : 'N/A'}</span>
               <button 
                 onClick={() => handleConfigure(sim)}
                 className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium flex items-center gap-1"
               >
                 <Settings className="h-3.5 w-3.5" />
                 پیکربندی
               </button>
            </div>
          </div>
        ))}
        
        {/* Add New Placeholder Card */}
        <button 
          onClick={openAddModal}
          className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all min-h-[300px]"
        >
           <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
             <Plus className="h-6 w-6" />
           </div>
           <span className="font-medium">اتصال سخت‌افزار جدید</span>
           <span className="text-xs mt-2">ESP32 / GSM Modules</span>
        </button>
      </div>

      {/* Add/Edit Sim Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'ویرایش سیم‌کارت' : 'افزودن سیم‌کارت جدید'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">نام دستگاه</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder="مثال: سنسور دما - سوله ۲"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">شماره سیم‌کارت</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-left"
                  placeholder="+98912..."
                  dir="ltr"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">توکن API (محرمانه)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 text-left font-mono text-sm"
                    placeholder="sk_..."
                    dir="ltr"
                    value={formData.token}
                    onChange={e => setFormData({...formData, token: e.target.value})}
                  />
                  <button 
                    onClick={generateNewToken}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
                    title="تولید توکن جدید"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">IMEI (اختیاری)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-left"
                  placeholder="Device IMEI"
                  dir="ltr"
                  value={formData.imei}
                  onChange={e => setFormData({...formData, imei: e.target.value})}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {editingId ? 'ذخیره تغییرات' : 'افزودن دستگاه'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedConfigSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">پیکربندی {selectedConfigSim.name}</h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex gap-3 items-start">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">دستورالعمل اتصال</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      برای اتصال ماژول ESP32 به سرور، از آدرس و توکن زیر در کد آردوینو (Sketch) خود استفاده کنید. این اطلاعات باید در هدر درخواست‌های HTTP قرار گیرد.
                    </p>
                  </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Server Endpoint</label>
                 <div className="flex gap-2">
                   <code className="flex-1 p-3 bg-gray-800 text-green-400 rounded-lg font-mono text-sm overflow-x-auto" dir="ltr">
                     https://api.simgate.ir/v1/webhook/sms
                   </code>
                   <button className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-600 dark:text-slate-300 transition-colors">
                     <Copy className="h-5 w-5" />
                   </button>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">X-Api-Key</label>
                 <div className="flex gap-2">
                   <code className="flex-1 p-3 bg-gray-800 text-yellow-400 rounded-lg font-mono text-sm overflow-x-auto" dir="ltr">
                     {selectedConfigSim.api_token}
                   </code>
                   <button className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-600 dark:text-slate-300 transition-colors">
                     <Copy className="h-5 w-5" />
                   </button>
                 </div>
               </div>

               <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">وضعیت اتصال</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${selectedConfigSim.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-gray-700 dark:text-slate-300">
                      {selectedConfigSim.is_active ? 'متصل و آنلاین' : 'قطع ارتباط'}
                    </span>
                    <span className="text-gray-400 dark:text-slate-500 mx-2">|</span>
                    <span className="text-gray-500 dark:text-slate-400 text-xs">
                      آخرین ارتباط: {renderLastConnection(selectedConfigSim.last_heartbeat)}
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};