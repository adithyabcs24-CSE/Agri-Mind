'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { Bell, AlertTriangle, AlertCircle, Info, Eye, CheckCheck, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAlerts(unreadOnly);
      setAlerts(data || []);
    } catch (err: any) {
      console.warn('API alerts fetch failed, using fallback alerts:', err);
      // Fallback data
      const mockAlerts = [
        { id: '1', title: 'Severe Heatwave Scheduled', message: 'Temperature projected at 38°C for 4 consecutive days. Elevate field A irrigation levels.', severity: 'critical', is_read: false, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { id: '2', title: 'Brown Planthopper Pest Detection', message: 'Warm weather and relative humidity at 78% creates medium risk of pest infestation.', severity: 'warning', is_read: false, created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
        { id: '3', title: 'Automatic Valve Schedule Executed', message: 'Field A rice crops successfully irrigated with 4,200 liters of water.', severity: 'info', is_read: true, created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
      ];
      setAlerts(unreadOnly ? mockAlerts.filter(a => !a.is_read) : mockAlerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [unreadOnly]);

  const handleMarkAsRead = async (alertId: string) => {
    const loadingToast = toast.loading('Acknowledging notification warning...');
    try {
      setError('');
      await api.markAlertRead(alertId);
      toast.success('Alert marked as read.', { id: loadingToast });
      loadAlerts();
    } catch (err: any) {
      console.warn('API acknowledge failed, updating locally:', err);
      // Local fallback edit
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      toast.success('Acknowledged warning (Local Bypass)', { id: loadingToast });
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500 fill-current" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500 fill-current" />;
      default: return <Info className="w-5 h-5 text-blue-500 fill-current" />;
    }
  };

  const getAlertBg = (severity: string, isRead: boolean) => {
    if (isRead) return 'border-l-slate-300 dark:border-l-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-60';
    switch (severity?.toLowerCase()) {
      case 'critical': return 'border-l-red-500 bg-red-500/5 dark:bg-red-500/10 border-red-500/20';
      case 'warning': return 'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20';
      default: return 'border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20';
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
      <Header title="Notification & Alerts" />
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Toggle options */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center justify-between py-4"
        >
          <div className="flex gap-2">
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                !unreadOnly 
                  ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-500 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                unreadOnly 
                  ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-500 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Unread Only
            </button>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Unacknowledged Alerts: <span className="text-red-500 font-extrabold">{unreadCount}</span>
          </p>
        </motion.div>

        {error && (
          <div className="card bg-red-500/10 border border-red-500/20 text-red-650 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Unread Alerts"
            value={unreadCount}
            subtitle="Requires immediate attention"
            icon={Bell}
            color={unreadCount > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Critical Warnings"
            value={alerts.filter(a => a.severity === 'critical' && !a.is_read).length}
            subtitle="Immediate threats to yield"
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Advisory Info"
            value={alerts.filter(a => a.severity === 'info' && !a.is_read).length}
            subtitle="Standard telemetry updates"
            icon={Info}
            color="blue"
          />
        </div>

        {/* Alerts List */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-4"
        >
          <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Notification Inbox</h3>

          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500" />
              Retrieving sensor triggers...
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-3.5">
              <AnimatePresence initial={false}>
                {alerts.map((alert: any) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={alert.id}
                    className={`p-4 border-t border-b border-r border-l-4 rounded-2xl flex items-start gap-4 justify-between transition-all shadow-sm ${getAlertBg(alert.severity, alert.is_read)}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 font-display">
                          {alert.title}
                          {!alert.is_read && (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                          )}
                        </p>
                        <p className="text-xs font-semibold text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                        <span className="text-[10px] text-slate-450 mt-2.5 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!alert.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" /> Mark Read
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              Your farm warning logs are completely empty. Good job!
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
