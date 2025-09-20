'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner,
  Badge,
  Timeline
} from 'react-bootstrap';
import { FaSearch, FaArrowLeft, FaFileAlt, FaClock, FaUser, FaBuilding } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { Complaint } from '@/types';
import { getErrorMessage } from '@/utils';
import AppProviders from '@/components/providers/AppProviders';

const schema = yup.object({
  complaintNumber: yup.string().required('Complaint number is required'),
});

interface TrackForm {
  complaintNumber: string;
}

const TrackComplaintPage: React.FC = () => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: TrackForm) => {
    try {
      setLoading(true);
      setError('');
      setComplaint(null);

      // API call to track complaint
      const response = await fetch(`/api/complaints/track/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaint_number: data.complaintNumber }),
      });

      if (!response.ok) {
        throw new Error('Complaint not found');
      }

      const complaintData = await response.json();
      setComplaint(complaintData);
      toast.success('Complaint found!');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Resolved': 'success',
      'Rejected': 'danger',
      'Not Resolved': 'secondary',
      'Closed': 'dark',
    };
    return colors[status] || 'secondary';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'Low': 'success',
      'Medium': 'warning',
      'High': 'danger',
      'Critical': 'dark',
    };
    return colors[priority] || 'secondary';
  };

  return (
    <AppProviders>
      <div className="min-vh-100 bg-light py-4">
        <Container>
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <div className="text-center mb-4">
                <Link href="/" className="btn btn-outline-secondary mb-3">
                  <FaArrowLeft className="me-2" />
                  Back to Home
                </Link>
                <h1 className="h3 fw-bold">
                  <span className="text-primary">Hamari</span> Awaz
                </h1>
                <p className="text-muted">
                  <FaSearch className="me-2" />
                  Track Your Complaint
                </p>
              </div>

              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="align-items-end">
                      <Col md={8}>
                        <Form.Group className="mb-3 mb-md-0">
                          <Form.Label>
                            <FaFileAlt className="me-2" />
                            Complaint Number
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter complaint number (e.g., AWA-2024-0001)"
                            {...register('complaintNumber')}
                            isInvalid={!!errors.complaintNumber}
                            disabled={isSubmitting || loading}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.complaintNumber?.message}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            Enter the complaint number you received when filing your complaint
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-100"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting || loading ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                className="me-2"
                              />
                              Searching...
                            </>
                          ) : (
                            <>
                              <FaSearch className="me-2" />
                              Track Complaint
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>

              {error && (
                <Alert variant="danger" className="mb-4">
                  <strong>Error:</strong> {error}
                </Alert>
              )}

              {complaint && (
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <FaFileAlt className="me-2" />
                      Complaint Details
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="mb-4">
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Complaint Number:</strong>
                          <div className="text-primary fw-bold">{complaint.complaint_number}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Title:</strong>
                          <div>{complaint.title}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Status:</strong>
                          <div>
                            <Badge bg={getStatusColor(complaint.status)} className="ms-2">
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Priority:</strong>
                          <div>
                            <Badge bg={getPriorityColor(complaint.priority)} className="ms-2">
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <strong>
                            <FaClock className="me-1" />
                            Filed On:
                          </strong>
                          <div>{new Date(complaint.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="mb-3">
                          <strong>
                            <FaBuilding className="me-1" />
                            Department:
                          </strong>
                          <div>{complaint.department?.name || 'N/A'}</div>
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-4">
                      <strong>Description:</strong>
                      <div className="mt-2 p-3 bg-light rounded">
                        {complaint.description}
                      </div>
                    </div>

                    {complaint.assigned_to && (
                      <div className="mb-4">
                        <strong>
                          <FaUser className="me-1" />
                          Assigned To:
                        </strong>
                        <div className="mt-2">
                          {complaint.assigned_to.first_name} {complaint.assigned_to.last_name}
                          <Badge bg="info" className="ms-2">
                            {complaint.assigned_to.role}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {complaint.responses && complaint.responses.length > 0 && (
                      <div className="mb-4">
                        <strong>Recent Updates:</strong>
                        <div className="mt-3">
                          {complaint.responses.slice(0, 3).map((response, index) => (
                            <div key={index} className="border-start border-primary ps-3 mb-3">
                              <div className="small text-muted">
                                {new Date(response.created_at).toLocaleDateString()} - {response.added_by.first_name} {response.added_by.last_name}
                              </div>
                              <div className="mt-1">{response.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Alert variant="info" className="mb-0">
                      <strong>Note:</strong> For detailed information and to interact with your complaint, 
                      please <Link href="/auth/login" className="alert-link">login to your account</Link>.
                    </Alert>
                  </Card.Body>
                </Card>
              )}

              <div className="text-center mt-4">
                <p className="text-muted mb-3">
                  Don't have the complaint number? Need to file a new complaint?
                </p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button as={Link} href="/auth/login" variant="outline-primary">
                    Login to Account
                  </Button>
                  <Button as={Link} href="/auth/register" variant="primary">
                    Register as Student
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </AppProviders>
  );
};

export default TrackComplaintPage;
