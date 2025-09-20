'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Dropdown, 
  Badge, 
  ListGroup, 
  Button, 
  Spinner,
  Alert
} from 'react-bootstrap';
import { 
  FaBell, 
  FaCheck, 
  FaCheckDouble, 
  FaTrash,
  FaExclamationTriangle,
  FaInfoCircle,
  FaFileAlt,
  FaForward,
  FaComment,
  FaReply,
  FaExchangeAlt,
  FaClipboardList,
  FaStar,
  FaBullhorn
} from 'react-icons/fa';
import { useNotificationStore } from '@/store/notificationStore';
import { formatTimeAgo } from '@/utils';
import { NotificationType } from '@/types';

const NotificationDropdown: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotificationStore();
  
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap: Record<NotificationType, React.ComponentType> = {
      complaint_created: FaFileAlt,
      complaint_assigned: FaExchangeAlt,
      complaint_forwarded: FaForward,
      complaint_commented: FaComment,
      complaint_replied: FaReply,
      complaint_status_changed: FaExchangeAlt,
      withdrawal_submitted: FaClipboardList,
      withdrawal_reviewed: FaCheck,
      feedback_submitted: FaStar,
      system_announcement: FaBullhorn,
    };
    
    return iconMap[type] || FaInfoCircle;
  };

  const getNotificationColor = (type: NotificationType, isImportant: boolean) => {
    if (isImportant) return 'danger';
    
    const colorMap: Record<NotificationType, string> = {
      complaint_created: 'primary',
      complaint_assigned: 'info',
      complaint_forwarded: 'warning',
      complaint_commented: 'success',
      complaint_replied: 'success',
      complaint_status_changed: 'info',
      withdrawal_submitted: 'secondary',
      withdrawal_reviewed: 'success',
      feedback_submitted: 'warning',
      system_announcement: 'danger',
    };
    
    return colorMap[type] || 'secondary';
  };

  const handleMarkAsRead = async (notificationIds: number[]) => {
    try {
      await markAsRead(notificationIds);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Dropdown 
      show={show} 
      onToggle={setShow}
      align="end"
      className="me-3"
    >
      <Dropdown.Toggle
        variant="outline-secondary"
        id="notification-dropdown"
        className="position-relative border-0"
      >
        <FaBell />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.6rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown" style={{ width: '350px', maxHeight: '500px' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="p-0 text-decoration-none"
            >
              <FaCheckDouble className="me-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FaBell size={24} className="mb-2 opacity-50" />
              <div>No notifications</div>
            </div>
          ) : (
            <ListGroup variant="flush">
              {recentNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.notification_type);
                const color = getNotificationColor(notification.notification_type, notification.is_important);
                
                return (
                  <ListGroup.Item
                    key={notification.id}
                    className={`border-0 ${!notification.is_read ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start">
                      <div className={`text-${color} me-3 mt-1`}>
                        <IconComponent size={16} />
                      </div>
                      
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-1 text-truncate" style={{ fontSize: '0.9rem' }}>
                            {notification.title}
                          </h6>
                          {!notification.is_read && (
                            <Badge bg="primary" pill style={{ fontSize: '0.6rem' }}>
                              New
                            </Badge>
                          )}
                        </div>
                        
                        <p className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                          {notification.message}
                        </p>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {formatTimeAgo(notification.created_at)}
                          </small>
                          
                          <div className="d-flex gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead([notification.id]);
                                }}
                                title="Mark as read"
                              >
                                <FaCheck size={12} />
                              </Button>
                            )}
                            
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              title="Delete"
                            >
                              <FaTrash size={12} />
                            </Button>
                          </div>
                        </div>
                        
                        {notification.link && (
                          <div className="mt-2">
                            <Link
                              href={notification.link}
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                if (!notification.is_read) {
                                  handleMarkAsRead([notification.id]);
                                }
                                setShow(false);
                              }}
                            >
                              View Details
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </div>

        {notifications.length > 10 && (
          <div className="border-top p-2 text-center">
            <Link
              href="/notifications"
              className="btn btn-link text-decoration-none"
              onClick={() => setShow(false)}
            >
              View All Notifications
            </Link>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;

