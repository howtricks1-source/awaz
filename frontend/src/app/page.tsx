'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { FaFileAlt, FaUsers, FaChartBar, FaShieldAlt } from 'react-icons/fa';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
      <div className="min-vh-100 bg-light">
        {/* Hero Section */}
        <section className="bg-primary text-white py-5">
          <Container>
            <Row className="align-items-center min-vh-100">
              <Col lg={6}>
                <h1 className="display-4 fw-bold mb-4">
                  <span className="text-warning">Hamari</span> Awaz
                </h1>
                <p className="lead mb-4">
                  Your voice matters. A comprehensive complaint management system 
                  designed to ensure every concern is heard, tracked, and resolved efficiently.
                </p>
                <p className="mb-4">
                  Streamline the complaint process, enhance transparency, and build 
                  trust within your educational institution.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Button 
                    as={Link} 
                    href="/auth/login" 
                    variant="warning" 
                    size="lg"
                    className="fw-semibold"
                  >
                    Login to Your Account
                  </Button>
                  <Button 
                    as={Link} 
                    href="/auth/register" 
                    variant="outline-light" 
                    size="lg"
                  >
                    Register as Student
                  </Button>
                </div>
              </Col>
              <Col lg={6} className="text-center">
                <div className="bg-white bg-opacity-10 rounded-3 p-4">
                  <FaFileAlt size={120} className="text-warning mb-3" />
                  <h3>Complaint Management Made Simple</h3>
                  <p>Submit, track, and resolve complaints with ease</p>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-5">
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="display-5 fw-bold mb-3">Why Choose Hamari Awaz?</h2>
                <p className="lead text-muted">
                  Built specifically for educational institutions with features that matter
                </p>
              </Col>
            </Row>
            
            <Row className="g-4">
              <Col md={6} lg={3}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <FaFileAlt size={48} className="text-primary mb-3" />
                    <h5>Easy Complaint Filing</h5>
                    <p className="text-muted">
                      Submit complaints quickly with our intuitive interface. 
                      Attach files and track progress in real-time.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} lg={3}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <FaUsers size={48} className="text-success mb-3" />
                    <h5>Role-Based Access</h5>
                    <p className="text-muted">
                      Different dashboards for students, staff, department heads, 
                      and administrators with appropriate permissions.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} lg={3}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <FaChartBar size={48} className="text-warning mb-3" />
                    <h5>Analytics & Reports</h5>
                    <p className="text-muted">
                      Comprehensive analytics and reporting tools to track 
                      performance and identify improvement areas.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} lg={3}>
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <FaShieldAlt size={48} className="text-danger mb-3" />
                    <h5>Secure & Private</h5>
                    <p className="text-muted">
                      Enterprise-grade security with role-based permissions 
                      and complete audit trails for compliance.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Public Tracking Section */}
        <section className="py-5 bg-white">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8} className="text-center">
                <h2 className="fw-bold mb-4">Track Your Complaint</h2>
                <p className="lead text-muted mb-4">
                  Already submitted a complaint? Track its progress using your complaint number.
                </p>
                <Button 
                  as={Link} 
                  href="/public/track" 
                  variant="primary" 
                  size="lg"
                  className="fw-semibold"
                >
                  Track Complaint Status
                </Button>
              </Col>
            </Row>
          </Container>
        </section>

        {/* How It Works Section */}
        <section className="py-5 bg-light">
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="display-5 fw-bold mb-3">How It Works</h2>
                <p className="lead text-muted">
                  Simple steps to get your concerns addressed
                </p>
              </Col>
            </Row>
            
            <Row className="g-4">
              <Col md={4} className="text-center">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <span className="fw-bold fs-4">1</span>
                </div>
                <h5>Submit Complaint</h5>
                <p className="text-muted">
                  Register and submit your complaint with detailed description and attachments.
                </p>
              </Col>
              
              <Col md={4} className="text-center">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <span className="fw-bold fs-4">2</span>
                </div>
                <h5>Track Progress</h5>
                <p className="text-muted">
                  Monitor your complaint status and receive notifications on updates.
                </p>
              </Col>
              
              <Col md={4} className="text-center">
                <div className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                  <span className="fw-bold fs-4">3</span>
                </div>
                <h5>Get Resolution</h5>
                <p className="text-muted">
                  Receive resolution and provide feedback to help us improve our services.
                </p>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Footer */}
        <footer className="bg-dark text-white py-4">
          <Container>
            <Row className="align-items-center">
              <Col md={6}>
                <h5 className="mb-0">
                  <span className="text-warning">Hamari</span> Awaz
                </h5>
                <p className="mb-0 text-muted">
                  Empowering voices, ensuring accountability
                </p>
              </Col>
              <Col md={6} className="text-md-end">
                <p className="mb-0 text-muted">
                  © 2024 Hamari Awaz. All rights reserved.
                </p>
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
  );
};

export default LandingPage;
