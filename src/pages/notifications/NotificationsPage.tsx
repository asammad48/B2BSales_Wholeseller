import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { notificationsRepository, Notification } from '../../repositories/notificationsRepository';
import { Bell, AlertTriangle, Info, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsRepository.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LowStock': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'System': return <Info size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: (n: Notification) => <span className="text-[10px] font-mono text-gray-400">{n.id}</span>
    },
    { 
      header: 'Notification', 
      accessor: (n: Notification) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            n.isRead ? 'bg-gray-50' : 'bg-blue-50'
          }`}>
            {getIcon(n.type)}
          </div>
          <div>
            <p className={`font-medium ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {n.title}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{n.message}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Time', 
      accessor: (n: Notification) => (
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock size={14} />
          <span className="text-xs">{new Date(n.createdAt).toLocaleString()}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (n: Notification) => (
        <div className="flex items-center gap-1.5">
          {n.isRead ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Read</span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">New</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Notifications" 
          description="Stay updated with low stock alerts, system updates, and important announcements."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataTable 
            data={notifications} 
            columns={columns} 
            loading={loading}
          />
        </motion.div>
      </div>
    </div>
  );
};
