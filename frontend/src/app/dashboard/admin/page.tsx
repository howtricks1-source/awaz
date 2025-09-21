'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Table, Modal, Form, Alert, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { 
  FaCog, FaUsers, FaComments, FaClock, FaCheckCircle, FaBell, FaChartLine, 
  FaUserPlus, FaForward, FaEdit, FaEye, FaFilter, FaDownload, FaSearch,
  FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaThumbsUp, FaThumbsDown,
  FaBuilding, FaStar, FaFileAlt, FaDatabase, FaServer, FaShieldAlt, FaTrash
} from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/lib/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department: {
    id: number;
    name: string;
  } | null;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  head: {
    full_name: string;
  } | null;
  user_count: number;
  complaint_count: number;
  created_at: string;
}

interface SystemStats {
  total_users: number;
  total_complaints: number;
  total_departments: number;
  active_users: number;
  pending_complaints: number;
  resolved_complaints: number;
  system_health: number;
  storage_usage: number;
}

interface ActivityLog {
  id: number;
  user: {
    full_name: string;
    role: string;
  };
  action: string;
  related_item: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    role: 'Student',
    department: '',
    password: ''
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    head: ''
  });
  
  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      router.push('/auth/login');
      return;
    }
    
    fetchDashboardData();
    fetchNotifications();
    fetchUsers();
    fetchDepartments();
    fetchActivityLogs();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch system statistics
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
      setAllUsers(response.data.results || response.data);
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

  const fetchActivityLogs = async () => {
    try {
      const response = await api.get('/api/activity-logs/', {
        params: { limit: 10, ordering: '-timestamp' }
      });
      setActivityLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/api/auth/users/', userForm);
      setShowUserModal(false);
      setUserForm({ full_name: '', email: '', role: 'Student', department: '', password: '' });
      fetchUsers();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await api.patch(`/api/auth/users/${selectedUser.id}/`, {
        full_name: userForm.full_name,
        email: userForm.email,
        role: userForm.role,
        department: userForm.department,
        is_active: selectedUser.is_active
      });
      setShowUserModal(false);
      setSelectedUser(null);
      setUserForm({ full_name: '', email: '', role: 'Student', department: '', password: '' });
      fetchUsers();
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/api/auth/users/${userId}/`);
      fetchUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await api.post('/api/departments/', departmentForm);
      setShowDepartmentModal(false);
      setDepartmentForm({ name: '', head: '' });
      fetchDepartments();
      alert('Department created successfully!');
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Error creating department. Please try again.');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      await api.patch(`/api/departments/${selectedDepartment.id}/`, departmentForm);
      setShowDepartmentModal(false);
      setSelectedDepartment(null);
      setDepartmentForm({ name: '', head: '' });
      fetchDepartments();
      alert('Department updated successfully!');
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Error updating department. Please try again.');
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await api.delete(`/api/departments/${departmentId}/`);
      fetchDepartments();
      alert('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department. Please try again.');
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    const matchesDepartment = !userDepartmentFilter || u.department?.id.toString() === userDepartmentFilter;
    const matchesSearch = !userSearchTerm || 
      u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    return matchesRole && matchesDepartment && matchesSearch;
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
          <h2 className="mb-1">System Administrator Dashboard</h2>
          <p className="text-muted mb-0">
            Complete system management and administration
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
                  <FaUsers size={24} />
                </div>
                <h4 className="mb-1">{stats.total_users}</h4>
                <small className="text-muted">Total Users</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-info mb-2">
                  <FaComments size={24} />
                </div>
                <h4 className="mb-1">{stats.total_complaints}</h4>
                <small className="text-muted">System Complaints</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-secondary mb-2">
                  <FaBuilding size={24} />
                </div>
                <h4 className="mb-1">{stats.total_departments}</h4>
                <small className="text-muted">Departments</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <div className="text-success mb-2">
                  <FaServer size={24} />
                </div>
                <h4 className="mb-1">{stats.system_health}%</h4>
                <small className="text-muted">System Health</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* System Status Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-success mb-2">
                <FaCheckCircle size={24} />
              </div>
              <h4 className="mb-1">{stats?.active_users || 0}</h4>
              <small className="text-muted">Active Users</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-warning mb-2">
                <FaClock size={24} />
              </div>
              <h4 className="mb-1">{stats?.pending_complaints || 0}</h4>
              <small className="text-muted">Pending Issues</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-info mb-2">
                <FaDatabase size={24} />
              </div>
              <h4 className="mb-1">{stats?.storage_usage || 0}%</h4>
              <small className="text-muted">Storage Usage</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="text-primary mb-2">
                <FaShieldAlt size={24} />
              </div>
              <h4 className="mb-1">Secure</h4>
              <small className="text-muted">System Status</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Tab eventKey="overview" title={
              <span><FaChartLine className="me-2" />System Overview</span>
            } />
            <Tab eventKey="users" title={
              <span><FaUsers className="me-2" />User Management</span>
            } />
            <Tab eventKey="departments" title={
              <span><FaBuilding className="me-2" />Department Management</span>
            } />
            <Tab eventKey="logs" title={
              <span><FaFileAlt className="me-2" />Activity Logs</span>
            } />
            <Tab eventKey="settings" title={
              <span><FaCog className="me-2" />System Settings</span>
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
                      <h6 className="mb-0">System Health Monitor</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <div className="p-3 bg-success bg-opacity-10 rounded mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-success mb-0">Database</h6>
                              <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                            </div>
                            <small className="text-muted">Online • 99.9% uptime</small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-success bg-opacity-10 rounded mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-success mb-0">API Services</h6>
                              <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                            </div>
                            <small className="text-muted">All services operational</small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-success bg-opacity-10 rounded mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-success mb-0">File Storage</h6>
                              <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                            </div>
                            <small className="text-muted">{stats?.storage_usage || 0}% capacity • Healthy</small>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="p-3 bg-warning bg-opacity-10 rounded mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="text-warning mb-0">Notifications</h6>
                              <div className="bg-warning rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                            </div>
                            <small className="text-muted">Minor delays • Investigating</small>
                          </div>
                        </Col>
                      </Row>
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
                        <Button variant="outline-primary" onClick={() => setActiveTab('users')}>
                          <FaUsers className="me-2" />
                          Manage Users
                        </Button>
                        <Button variant="outline-secondary" onClick={() => setActiveTab('departments')}>
                          <FaBuilding className="me-2" />
                          Manage Departments
                        </Button>
                        <Button variant="outline-info" onClick={() => setActiveTab('logs')}>
                          <FaFileAlt className="me-2" />
                          View Activity Logs
                        </Button>
                        <Button variant="outline-warning" onClick={() => setActiveTab('settings')}>
                          <FaCog className="me-2" />
                          System Settings
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {activeTab === 'users' && (
            <>
              {/* User Management Header */}
              <div className="p-3 border-bottom bg-light">
                <Row className="g-3 align-items-center">
                  <Col md={3}>
                    <Form.Control
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                      <option value="DepartmentHead">Department Head</option>
                      <option value="VC">VC</option>
                      <option value="Admin">Admin</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={userDepartmentFilter}
                      onChange={(e) => setUserDepartmentFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5} className="text-end">
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        setSelectedUser(null);
                        setUserForm({ full_name: '', email: '', role: 'Student', department: '', password: '' });
                        setShowUserModal(true);
                      }}
                    >
                      <FaUserPlus className="me-2" />
                      Add User
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaUsers size={48} />
                  </div>
                  <h6 className="text-muted">No users found</h6>
                  <p className="text-muted mb-0">System users will appear here</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-medium">{u.full_name}</div>
                        </td>
                        <td>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td>
                          <Badge bg="secondary">{u.role}</Badge>
                        </td>
                        <td>
                          <small className="text-muted">{u.department?.name || 'N/A'}</small>
                        </td>
                        <td>
                          <Badge bg={u.is_active ? 'success' : 'danger'}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(u.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserForm({
                                  full_name: u.full_name,
                                  email: u.email,
                                  role: u.role,
                                  department: u.department?.id.toString() || '',
                                  password: ''
                                });
                                setShowUserModal(true);
                              }}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              <FaTrash />
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
            <>
              {/* Department Management Header */}
              <div className="p-3 border-bottom bg-light">
                <Row className="g-3 align-items-center">
                  <Col md={8}>
                    <h5 className="mb-0">Department Management</h5>
                  </Col>
                  <Col md={4} className="text-end">
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        setSelectedDepartment(null);
                        setDepartmentForm({ name: '', head: '' });
                        setShowDepartmentModal(true);
                      }}
                    >
                      <FaBuilding className="me-2" />
                      Add Department
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Departments Table */}
              {departments.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaBuilding size={48} />
                  </div>
                  <h6 className="text-muted">No departments found</h6>
                  <p className="text-muted mb-0">System departments will appear here</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Department Name</th>
                      <th>Head</th>
                      <th>Users</th>
                      <th>Complaints</th>
                      <th>Created</th>
                      <th>Actions</th>
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
                          <Badge bg="info">{dept.user_count || 0}</Badge>
                        </td>
                        <td>
                          <Badge bg="secondary">{dept.complaint_count || 0}</Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(dept.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedDepartment(dept);
                                setDepartmentForm({
                                  name: dept.name,
                                  head: dept.head?.full_name || ''
                                });
                                setShowDepartmentModal(true);
                              }}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteDepartment(dept.id)}
                            >
                              <FaTrash />
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

          {activeTab === 'logs' && (
            <div className="p-4">
              <h5 className="mb-3">System Activity Logs</h5>
              {activityLogs.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <FaFileAlt size={48} />
                  </div>
                  <h6 className="text-muted">No activity logs</h6>
                  <p className="text-muted mb-0">System activity logs will appear here</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Related Item</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div>{log.user.full_name}</div>
                          <small className="text-muted">{log.user.role}</small>
                        </td>
                        <td>
                          <Badge bg="info">{log.action}</Badge>
                        </td>
                        <td>
                          <small className="text-muted">{log.related_item}</small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4">
              <h5 className="mb-3">System Settings</h5>
              <Row>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">General Settings</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center text-muted py-4">
                        <FaCog size={48} className="mb-3" />
                        <p>System configuration settings will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header>
                      <h6 className="mb-0">Security Settings</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center text-muted py-4">
                        <FaShieldAlt size={48} className="mb-3" />
                        <p>Security configuration settings will be displayed here</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedUser ? 'Edit User' : 'Add New User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    required
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Staff</option>
                    <option value="DepartmentHead">Department Head</option>
                    <option value="VC">VC</option>
                    <option value="Admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={userForm.department}
                    onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {!selectedUser && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required={!selectedUser}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={selectedUser ? handleUpdateUser : handleCreateUser}
            disabled={!userForm.full_name || !userForm.email || (!selectedUser && !userForm.password)}
          >
            {selectedUser ? 'Update User' : 'Create User'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Department Modal */}
      <Modal show={showDepartmentModal} onHide={() => setShowDepartmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedDepartment ? 'Edit Department' : 'Add New Department'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department Head</Form.Label>
              <Form.Select
                value={departmentForm.head}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, head: e.target.value }))}
              >
                <option value="">Select Department Head</option>
                {allUsers.filter(u => u.role === 'DepartmentHead').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDepartmentModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={selectedDepartment ? handleUpdateDepartment : handleCreateDepartment}
            disabled={!departmentForm.name}
          >
            {selectedDepartment ? 'Update Department' : 'Create Department'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_complaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_departments || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Administration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/admin/users"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">User Management</p>
                    <p className="text-sm text-gray-600">Manage users, roles, and permissions</p>
                  </div>
                </a>

                <a
                  href="/admin/departments"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Department Management</p>
                    <p className="text-sm text-gray-600">Manage departments and structure</p>
                  </div>
                </a>

                <a
                  href="/admin/complaints"
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Complaint Administration</p>
                    <p className="text-sm text-gray-600">Full complaint system management</p>
                  </div>
                </a>

                <a
                  href="/admin/withdrawals"
                  className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Withdrawal Management</p>
                    <p className="text-sm text-gray-600">Manage all withdrawal requests</p>
                  </div>
                </a>

                <a
                  href="/admin/analytics"
                  className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">System Analytics</p>
                    <p className="text-sm text-gray-600">Comprehensive system reports</p>
                  </div>
                </a>

                <a
                  href="/admin/logs"
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Activity Logs</p>
                    <p className="text-sm text-gray-600">System activity and audit trails</p>
                  </div>
                </a>

                <a
                  href="/admin/settings"
                  className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">System Settings</p>
                    <p className="text-sm text-gray-600">Configure system parameters</p>
                  </div>
                </a>

                <a
                  href="/admin/backup"
                  className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Backup & Recovery</p>
                    <p className="text-sm text-gray-600">System backup and restore</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-green-900">Database</h3>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Online • 99.9% uptime
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-green-900">API Services</h3>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All services operational
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-green-900">File Storage</h3>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  85% capacity • Healthy
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-yellow-900">Notifications</h3>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Minor delays • Investigating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
            <a
              href="/admin/logs"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All Logs →
            </a>
          </div>
          
          {systemComplaints.length > 0 ? (
            <div className="space-y-4">
              {systemComplaints.map((complaint) => (
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
                    <a
                      href={`/admin/complaints/${complaint.id}`}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Manage
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No recent system activity</p>
              <p className="text-sm text-gray-400 mt-1">
                System activity will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
