'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Table, Modal, Form, Alert, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { 
  FaUser, FaComments, FaClock, FaCheckCircle, FaBell, FaChartLine, 
  FaReply, FaForward, FaEdit, FaEye, FaFilter, FaDownload, FaSearch,
  FaExclamationTriangle, FaInfoCircle, FaQuestionCircle
} from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/lib/api';

interface Complaint {
  id: number;
  complaint_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  created_by: {
    id: number;
    full_name: string;
    email: string;
  };
  department: string;
  assigned_to: number | null;
  can_receive_feedback: boolean;
}

interface WithdrawalRequest {
  id: number;
  request_number: string;
  type: string;
  reason: string;
  status: string;
  submitted_by: {
    full_name: string;
    email: string;
  };
  created_at: string;
}

interface DashboardStats {
  assigned_complaints: number;
  pending_responses: number;
  resolved_today: number;
  department_complaints: number;
  withdrawal_requests: number;
}

const StaffDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints');
  
  // Modal states
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  
  // Form states
  const [responseForm, setResponseForm] = useState({ message: '', attachment: null });
  const [forwardForm, setForwardForm] = useState({ to_user: '', remarks: '' });
  const [commentForm, setCommentForm] = useState({ comment_type: 'Comment', text: '' });
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'Staff') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
    fetchNotifications();
    fetchUsers();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned complaints
      const complaintsResponse = await api.get('/api/complaints/', {
        params: { assigned_to: user?.id }
      });
      setAssignedComplaints(complaintsResponse.data.results || complaintsResponse.data);
      
      // Fetch withdrawal requests for department
      const withdrawalsResponse = await api.get('/api/withdrawals/', {
        params: { department: user?.department?.id }
      });
      setWithdrawalRequests(withdrawalsResponse.data.results || withdrawalsResponse.data);
      
      // Fetch statistics
      const statsResponse = await api.get('/api/analytics/dashboard/');
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users/');
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddResponse = async () => {
    if (!selectedComplaint) return;
    
    try {
      await api.post(`/api/complaints/${selectedComplaint.id}/add_response/`, {
        message: responseForm.message,
        attachment: responseForm.attachment
      });
      
      setShowResponseModal(false);
      setResponseForm({ message: '', attachment: null });
      fetchDashboardData();
      alert('Response added successfully!');
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Error adding response. Please try again.');
    }
  };

  const handleForwardComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      await api.post(`/api/complaints/${selectedComplaint.id}/forward/`, {
        to_user: forwardForm.to_user,
        remarks: forwardForm.remarks
      });
      
      setShowForwardModal(false);
      setForwardForm({ to_user: '', remarks: '' });
      fetchDashboardData();
      alert('Complaint forwarded successfully!');
    } catch (error) {
      console.error('Error forwarding complaint:', error);
      alert('Error forwarding complaint. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!selectedComplaint) return;
    
    try {
      await api.post(`/api/complaints/${selectedComplaint.id}/comments/`, {
        comment_type: commentForm.comment_type,
        text: commentForm.text
      });
      
      setShowCommentModal(false);
      setCommentForm({ comment_type: 'Comment', text: '' });
      fetchDashboardData();
      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    }
  };

  const handleStatusChange = async (complaintId: number, newStatus: string) => {
    try {
      await api.patch(`/api/complaints/${complaintId}/`, { status: newStatus });
      fetchDashboardData();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
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

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'Comment': return <FaComments className="text-primary" />;
      case 'Require Info': return <FaInfoCircle className="text-warning" />;
      case 'Ask': return <FaQuestionCircle className="text-info" />;
      default: return <FaComments />;
    }
  };

  const filteredComplaints = assignedComplaints.filter(complaint => {
    const matchesStatus = !statusFilter || complaint.status === statusFilter;
    const matchesPriority = !priorityFilter || complaint.priority === priorityFilter;
    const matchesSearch = !searchTerm || 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaint_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Staff Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {user?.first_name}! Manage your assigned complaints.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => router.push('/notifications')}>
            <FaBell className="me-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">{unreadCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-primary mb-2">
                  <FaUser size={24} />
                </div>
                <h4 className="mb-1">{stats.assigned_complaints}</h4>
                <small className="text-muted">Assigned to Me</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-warning mb-2">
                  <FaClock size={24} />
                </div>
                <h4 className="mb-1">{stats.pending_responses}</h4>
                <small className="text-muted">Pending Response</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-success mb-2">
                  <FaCheckCircle size={24} />
                </div>
                <h4 className="mb-1">{stats.resolved_today}</h4>
                <small className="text-muted">Resolved Today</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-info mb-2">
                  <FaChartLine size={24} />
                </div>
                <h4 className="mb-1">{stats.department_complaints}</h4>
                <small className="text-muted">Department Total</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Tabs */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'complaints')}>
            <Tab eventKey="complaints" title={
              <span><FaComments className="me-2" />Assigned Complaints</span>
            } />
            <Tab eventKey="withdrawals" title={
              <span><FaExclamationTriangle className="me-2" />Withdrawal Requests</span>
            } />
          </Tabs>
        </Card.Header>
        
        <Card.Body className="p-0">
          {activeTab === 'complaints' && (
            <>
              {/* Filters */}
              <div className="p-3 border-bottom bg-light">
                <Row className="g-3">
                  <Col md={3}>
                    <Form.Control
                      type="text"
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Closed">Closed</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="">All Priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </Form.Select>
                  </Col>
                  <Col md={5} className="text-end">
                    <Button variant="outline-primary" size="sm" className="me-2">
                      <FaFilter className="me-1" />
                      Advanced Filters
                    </Button>
                    <Button variant="outline-success" size="sm">
                      <FaDownload className="me-1" />
                      Export
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Complaints Table */}
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaComments size={48} />
                  </div>
                  <h6 className="text-muted">No complaints assigned</h6>
                  <p className="text-muted mb-0">Complaints assigned to you will appear here</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Complaint #</th>
                      <th>Title</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>
                          <code className="text-primary">{complaint.complaint_number}</code>
                        </td>
                        <td>
                          <div className="fw-medium">{complaint.title}</div>
                          <small className="text-muted">
                            {complaint.description.substring(0, 50)}...
                          </small>
                        </td>
                        <td>
                          <div>{complaint.created_by.full_name}</div>
                          <small className="text-muted">{complaint.created_by.email}</small>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant={getStatusBadgeVariant(complaint.status)} 
                              size="sm"
                            >
                              {complaint.status}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleStatusChange(complaint.id, 'In Progress')}>
                                In Progress
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(complaint.id, 'Resolved')}>
                                Resolved
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(complaint.id, 'Rejected')}>
                                Rejected
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                        <td>
                          <Badge bg={getPriorityBadgeVariant(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </td>
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
                              onClick={() => router.push(`/complaints/${complaint.id}`)}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowResponseModal(true);
                              }}
                            >
                              <FaReply />
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowCommentModal(true);
                              }}
                            >
                              <FaComments />
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowForwardModal(true);
                              }}
                            >
                              <FaForward />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'withdrawals' && (
            <div className="p-4">
              <h5 className="mb-3">Withdrawal Requests Review</h5>
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaExclamationTriangle size={48} />
                  </div>
                  <h6 className="text-muted">No withdrawal requests</h6>
                  <p className="text-muted mb-0">Withdrawal requests for your department will appear here</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Request #</th>
                      <th>Student</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <code className="text-primary">{request.request_number}</code>
                        </td>
                        <td>
                          <div>{request.submitted_by.full_name}</div>
                          <small className="text-muted">{request.submitted_by.email}</small>
                        </td>
                        <td>{request.type}</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(request.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => router.push(`/withdrawals/${request.id}`)}
                          >
                            <FaEye />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Response</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <Alert variant="info">
                <strong>Complaint:</strong> {selectedComplaint.complaint_number} - {selectedComplaint.title}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Response Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={responseForm.message}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your response to the complaint..."
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Attachment (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      setResponseForm(prev => ({ ...prev, attachment: file || null }));
                    }}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddResponse}
            disabled={!responseForm.message.trim()}
          >
            Add Response
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Forward Modal */}
      <Modal show={showForwardModal} onHide={() => setShowForwardModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Forward Complaint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <Alert variant="info">
                <strong>Complaint:</strong> {selectedComplaint.complaint_number} - {selectedComplaint.title}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Forward To</Form.Label>
                  <Form.Select
                    value={forwardForm.to_user}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, to_user: e.target.value }))}
                    required
                  >
                    <option value="">Select user...</option>
                    {users.filter(u => u.role !== 'Student' && u.id !== user?.id).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role}) - {u.department?.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={forwardForm.remarks}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Add remarks for forwarding..."
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForwardModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleForwardComplaint}
            disabled={!forwardForm.to_user}
          >
            Forward Complaint
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comment Modal */}
      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <Alert variant="info">
                <strong>Complaint:</strong> {selectedComplaint.complaint_number} - {selectedComplaint.title}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Comment Type</Form.Label>
                  <Form.Select
                    value={commentForm.comment_type}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, comment_type: e.target.value }))}
                  >
                    <option value="Comment">Comment</option>
                    <option value="Require Info">Require Info</option>
                    <option value="Ask">Ask</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {commentForm.comment_type === 'Require Info' && 'Student can reply to this'}
                    {commentForm.comment_type === 'Ask' && 'Student can reply to this'}
                    {commentForm.comment_type === 'Comment' && 'Student cannot reply to this'}
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Comment Text</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={commentForm.text}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your comment..."
                    required
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddComment}
            disabled={!commentForm.text.trim()}
          >
            Add Comment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffDashboard;
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'Staff') {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Staff Dashboard 👨‍💼
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your assigned complaints and tasks
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.assigned_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.resolved_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Withdrawal Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_withdrawals || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/complaints?assigned_to_me=true"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">My Assigned Complaints</p>
                    <p className="text-sm text-gray-600">View and manage assigned complaints</p>
                  </div>
                </a>

                <a
                  href="/withdrawals"
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Withdrawal Requests</p>
                    <p className="text-sm text-gray-600">Review withdrawal requests</p>
                  </div>
                </a>

                <a
                  href="/complaints?status=Pending"
                  className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Pending Complaints</p>
                    <p className="text-sm text-gray-600">View all pending complaints</p>
                  </div>
                </a>

                <a
                  href="/feedback"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">View Feedback</p>
                    <p className="text-sm text-gray-600">Review student feedback</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Guidelines</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Response Time</h3>
                <p className="text-sm text-blue-700">
                  Respond to assigned complaints within 24 hours.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Comment Types</h3>
                <p className="text-sm text-green-700">
                  Use "Require Info" when you need more details from students.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Escalation</h3>
                <p className="text-sm text-purple-700">
                  Forward complex issues to Department Head or VC.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Assigned Complaints */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recently Assigned Complaints</h2>
            <a
              href="/complaints?assigned_to_me=true"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </a>
          </div>
          
          {assignedComplaints.length > 0 ? (
            <div className="space-y-4">
              {assignedComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-gray-500">
                        {complaint.complaint_number}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${complaint.status_color}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${complaint.priority_color}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mt-1">{complaint.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {complaint.department_name} • {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={`/complaints/${complaint.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Manage →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No complaints assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Assigned complaints will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
