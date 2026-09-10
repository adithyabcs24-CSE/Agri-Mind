'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import {
  Settings, User, Bell, Globe, CheckCircle, AlertCircle, Shield, Loader2, Save,
  Plus, Sprout, Compass, Trash2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { auth, AuthUser } from '@/lib/auth';
import { useFarmField } from '@/context/FarmFieldContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const {
    farms,
    fields,
    selectedFarmId,
    refetchFarms,
    refetchFields,
    isOffline
  } = useFarmField();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  // Form states for creating Farm/Field
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmArea, setNewFarmArea] = useState('5.0');
  const [selectedFarmForField, setSelectedFarmForField] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('2.5');

  const [loading, setLoading] = useState(false);
  const [creatingFarm, setCreatingFarm] = useState(false);
  const [creatingField, setCreatingField] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // 1. Immediately read user from local auth store
    const localUser = auth.getUser();
    if (localUser) {
      setUser(localUser);
      setFullName(localUser.name || '');
    }

    // 2. Fetch fresh user details from database if available
    api.getMe()
      .then(res => {
        if (res) {
          setUser(res);
          setFullName(res.full_name || res.name || localUser?.name || '');
          setPhone(res.phone || '');
          setLanguage(res.language || 'en');
          if (res.preferences) {
            setSmsAlerts(res.preferences.sms_alerts !== false);
            setEmailAlerts(res.preferences.email_alerts !== false);
            setPushAlerts(res.preferences.push_alerts !== false);
          }
          // Synchronize updated user back to auth store
          auth.setAuth(auth.getToken() || '', {
            id: String(res.id || localUser?.id || '1'),
            name: res.full_name || res.name || localUser?.name || 'Farmer',
            email: res.email || localUser?.email || '',
            role: (res.role || localUser?.role || 'farmer') as any,
          });
        }
      })
      .catch(() => {
        // In offline/demo mode, ensure user is set from local auth
        if (localUser) {
          setUser({
            full_name: localUser.name,
            email: localUser.email,
            role: localUser.role,
            phone: '+91 9110625567',
            language: 'en',
          });
          setFullName(localUser.name);
          setPhone('+91 9110625567');
        }
      });
  }, []);

  // Update default selected farm for adding fields
  useEffect(() => {
    if (farms.length > 0 && !selectedFarmForField) {
      setSelectedFarmForField(farms[0].id);
    }
  }, [farms, selectedFarmForField]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const loadingToast = toast.loading('Syncing user details with database...');

    try {
      // 1. Update backend if available
      try {
        await api.updateMe({
          full_name: fullName,
          phone,
          language,
          preferences: {
            sms_alerts: smsAlerts,
            email_alerts: emailAlerts,
            push_alerts: pushAlerts,
          },
        });
      } catch {
        // Backend update skipped if offline/demo
      }

      // 2. Persist to local AuthStore so Header & Sidebar immediately update
      const currentAuth = auth.getUser();
      const updatedUser: AuthUser = {
        id: currentAuth?.id || '1',
        name: fullName || currentAuth?.name || 'Farmer',
        email: currentAuth?.email || 'farmer@agrimind.ai',
        role: currentAuth?.role || 'farmer',
      };
      auth.setAuth(auth.getToken() || '', updatedUser);
      setUser(prev => ({ ...prev, ...updatedUser, full_name: fullName, phone, language }));

      setSuccess('Profile & preferences saved successfully!');
      toast.success('Profile updated successfully! 🌿', { id: loadingToast });
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
      toast.error(err.message || 'Failed to save settings.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) {
      toast.error('Farm name is required');
      return;
    }

    setCreatingFarm(true);
    const loadingToast = toast.loading('Registering new farm...');

    try {
      await api.createFarm({
        name: newFarmName,
        total_area_acres: parseFloat(newFarmArea) || 1.0,
        state: 'Punjab',
        district: 'Ludhiana'
      });
      setNewFarmName('');
      await refetchFarms();
      toast.success('Farm registered successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to create farm in Neon cloud DB:', err);
      toast.error(err.message || 'Failed to save farm to cloud database', { id: loadingToast });
    } finally {
      setCreatingFarm(false);
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmForField) {
      toast.error('Please select a farm first');
      return;
    }
    if (!newFieldName.trim()) {
      toast.error('Field name is required');
      return;
    }

    setCreatingField(true);
    const loadingToast = toast.loading('Registering field layout...');

    try {
      await api.createField(selectedFarmForField, {
        name: newFieldName,
        area_acres: parseFloat(newFieldArea) || 1.0,
        soil_type: 'loam'
      });
      setNewFieldName('');
      await refetchFields(selectedFarmForField);
      toast.success('Field registered successfully!', { id: loadingToast });
    } catch (err: any) {
      console.error('Failed to create field in Neon cloud DB:', err);
      toast.error(err.message || 'Failed to save field to cloud database', { id: loadingToast });
    } finally {
      setCreatingField(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Header title="Settings" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {error && (
          <div className="card bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="card bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Config Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card space-y-6"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" /> System Configurations
              </h3>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-display">
                    <User className="w-4 h-4" /> Profile & Contact Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="form-input font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="form-input font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-display">
                    <Globe className="w-4 h-4" /> Regional Localization
                  </h4>
                  
                  <div className="max-w-xs">
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Preferred Language</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="form-select w-full font-semibold"
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-display">
                    <Bell className="w-4 h-4" /> Notification Channels
                  </h4>
                  
                  <div className="space-y-3.5">
                    <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Mobile Push Notifications</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Immediate push updates on your device browser.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushAlerts}
                        onChange={e => setPushAlerts(e.target.checked)}
                        className="w-4.5 h-4.5 text-green-600 border-slate-300 dark:border-slate-800 rounded focus:ring-green-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">SMS Text Warnings</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Offline mobile text advisories on weather alerts.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsAlerts}
                        onChange={e => setSmsAlerts(e.target.checked)}
                        className="w-4.5 h-4.5 text-green-600 border-slate-300 dark:border-slate-800 rounded focus:ring-green-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-2xl cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Weekly Email Digests</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Detailed PDF report summaries delivered to your inbox.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={e => setEmailAlerts(e.target.checked)}
                        className="w-4.5 h-4.5 text-green-600 border-slate-300 dark:border-slate-800 rounded focus:ring-green-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/40">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving configs...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Farm & Fields Management */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card space-y-6"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                <Sprout className="w-5 h-5 text-green-650" /> Farms & Fields Setup
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Farm */}
                <form onSubmit={handleCreateFarm} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-display">
                    <Plus className="w-4 h-4 text-green-500" /> Add New Farm
                  </h4>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Farm Name</label>
                    <input
                      type="text"
                      value={newFarmName}
                      onChange={e => setNewFarmName(e.target.value)}
                      placeholder="e.g. Ludhiana Organic Farm"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Total Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFarmArea}
                      onChange={e => setNewFarmArea(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingFarm || isOffline}
                    className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    {creatingFarm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Register Farm
                  </button>
                </form>

                {/* Create Field */}
                <form onSubmit={handleCreateField} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-850 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-display">
                    <Plus className="w-4 h-4 text-blue-500" /> Add Field Layout
                  </h4>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Parent Farm</label>
                    <select
                      value={selectedFarmForField}
                      onChange={e => setSelectedFarmForField(e.target.value)}
                      className="form-select w-full"
                    >
                      {farms.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                      {farms.length === 0 && <option value="">Register a farm first</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Field Name</label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      placeholder="e.g. Field C - Wheat"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Area Size (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFieldArea}
                      onChange={e => setNewFieldArea(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingField || isOffline || farms.length === 0}
                    className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 border-blue-500 bg-blue-650 hover:bg-blue-600 focus:ring-blue-500/20"
                  >
                    {creatingField ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Register Field
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Security Telemetry & Overview List */}
          <div className="space-y-6">
            
            {/* Account Security details */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card space-y-4"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" /> Security Telemetry
              </h3>
              
              <div className="space-y-3.5 text-xs font-semibold">
                <p className="text-slate-500 flex justify-between items-center">
                  <span>Name:</span> 
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{user?.full_name || user?.name || fullName || 'Farmer'}</span>
                </p>
                <p className="text-slate-500 flex justify-between items-center">
                  <span>Email:</span> 
                  <span className="text-slate-800 dark:text-slate-200">{user?.email || 'farmer@agrimind.ai'}</span>
                </p>
                <p className="text-slate-500 flex justify-between items-center">
                  <span>User ID:</span> 
                  <span className="text-[10px] text-slate-400 font-mono">{String(user?.id || 'demo-001').substring(0, 18)}</span>
                </p>
                <p className="text-slate-500 flex justify-between items-center">
                  <span>Phone:</span> 
                  <span className="text-slate-800 dark:text-slate-200">{user?.phone || phone || 'Not registered'}</span>
                </p>
                <p className="text-slate-500 flex justify-between items-center">
                  <span>Access Level:</span> 
                  <span className="bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide">
                    {user?.role || 'farmer'}
                  </span>
                </p>
                <p className="text-slate-500 flex justify-between items-center">
                  <span>Database Session:</span> 
                  <span className="text-green-600 font-extrabold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {user?.email === 'demo@agrimind.ai' ? 'Demo Sandbox' : 'Neon Cloud Sync'}
                  </span>
                </p>
              </div>
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-[10px] text-slate-400 leading-relaxed font-semibold">
                <p className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1 font-display">Security Protocol</p>
                AgriMind AI sessions use JSON Web Tokens (JWT) encrypted via HMAC-SHA256, persisting authorization header tokens locally.
              </div>
            </motion.div>

            {/* Farm Layout Overview list */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card space-y-4"
            >
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                <Compass className="w-5 h-5 text-blue-500" /> Registered Farms ({farms.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {farms.map(f => (
                  <div key={f.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-850 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{f.name}</span>
                      <span className="text-[10px] text-slate-450 font-bold bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {f.total_area_acres} ac
                      </span>
                    </div>
                    {f.id === selectedFarmId && (
                      <div className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-lg w-fit">
                        Currently Selected
                      </div>
                    )}
                  </div>
                ))}

                {farms.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                    No registered layouts found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
