'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Table, Modal, Form, Alert, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { 
  FaUsers, FaComments, FaClock, FaCheckCircle, FaBell, FaChartLine, 
  FaUserPlus, FaForward, FaEdit, FaEye, FaFilter, FaDownload, FaSearch,
  FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaThumbsUp, FaThumbsDown
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

interface DepartmentStats {
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  staff_count: number;
  withdrawal_requests: number;
  feedback_count: number;
  avg_resolution_time: number;
}

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
  assigned_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
}

const DepartmentHeadDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  
  const [departmentComplaints, setDepartmentComplaints] = useState<Complaint[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  
  // Form states
  const [assignForm, setAssignForm] = useState({ staff_id: '', remarks: '' });
  const [forwardForm, setForwardForm] = useState({ to_user: '', remarks: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ action: '', response: '' });
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'DepartmentHead') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
    fetchNotifications();
    fetchUsers();
    fetchStaffMembers();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch department complaints
      const complaintsResponse = await api.get('/api/complaints/', {
        params: { department: user?.department?.id }
      });
      setDepartmentComplaints(complaintsResponse.data.results || complaintsResponse.data);
      
      // Fetch withdrawal requests for department
      const withdrawalsResponse = await api.get('/api/withdrawals/', {
        params: { department: user?.department?.id }
      });
      setWithdrawalRequests(withdrawalsResponse.data.results || withdrawalsResponse.data);
      
      // Fetch department statistics
      const statsResponse = await api.get('/api/analytics/departments/', {
        params: { department_id: user?.department?.id }
      });
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

  const fetchStaffMembers = async () => {
    try {
      const response = await api.get('/api/auth/users/', {
        params: { 
          role: 'Staff',
          department: user?.department?.id 
        }
      });
      setStaffMembers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const handleAssignComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      await api.patch(`/api/complaints/${selectedComplaint.id}/`, {
        assigned_to: assignForm.staff_id
      });
      
      // Add activity log
      await api.post('/api/complaints/activity/', {
        complaint: selectedComplaint.id,
        action: 'assigned',
        remarks: assignForm.remarks
      });
      
      setShowAssignModal(false);
      setAssignForm({ staff_id: '', remarks: '' });
      fetchDashboardData();
      alert('Complaint assigned successfully!');
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Error assigning complaint. Please try again.');
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

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal) return;
    
    try {
      await api.patch(`/api/withdrawals/${selectedWithdrawal.id}/`, {
        status: withdrawalForm.action,
        response: withdrawalForm.response,
        reviewed_by: user?.id
      });
      
      setShowWithdrawalModal(false);
      setWithdrawalForm({ action: '', response: '' });
      fetchDashboardData();
      alert(`Withdrawal request ${withdrawalForm.action.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      alert('Error processing withdrawal request. Please try again.');
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

  const filteredComplaints = departmentComplaints.filter(complaint => {
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
          <h2 className="mb-1">Department Head Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back, {user?.first_name}! Manage {user?.department?.name} department.
          </p>
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
                  <FaComments size={24} />
                </div>
                <h4 className="mb-1">{stats.total_complaints}</h4>
                <small className="text-muted">Total Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-warning mb-2">
                  <FaClock size={24} />
                </div>
                <h4 className="mb-1">{stats.pending_complaints}</h4>
                <small className="text-muted">Pending</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-success mb-2">
                  <FaCheckCircle size={24} />
                </div>
                <h4 className="mb-1">{stats.resolved_complaints}</h4>
                <small className="text-muted">Resolved</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-info mb-2">
                  <FaUsers size={24} />
                </div>
                <h4 className="mb-1">{stats.staff_count}</h4>
                <small className="text-muted">Staff Members</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content Tabs */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Tab eventKey="overview" title={
              <span><FaChartLine className="me-2" />Overview</span>
            } />
            <Tab eventKey="complaints" title={
              <span><FaComments className="me-2" />Department Complaints</span>
            } />
            <Tab eventKey="staff" title={
              <span><FaUsers className="me-2" />Staff Management</span>
            } />
            <Tab eventKey="withdrawals" title={
              <span><FaExclamationTriangle className="me-2" />Withdrawal Requests</span>
            } />
          </Tabs>
        </Card.Header>
        
        <Card.Body className="p-0">
          {activeTab === 'overview' && (
            <div className="p-4">
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Recent Activity</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center text-muted py-4">
                        <FaChartLine size={48} className="mb-3" />
                        <p>Activity charts will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Department Performance</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center text-muted py-4">
                        <FaUsers size={48} className="mb-3" />
                        <p>Performance metrics will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

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
                  <h6 className="text-muted">No complaints found</h6>
                  <p className="text-muted mb-0">Department complaints will appear here</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Complaint #</th>
                      <th>Title</th>
                      <th>Student</th>
                      <th>Assigned To</th>
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
                          {complaint.assigned_to ? (
                            <Badge bg="info">Assigned</Badge>
                          ) : (
                            <Badge bg="warning">Unassigned</Badge>
                          )}
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
                                setShowAssignModal(true);
                              }}
                            >
                              <FaUserPlus />
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

          {activeTab === 'staff' && (
            <div className="p-4">
              <h5 className="mb-3">Staff Management</h5>
              {staffMembers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaUsers size={48} />
                  </div>
                  <h6 className="text-muted">No staff members</h6>
                  <p className="text-muted mb-0">Staff members in your department will appear here</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Assigned</th>
                      <th>Resolved</th>
                      <th>Pending</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.map((staff) => (
                      <tr key={staff.id}>
                        <td>
                          <div>{staff.full_name}</div>
                          <small className="text-muted">{staff.email}</small>
                        </td>
                        <td>
                          <Badge bg="info">{staff.assigned_complaints || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="success">{staff.resolved_complaints || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="warning">{staff.pending_complaints || 0}</Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '100px', height: '8px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ 
                                  width: `${((staff.resolved_complaints || 0) / Math.max(staff.assigned_complaints || 1, 1)) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <small className="text-muted">
                              {Math.round(((staff.resolved_complaints || 0) / Math.max(staff.assigned_complaints || 1, 1)) * 100)}%
                            </small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="p-4">
              <h5 className="mb-3">Withdrawal Requests</h5>
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
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => router.push(`/withdrawals/${request.id}`)}
                            >
                              <FaEye />
                            </Button>
                            {request.status === 'Pending' && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWithdrawal(request);
                                    setWithdrawalForm({ action: 'Approved', response: '' });
                                    setShowWithdrawalModal(true);
                                  }}
                                >
                                  <FaThumbsUp />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWithdrawal(request);
                                    setWithdrawalForm({ action: 'Rejected', response: '' });
                                    setShowWithdrawalModal(true);
                                  }}
                                >
                                  <FaThumbsDown />
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Assign Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Complaint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <Alert variant="info">
                <strong>Complaint:</strong> {selectedComplaint.complaint_number} - {selectedComplaint.title}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Assign To Staff</Form.Label>
                  <Form.Select
                    value={assignForm.staff_id}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, staff_id: e.target.value }))}
                    required
                  >
                    <option value="">Select staff member...</option>
                    {staffMembers.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} - {staff.assigned_complaints || 0} assigned
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Assignment Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={assignForm.remarks}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Add remarks for assignment..."
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignComplaint}
            disabled={!assignForm.staff_id}
          >
            Assign Complaint
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
                  <Form.Label>Forwarding Remarks</Form.Label>
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

      {/* Withdrawal Action Modal */}
      <Modal show={showWithdrawalModal} onHide={() => setShowWithdrawalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {withdrawalForm.action === 'Approved' ? 'Approve' : 'Reject'} Withdrawal Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWithdrawal && (
            <>
              <Alert variant={withdrawalForm.action === 'Approved' ? 'success' : 'danger'}>
                <strong>Request:</strong> {selectedWithdrawal.request_number} - {selectedWithdrawal.type}
                <br />
                <strong>Student:</strong> {selectedWithdrawal.submitted_by.full_name}
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Response Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={withdrawalForm.response}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, response: e.target.value }))}
                    placeholder={`Enter your ${withdrawalForm.action.toLowerCase()} message...`}
                    required
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWithdrawalModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={withdrawalForm.action === 'Approved' ? 'success' : 'danger'}
            onClick={handleWithdrawalAction}
            disabled={!withdrawalForm.response.trim()}
          >
            {withdrawalForm.action === 'Approved' ? 'Approve' : 'Reject'} Request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DepartmentHeadDashboard;
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Department Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.department_complaints || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
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
                <p className="text-sm font-medium text-gray-600">Resolved This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.resolved_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Department Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.department_staff || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/complaints?department=mine"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Department Complaints</p>
                    <p className="text-sm text-gray-600">View all department complaints</p>
                  </div>
                </a>

                <a
                  href="/complaints/assign"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Assign Complaints</p>
                    <p className="text-sm text-gray-600">Assign complaints to staff</p>
                  </div>
                </a>

                <a
                  href="/withdrawals?department=mine"
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
                  href="/analytics/department"
                  className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Department Analytics</p>
                    <p className="text-sm text-gray-600">View performance metrics</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Guidelines</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Assignment Policy</h3>
                <p className="text-sm text-blue-700">
                  Assign complaints to appropriate staff within 24 hours.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Quality Control</h3>
                <p className="text-sm text-green-700">
                  Review all resolved complaints before closure.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Escalation</h3>
                <p className="text-sm text-purple-700">
                  Forward complex issues to VC when necessary.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Department Complaints */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Department Complaints</h2>
            <a
              href="/complaints?department=mine"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </a>
          </div>
          
          {departmentComplaints.length > 0 ? (
            <div className="space-y-4">
              {departmentComplaints.map((complaint) => (
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
                      Created by {complaint.created_by_name} • {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/complaints/${complaint.id}/assign`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Assign
                    </a>
                    <a
                      href={`/complaints/${complaint.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">No department complaints yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Department complaints will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
