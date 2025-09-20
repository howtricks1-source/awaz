'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { 
  FaFileAlt, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaBell,
  FaClipboardList
} from 'react-icons/fa';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatNumber, getRoleDisplayName, canCreateComplaints } from '@/utils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppProviders from '@/components/providers/AppProviders';

const DashboardPage: React.FC = () => {
  const { user, dashboardStats, fetchDashboardStats } = useAuthStore();
  const { complaints, fetchComplaints } = useComplaintStore();
  const { notifications, unreadCount } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchDashboardStats(),
          fetchComplaints(1),
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchDashboardStats, fetchComplaints]);

  if (!user) return null;

  const recentComplaints = complaints.slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  const getStatsCards = () => {
    const baseCards = [
      {
        title: 'Total Complaints',
        value: dashboardStats?.my_complaints || 0,
        icon: FaFileAlt,
        color: 'primary',
        href: '/complaints',
      },
      {
        title: 'Pending',
        value: dashboardStats?.pending_complaints || 0,
        icon: FaClock,
        color: 'warning',
        href: '/complaints?status=Pending',
      },
      {
        title: 'Resolved',
        value: dashboardStats?.resolved_complaints || 0,
        icon: FaCheckCircle,
        color: 'success',
        href: '/complaints?status=Resolved',
      },
      {
        title: 'Notifications',
        value: unreadCount,
        icon: FaBell,
        color: 'info',
        href: '/notifications',
      },
    ];

    // Add role-specific cards
    if (user.role === 'Staff' || user.role === 'DepartmentHead' || user.role === 'VC' || user.role === 'Admin') {
      baseCards.splice(1, 0, {
        title: 'Assigned to Me',
        value: dashboardStats?.assigned_complaints || 0,
        icon: FaUsers,
        color: 'info',
        href: '/complaints?assigned_to_me=true',
      });
    }

    if (user.role === 'DepartmentHead' || user.role === 'VC' || user.role === 'Admin') {
      baseCards.push({
        title: 'Department Total',
        value: dashboardStats?.department_complaints || 0,
        icon: FaChartLine,
        color: 'secondary',
        href: '/analytics',
      });
    }

    if (user.role === 'Student') {
      baseCards.push({
        title: 'My Withdrawals',
        value: dashboardStats?.my_withdrawals || 0,
        icon: FaClipboardList,
        color: 'secondary',
        href: '/withdrawals',
      });
    }

    return baseCards;
  };

  const statsCards = getStatsCards();

  return (
    <AppProviders>
      <DashboardLayout>
        <div className="fade-in">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold mb-1">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-muted mb-0">
                {getRoleDisplayName(user.role)}
                {user.department && ` • ${user.department.name}`}
              </p>
            </div>
            
            {canCreateComplaints(user.role) && (
              <Button
                as={Link}
                href="/complaints/create"
                variant="primary"
                size="lg"
                className="fw-semibold"
              >
                <FaPlus className="me-2" />
                File Complaint
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading dashboard...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <Row className="g-4 mb-4">
                {statsCards.map((card, index) => (
                  <Col key={index} sm={6} lg={4} xl={3}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="d-flex align-items-center">
                        <div className={`text-${card.color} me-3`}>
                          <card.icon size={32} />
                        </div>
                        <div className="flex-grow-1">
                          <h3 className="h4 fw-bold mb-1">
                            {formatNumber(card.value)}
                          </h3>
                          <p className="text-muted mb-0 small">
                            {card.title}
                          </p>
                        </div>
                        <Button
                          as={Link}
                          href={card.href}
                          variant="outline-secondary"
                          size="sm"
                          className="ms-2"
                        >
                          View
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row className="g-4">
                {/* Recent Complaints */}
                <Col lg={8}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <FaFileAlt className="me-2" />
                        Recent Complaints
                      </h5>
                      <Button
                        as={Link}
                        href="/complaints"
                        variant="outline-primary"
                        size="sm"
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {recentComplaints.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          <FaFileAlt size={32} className="mb-2 opacity-50" />
                          <p className="mb-0">No complaints found</p>
                          {canCreateComplaints(user.role) && (
                            <Button
                              as={Link}
                              href="/complaints/create"
                              variant="primary"
                              size="sm"
                              className="mt-2"
                            >
                              <FaPlus className="me-1" />
                              File Your First Complaint
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {recentComplaints.map((complaint) => (
                            <Link
                              key={complaint.id}
                              href={`/complaints/${complaint.id}`}
                              className="list-group-item list-group-item-action border-0"
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1 min-w-0">
                                  <h6 className="mb-1 text-truncate">
                                    {complaint.title}
                                  </h6>
                                  <p className="mb-1 text-muted small">
                                    {complaint.complaint_number} • {complaint.department_name}
                                  </p>
                                  <small className="text-muted">
                                    Created {new Date(complaint.created_at).toLocaleDateString()}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <Badge bg={complaint.status_color} className="mb-1">
                                    {complaint.status}
                                  </Badge>
                                  <br />
                                  <Badge bg={complaint.priority_color}>
                                    {complaint.priority}
                                  </Badge>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Recent Notifications */}
                <Col lg={4}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <FaBell className="me-2" />
                        Recent Notifications
                        {unreadCount > 0 && (
                          <Badge bg="danger" pill className="ms-2">
                            {unreadCount}
                          </Badge>
                        )}
                      </h5>
                      <Button
                        as={Link}
                        href="/notifications"
                        variant="outline-primary"
                        size="sm"
                      >
                        View All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {recentNotifications.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          <FaBell size={32} className="mb-2 opacity-50" />
                          <p className="mb-0">No notifications</p>
                        </div>
                      ) : (
                        <div className="list-group list-group-flush">
                          {recentNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`list-group-item border-0 ${
                                !notification.is_read ? 'bg-light' : ''
                              }`}
                            >
                              <div className="d-flex align-items-start">
                                <div className={`text-${notification.type_color} me-2 mt-1`}>
                                  <FaBell size={12} />
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                  <h6 className="mb-1 small text-truncate">
                                    {notification.title}
                                  </h6>
                                  <p className="mb-1 text-muted small text-truncate-2">
                                    {notification.message}
                                  </p>
                                  <small className="text-muted">
                                    {notification.time_since}
                                  </small>
                                </div>
                                {!notification.is_read && (
                                  <Badge bg="primary" pill>
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Quick Actions */}
              <Row className="mt-4">
                <Col>
                  <Card className="border-0 shadow-sm">
                    <Card.Header>
                      <h5 className="mb-0">Quick Actions</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        {canCreateComplaints(user.role) && (
                          <Col sm={6} md={4} lg={3}>
                            <Button
                              as={Link}
                              href="/complaints/create"
                              variant="outline-primary"
                              className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                            >
                              <FaPlus size={24} className="mb-2" />
                              File New Complaint
                            </Button>
                          </Col>
                        )}
                        
                        <Col sm={6} md={4} lg={3}>
                          <Button
                            as={Link}
                            href="/public/track"
                            variant="outline-secondary"
                            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                          >
                            <FaFileAlt size={24} className="mb-2" />
                            Track Complaint
                          </Button>
                        </Col>

                        {user.role === 'Student' && (
                          <Col sm={6} md={4} lg={3}>
                            <Button
                              as={Link}
                              href="/withdrawals/create"
                              variant="outline-warning"
                              className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                            >
                              <FaClipboardList size={24} className="mb-2" />
                              Withdrawal Request
                            </Button>
                          </Col>
                        )}

                        <Col sm={6} md={4} lg={3}>
                          <Button
                            as={Link}
                            href="/profile"
                            variant="outline-info"
                            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3"
                          >
                            <FaUsers size={24} className="mb-2" />
                            Update Profile
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </DashboardLayout>
    </AppProviders>
  );
};

export default DashboardPage;

