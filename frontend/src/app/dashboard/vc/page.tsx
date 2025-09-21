'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Table, Modal, Form, Alert, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { 
  FaUniversity, FaComments, FaClock, FaCheckCircle, FaBell, FaChartLine, 
  FaUserTie, FaForward, FaEdit, FaEye, FaFilter, FaDownload, FaSearch,
  FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaThumbsUp, FaThumbsDown,
  FaUsers, FaBuilding, FaStar, FaFileAlt
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
  department: {
    id: number;
    name: string;
  };
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

interface UniversityStats {
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  critical_complaints: number;
  total_departments: number;
  total_staff: number;
  total_students: number;
  avg_resolution_time: number;
  resolution_rate: number;
  satisfaction_rating: number;
}

interface Department {
  id: number;
  name: string;
  head: {
    full_name: string;
  };
  complaint_count: number;
  resolution_rate: number;
  avg_resolution_time: number;
}

const VCDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<UniversityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  
  // Form states
  const [forwardForm, setForwardForm] = useState({ to_user: '', remarks: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ action: '', response: '' });
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'VC') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
    fetchNotifications();
    fetchUsers();
    fetchDepartments();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all complaints (university-wide)
      const complaintsResponse = await api.get('/api/complaints/');
      setAllComplaints(complaintsResponse.data.results || complaintsResponse.data);
      
      // Fetch all withdrawal requests
      const withdrawalsResponse = await api.get('/api/withdrawals/');
      setWithdrawalRequests(withdrawalsResponse.data.results || withdrawalsResponse.data);
      
      // Fetch university statistics
      const statsResponse = await api.get('/api/analytics/system/');
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

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments/');
      setDepartments(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const filteredComplaints = allComplaints.filter(complaint => {
    const matchesStatus = !statusFilter || complaint.status === statusFilter;
    const matchesPriority = !priorityFilter || complaint.priority === priorityFilter;
    const matchesDepartment = !departmentFilter || complaint.department?.id.toString() === departmentFilter;
    const matchesSearch = !searchTerm || 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaint_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesDepartment && matchesSearch;
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
          <h2 className="mb-1">Vice Chancellor Dashboard</h2>
          <p className="text-muted mb-0">
            University-wide oversight and executive management
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
                  <FaUniversity size={24} />
                </div>
                <h4 className="mb-1">{stats.total_complaints}</h4>
                <small className="text-muted">Total Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-danger mb-2">
                  <FaExclamationTriangle size={24} />
                </div>
                <h4 className="mb-1">{stats.critical_complaints}</h4>
                <small className="text-muted">Critical Issues</small>
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
                <h4 className="mb-1">{stats.resolution_rate}%</h4>
                <small className="text-muted">Resolution Rate</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Executive Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-info mb-2">
                <FaBuilding size={24} />
              </div>
              <h4 className="mb-1">{stats?.total_departments || 0}</h4>
              <small className="text-muted">Departments</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-secondary mb-2">
                <FaUserTie size={24} />
              </div>
              <h4 className="mb-1">{stats?.total_staff || 0}</h4>
              <small className="text-muted">Staff Members</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-primary mb-2">
                <FaUsers size={24} />
              </div>
              <h4 className="mb-1">{stats?.total_students || 0}</h4>
              <small className="text-muted">Students</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-warning mb-2">
                <FaStar size={24} />
              </div>
              <h4 className="mb-1">{stats?.satisfaction_rating || 0}/5</h4>
              <small className="text-muted">Satisfaction</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Tab eventKey="overview" title={
              <span><FaChartLine className="me-2" />Executive Overview</span>
            } />
            <Tab eventKey="complaints" title={
              <span><FaComments className="me-2" />University Complaints</span>
            } />
            <Tab eventKey="departments" title={
              <span><FaBuilding className="me-2" />Department Performance</span>
            } />
            <Tab eventKey="withdrawals" title={
              <span><FaExclamationTriangle className="me-2" />Withdrawal Approvals</span>
            } />
            <Tab eventKey="analytics" title={
              <span><FaFileAlt className="me-2" />Analytics & Reports</span>
            } />
          </Tabs>
        </Card.Header>
        
        <Card.Body className="p-0">
          {activeTab === 'overview' && (
            <div className="p-4">
              <Row className="mb-4">
                <Col md={8}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Executive Dashboard</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <div className="p-3 bg-danger bg-opacity-10 rounded mb-3">
                            <h6 className="text-danger mb-2">Critical Actions Required</h6>
                            <p className="mb-1">Critical Complaints: <strong>{stats?.critical_complaints || 0}</strong></p>
                            <p className="mb-0">Avg Resolution Time: <strong>{stats?.avg_resolution_time || 0} hours</strong></p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-success bg-opacity-10 rounded mb-3">
                            <h6 className="text-success mb-2">Performance Metrics</h6>
                            <p className="mb-1">Resolution Rate: <strong>{stats?.resolution_rate || 0}%</strong></p>
                            <p className="mb-0">Satisfaction: <strong>{stats?.satisfaction_rating || 0}/5</strong></p>
                          </div>
                        </Col>
                      </Row>
                      <div className="text-center text-muted py-4">
                        <FaChartLine size={48} className="mb-3" />
                        <p>Executive analytics charts will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Quick Actions</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Button variant="outline-danger" onClick={() => setActiveTab('complaints')}>
                          <FaExclamationTriangle className="me-2" />
                          Review Critical Issues
                        </Button>
                        <Button variant="outline-primary" onClick={() => setActiveTab('departments')}>
                          <FaBuilding className="me-2" />
                          Department Overview
                        </Button>
                        <Button variant="outline-warning" onClick={() => setActiveTab('withdrawals')}>
                          <FaUserTie className="me-2" />
                          Pending Approvals
                        </Button>
                        <Button variant="outline-info" onClick={() => setActiveTab('analytics')}>
                          <FaFileAlt className="me-2" />
                          Generate Reports
                        </Button>
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
                  <Col md={2}>
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
                  <Col md={2}>
                    <Form.Select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4} className="text-end">
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
                  <p className="text-muted mb-0">University complaints will appear here</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Complaint #</th>
                      <th>Title</th>
                      <th>Student</th>
                      <th>Department</th>
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
                          <Badge bg="secondary">{complaint.department?.name}</Badge>
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

          {activeTab === 'departments' && (
            <div className="p-4">
              <h5 className="mb-3">Department Performance Overview</h5>
              {departments.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaBuilding size={48} />
                  </div>
                  <h6 className="text-muted">No departments found</h6>
                  <p className="text-muted mb-0">University departments will appear here</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Head</th>
                      <th>Complaints</th>
                      <th>Resolution Rate</th>
                      <th>Avg Resolution Time</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>
                          <div className="fw-medium">{dept.name}</div>
                        </td>
                        <td>
                          <div>{dept.head?.full_name || 'Not Assigned'}</div>
                        </td>
                        <td>
                          <Badge bg="info">{dept.complaint_count || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="success">{dept.resolution_rate || 0}%</Badge>
                        </td>
                        <td>
                          <small className="text-muted">{dept.avg_resolution_time || 0}h</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '100px', height: '8px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${dept.resolution_rate || 0}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{dept.resolution_rate || 0}%</small>
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
              <h5 className="mb-3">University Withdrawal Requests</h5>
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaExclamationTriangle size={48} />
                  </div>
                  <h6 className="text-muted">No withdrawal requests</h6>
                  <p className="text-muted mb-0">University withdrawal requests will appear here</p>
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

          {activeTab === 'analytics' && (
            <div className="p-4">
              <h5 className="mb-3">University Analytics & Reports</h5>
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Complaint Trends</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center text-muted py-4">
                        <FaChartLine size={48} className="mb-3" />
                        <p>Complaint trend charts will be displayed here</p>
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
                        <FaBuilding size={48} className="mb-3" />
                        <p>Department performance charts will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

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
                  <Form.Label>Executive Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={forwardForm.remarks}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Add executive remarks for forwarding..."
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
                  <Form.Label>Executive Decision</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={withdrawalForm.response}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, response: e.target.value }))}
                    placeholder={`Enter your executive ${withdrawalForm.action.toLowerCase()} decision...`}
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

export default VCDashboard;
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.critical_complaints || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.resolution_rate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/complaints?priority=Critical"
                  className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Critical Issues</p>
                    <p className="text-sm text-gray-600">Urgent complaints requiring attention</p>
                  </div>
                </a>

                <a
                  href="/complaints?status=Escalated"
                  className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Escalated Cases</p>
                    <p className="text-sm text-gray-600">Cases forwarded to VC office</p>
                  </div>
                </a>

                <a
                  href="/withdrawals?status=Pending"
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Withdrawal Approvals</p>
                    <p className="text-sm text-gray-600">Pending withdrawal requests</p>
                  </div>
                </a>

                <a
                  href="/analytics/university"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">University Analytics</p>
                    <p className="text-sm text-gray-600">Comprehensive performance reports</p>
                  </div>
                </a>

                <a
                  href="/feedback?rating=low"
                  className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Student Feedback</p>
                    <p className="text-sm text-gray-600">Review satisfaction ratings</p>
                  </div>
                </a>

                <a
                  href="/reports/executive"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Executive Reports</p>
                    <p className="text-sm text-gray-600">Monthly and quarterly reports</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Priorities</h2>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">Critical Response</h3>
                <p className="text-sm text-red-700">
                  Address critical complaints within 4 hours.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Strategic Oversight</h3>
                <p className="text-sm text-blue-700">
                  Monitor university-wide complaint trends.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Quality Assurance</h3>
                <p className="text-sm text-green-700">
                  Ensure high standards of resolution quality.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Policy Review</h3>
                <p className="text-sm text-purple-700">
                  Regular review of complaint handling policies.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent University Complaints */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent University Complaints</h2>
            <a
              href="/complaints"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </a>
          </div>
          
          {recentComplaints.length > 0 ? (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
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
                      {complaint.is_urgent && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          URGENT
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mt-1">{complaint.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {complaint.department_name} • Created by {complaint.created_by_name} • {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {complaint.priority === 'Critical' && (
                      <a
                        href={`/complaints/${complaint.id}/escalate`}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Review
                      </a>
                    )}
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
              <p className="text-gray-500">No recent complaints</p>
              <p className="text-sm text-gray-400 mt-1">
                University complaints will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
