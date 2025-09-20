'use client';

import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Button, 
  Form, 
  InputGroup,
  Dropdown,
  Spinner,
  Pagination,
  Alert
} from 'react-bootstrap';
import { 
  FaFileAlt, 
  FaSearch, 
  FaFilter, 
  FaPlus, 
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useComplaintStore } from '@/store/complaintStore';
import { 
  formatDate, 
  getStatusColor, 
  getPriorityColor, 
  canCreateComplaints,
  truncateText 
} from '@/utils';
import { ComplaintStatus, ComplaintPriority } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppProviders from '@/components/providers/AppProviders';

const ComplaintsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { 
    complaints, 
    isLoading, 
    pagination, 
    filters,
    fetchComplaints,
    setFilters,
    clearFilters
  } = useComplaintStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Set initial filters from URL params
    const initialFilters: any = {};
    if (searchParams.get('status')) {
      initialFilters.status = searchParams.get('status');
    }
    if (searchParams.get('priority')) {
      initialFilters.priority = searchParams.get('priority');
    }
    if (searchParams.get('assigned_to_me')) {
      initialFilters.assigned_to_me = searchParams.get('assigned_to_me') === 'true';
    }
    
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, [searchParams, setFilters]);

  useEffect(() => {
    fetchComplaints(currentPage);
  }, [fetchComplaints, currentPage, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Apply sorting logic here
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="ms-1" />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="ms-1" /> : 
      <FaSortDown className="ms-1" />;
  };

  const getPageNumbers = () => {
    const totalPages = Math.ceil(pagination.count / 10);
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (!user) return null;

  const statusOptions: ComplaintStatus[] = [
    'Pending', 'In Progress', 'Resolved', 'Rejected', 'Not Resolved', 'Closed'
  ];

  const priorityOptions: ComplaintPriority[] = [
    'Low', 'Medium', 'High', 'Critical'
  ];

  return (
    <AppProviders>
      <DashboardLayout>
        <div className="fade-in">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 fw-bold mb-1">
                <FaFileAlt className="me-2" />
                Complaints
              </h1>
              <p className="text-muted mb-0">
                {user.role === 'Student' ? 'Your complaints' : 'Manage complaints'}
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

          <Card className="border-0 shadow-sm">
            {/* Filters */}
            <Card.Header className="bg-white">
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form onSubmit={handleSearch}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Search complaints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button type="submit" variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </InputGroup>
                  </Form>
                </Col>
                
                <Col md={2}>
                  <Form.Select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  >
                    <option value="">All Status</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Col>
                
                <Col md={2}>
                  <Form.Select
                    value={filters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  >
                    <option value="">All Priority</option>
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </Form.Select>
                </Col>

                {(user.role === 'Staff' || user.role === 'DepartmentHead' || user.role === 'VC' || user.role === 'Admin') && (
                  <Col md={2}>
                    <Form.Check
                      type="checkbox"
                      label="Assigned to me"
                      checked={filters.assigned_to_me || false}
                      onChange={(e) => handleFilterChange('assigned_to_me', e.target.checked || undefined)}
                    />
                  </Col>
                )}
                
                <Col md={2}>
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="w-100"
                  >
                    <FaFilter className="me-1" />
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-0">
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading complaints...</span>
                  </Spinner>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-5">
                  <FaFileAlt size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No complaints found</h5>
                  <p className="text-muted mb-3">
                    {Object.keys(filters).length > 0 
                      ? 'Try adjusting your filters or search terms.'
                      : 'No complaints have been filed yet.'
                    }
                  </p>
                  {canCreateComplaints(user.role) && (
                    <Button
                      as={Link}
                      href="/complaints/create"
                      variant="primary"
                    >
                      <FaPlus className="me-2" />
                      File Your First Complaint
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th 
                            className="cursor-pointer user-select-none"
                            onClick={() => handleSort('complaint_number')}
                          >
                            Complaint # {getSortIcon('complaint_number')}
                          </th>
                          <th 
                            className="cursor-pointer user-select-none"
                            onClick={() => handleSort('title')}
                          >
                            Title {getSortIcon('title')}
                          </th>
                          <th>Department</th>
                          <th 
                            className="cursor-pointer user-select-none"
                            onClick={() => handleSort('status')}
                          >
                            Status {getSortIcon('status')}
                          </th>
                          <th 
                            className="cursor-pointer user-select-none"
                            onClick={() => handleSort('priority')}
                          >
                            Priority {getSortIcon('priority')}
                          </th>
                          <th 
                            className="cursor-pointer user-select-none"
                            onClick={() => handleSort('created_at')}
                          >
                            Created {getSortIcon('created_at')}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.map((complaint) => (
                          <tr key={complaint.id}>
                            <td>
                              <Link
                                href={`/complaints/${complaint.id}`}
                                className="text-decoration-none fw-semibold"
                              >
                                {complaint.complaint_number}
                              </Link>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {truncateText(complaint.title, 50)}
                                </div>
                                {complaint.is_urgent && (
                                  <Badge bg="danger" className="mt-1">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {complaint.department_name}
                              </small>
                            </td>
                            <td>
                              <Badge bg={getStatusColor(complaint.status)}>
                                {complaint.status}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={getPriorityColor(complaint.priority)}>
                                {complaint.priority}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(complaint.created_at)}
                              </small>
                            </td>
                            <td>
                              <Button
                                as={Link}
                                href={`/complaints/${complaint.id}`}
                                variant="outline-primary"
                                size="sm"
                              >
                                <FaEye className="me-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination.count > 10 && (
                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                      <div className="text-muted">
                        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.count)} of {pagination.count} complaints
                      </div>
                      
                      <Pagination className="mb-0">
                        <Pagination.Prev
                          disabled={!pagination.previous}
                          onClick={() => handlePageChange(currentPage - 1)}
                        />
                        
                        {getPageNumbers().map(page => (
                          <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        ))}
                        
                        <Pagination.Next
                          disabled={!pagination.next}
                          onClick={() => handlePageChange(currentPage + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </DashboardLayout>
    </AppProviders>
  );
};

export default ComplaintsPage;

