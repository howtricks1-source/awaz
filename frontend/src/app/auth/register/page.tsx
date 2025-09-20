'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaGraduationCap } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/authStore';
import { RegisterForm } from '@/types';
import { getErrorMessage } from '@/utils';
import AppProviders from '@/components/providers/AppProviders';

const schema = yup.object({
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  studentId: yup.string().required('Student ID is required'),
  phone: yup.string().optional(),
});

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      await registerUser(data);
      toast.success('Registration successful! Please login to continue.');
      router.push('/auth/login');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Redirecting...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <AppProviders>
      <div className="min-vh-100 bg-light d-flex align-items-center py-4">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <div className="text-center mb-4">
                <Link href="/" className="btn btn-outline-secondary mb-3">
                  <FaArrowLeft className="me-2" />
                  Back to Home
                </Link>
                <h1 className="h3 fw-bold">
                  <span className="text-primary">Hamari</span> Awaz
                </h1>
                <p className="text-muted">
                  <FaGraduationCap className="me-2" />
                  Student Registration
                </p>
              </div>

              <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                  {error && (
                    <Alert variant="danger" className="mb-4">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaUser className="me-2" />
                            First Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter your first name"
                            {...register('firstName')}
                            isInvalid={!!errors.firstName}
                            disabled={isSubmitting}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.firstName?.message}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter your last name"
                            {...register('lastName')}
                            isInvalid={!!errors.lastName}
                            disabled={isSubmitting}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.lastName?.message}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaUser className="me-2" />
                        Username
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Choose a username"
                        {...register('username')}
                        isInvalid={!!errors.username}
                        disabled={isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaEnvelope className="me-2" />
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email address"
                        {...register('email')}
                        isInvalid={!!errors.email}
                        disabled={isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaGraduationCap className="me-2" />
                        Student ID
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your student ID"
                        {...register('studentId')}
                        isInvalid={!!errors.studentId}
                        disabled={isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.studentId?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number (Optional)</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter your phone number"
                        {...register('phone')}
                        isInvalid={!!errors.phone}
                        disabled={isSubmitting}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaLock className="me-2" />
                        Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          {...register('password')}
                          isInvalid={!!errors.password}
                          disabled={isSubmitting}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                          style={{ zIndex: 10 }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.password?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaLock className="me-2" />
                        Confirm Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          {...register('confirmPassword')}
                          isInvalid={!!errors.confirmPassword}
                          disabled={isSubmitting}
                        />
                        <Button
                          variant="link"
                          className="position-absolute end-0 top-50 translate-middle-y border-0 text-muted"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isSubmitting}
                          style={{ zIndex: 10 }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100 fw-semibold"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            className="me-2"
                          />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </Form>

                  <hr className="my-4" />

                  <div className="text-center">
                    <p className="mb-2 text-muted">Already have an account?</p>
                    <Button
                      as={Link}
                      href="/auth/login"
                      variant="outline-primary"
                      className="w-100"
                    >
                      Sign In
                    </Button>
                  </div>

                  <div className="text-center mt-3">
                    <Link
                      href="/public/track"
                      className="text-decoration-none text-muted"
                    >
                      Track complaint without login
                    </Link>
                  </div>
                </Card.Body>
              </Card>

              <div className="text-center mt-4">
                <small className="text-muted">
                  By creating an account, you agree to our terms of service and privacy policy.
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </AppProviders>
  );
};

export default RegisterPage;
