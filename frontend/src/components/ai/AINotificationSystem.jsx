import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../../services/api';

const AINotificationSystem = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Fetch notifications on component mount
    useEffect(() => {
        fetchNotifications();
        
        // Set up polling to check for new notifications
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/ai/notifications');
            
            // Check if there are any new notifications compared to what we have
            const newNotifications = response.data.notifications;
            if (newNotifications.length > notifications.length) {
                setHasUnread(true);
                
                // If there are any critical alerts, show notification
                const criticalAlerts = newNotifications.filter(n => n.priority === 'high' && !n.read);
                if (criticalAlerts.length > 0) {
                    showBrowserNotification(criticalAlerts[0]);
                }
            }
            
            setNotifications(newNotifications);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const showBrowserNotification = (notification) => {
        // Check if browser notifications are supported and permission is granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Finance Tracker Alert', {
                body: notification.message,
                icon: '/favicon.ico'
            });
        }
        // If permission hasn't been requested yet
        else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Finance Tracker Alert', {
                        body: notification.message,
                        icon: '/favicon.ico'
                    });
                }
            });
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/ai/notifications/${id}/read`);
            setNotifications(prevNotifications => 
                prevNotifications.map(notification => 
                    notification.id === id 
                        ? { ...notification, read: true } 
                        : notification
                )
            );
            
            // Check if there are any unread notifications left
            const unreadNotifications = notifications.filter(n => !n.read && n.id !== id);
            setHasUnread(unreadNotifications.length > 0);
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const dismissNotification = (id) => {
        setNotifications(prevNotifications => 
            prevNotifications.filter(notification => notification.id !== id)
        );
        
        // Check if there are any unread notifications left
        const unreadNotifications = notifications.filter(n => !n.read && n.id !== id);
        setHasUnread(unreadNotifications.length > 0);
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'alert':
                return 'bg-red-100 text-red-600';
            case 'warning':
                return 'bg-amber-100 text-amber-600';
            case 'tip':
                return 'bg-green-100 text-green-600';
            case 'info':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setShowNotifications(!showNotifications);
                    setHasUnread(false);
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {hasUnread && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 border border-gray-200 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Notifications</h3>
                        <button
                            onClick={() => setShowNotifications(false)}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p>No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-3 hover:bg-gray-50 transition-colors duration-200 ${!notification.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex justify-between">
                                            <div className={`px-2 py-1 rounded-md text-xs ${getNotificationColor(notification.type)}`}>
                                                {notification.type.toUpperCase()}
                                            </div>
                                            <button
                                                onClick={() => dismissNotification(notification.id)}
                                                className="p-1 hover:bg-gray-200 rounded-full"
                                            >
                                                <X className="w-3 h-3 text-gray-500" />
                                            </button>
                                        </div>
                                        <p className="mt-1 text-gray-800">{notification.message}</p>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">{notification.timestamp}</span>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AINotificationSystem;
