'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaEye, FaComments, FaStar, FaBell, FaChartLine, FaFileAlt, FaClock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface Complaint {
  id: number;
  complaint_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  department: string;
  can_receive_feedback: boolean;
}

interface DashboardStats {
  my_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  my_withdrawals: number;
  unread_notifications: number;
}

const StudentDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    feedback_text: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'Student') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
    fetchNotifications();
  }, [user, router, fetchNotifications]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints
      const complaintsResponse = await api.get('/complaints/');
      setComplaints(complaintsResponse.data.results || complaintsResponse.data);
      
      // Fetch dashboard statistics
      const statsResponse = await api.get('/analytics/dashboard/');
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileComplaint = () => {
    router.push('/complaints/create');
  };

  const handleViewComplaint = (complaint: Complaint) => {
    router.push(`/complaints/${complaint.id}`);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedComplaint) return;
    
    try {
      await api.post('/complaints/feedback/', {
        complaint: selectedComplaint.id,
        rating: feedbackForm.rating,
        feedback_text: feedbackForm.feedback_text
      });
      
      setShowFeedbackModal(false);
      setFeedbackForm({ rating: 5, feedback_text: '' });
      fetchDashboardData(); // Refresh data
      
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback. Please try again.');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved': return 'success';
      case 'Rejected': return 'danger';
      case 'Closed': return 'dark';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'danger';
      case 'Critical': return 'dark';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-primary">
            <FaFileAlt className="me-2" />
            Student Dashboard
          </h2>
          <p className="text-muted mb-0">Welcome back, {user?.first_name} {user?.last_name}!</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => router.push('/notifications')}>
            <FaBell className="me-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">{unreadCount}</Badge>
            )}
          </Button>
          <Button variant="primary" onClick={handleFileComplaint}>
            <FaPlus className="me-2" />
            File New Complaint
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-primary mb-2">
                  <FaFileAlt size={32} />
                </div>
                <h3 className="mb-1 text-primary">{stats.my_complaints || 0}</h3>
                <small className="text-muted">My Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-warning mb-2">
                  <FaClock size={32} />
                </div>
                <h3 className="mb-1 text-warning">{stats.pending_complaints || 0}</h3>
                <small className="text-muted">Pending</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-info mb-2">
                  <FaExclamationTriangle size={32} />
                </div>
                <h3 className="mb-1 text-info">{stats.in_progress_complaints || 0}</h3>
                <small className="text-muted">In Progress</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-success mb-2">
                  <FaCheckCircle size={32} />
                </div>
                <h3 className="mb-1 text-success">{stats.resolved_complaints || 0}</h3>
                <small className="text-muted">Resolved</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Recent Complaints */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My Complaints</h5>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => router.push('/complaints')}
            >
              View All
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {complaints.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <FaComments size={48} />
              </div>
              <h6 className="text-muted">No complaints filed yet</h6>
              <p className="text-muted mb-3">File your first complaint to get started</p>
              <Button variant="primary" onClick={handleFileComplaint}>
                <FaPlus className="me-2" />
                File Complaint
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Complaint #</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 10).map((complaint) => (
                  <tr key={complaint.id}>
                    <td>
                      <code className="text-primary">{complaint.complaint_number}</code>
                    </td>
                    <td>
                      <div className="fw-medium">{complaint.title}</div>
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getPriorityBadgeVariant(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </td>
                    <td>{complaint.department}</td>
                    <td>
                      <small className="text-muted">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <FaEye />
                        </Button>
                        {complaint.can_receive_feedback && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowFeedbackModal(true);
                            }}
                          >
                            <FaStar />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="shadow-sm mt-4">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0">Recent Notifications</h5>
          </Card.Header>
          <Card.Body>
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="d-flex align-items-start mb-3">
                <div className={`badge bg-${notification.type_color} me-3 mt-1`}>
                  <i className={notification.type_icon}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-medium">{notification.title}</div>
                  <div className="text-muted small">{notification.message}</div>
                  <div className="text-muted small">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Feedback Modal */}
      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <Alert variant="info">
                <strong>Complaint:</strong> {selectedComplaint.complaint_number} - {selectedComplaint.title}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Rating</Form.Label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant={feedbackForm.rating >= star ? "warning" : "outline-warning"}
                        size="sm"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                      >
                        <FaStar />
                      </Button>
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    {feedbackForm.rating} star{feedbackForm.rating !== 1 ? 's' : ''}
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Feedback</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={feedbackForm.feedback_text}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback_text: e.target.value }))}
                    placeholder="Please share your experience with the complaint resolution..."
                    required
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitFeedback}
            disabled={!feedbackForm.feedback_text.trim()}
          >
            Submit Feedback
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default StudentDashboard;
