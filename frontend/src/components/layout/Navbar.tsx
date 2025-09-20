'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Navbar as BootstrapNavbar, 
  Nav, 
  NavDropdown, 
  Container, 
  Badge,
  Button,
  Offcanvas
} from 'react-bootstrap';
import { 
  FaBell, 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun,
  FaBars,
  FaHome,
  FaFileAlt,
  FaUsers,
  FaChartBar
} from 'react-icons/fa';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getRoleDisplayName, canViewAnalytics, canManageUsers } from '@/utils';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: FaHome,
      roles: ['Student', 'Staff', 'DepartmentHead', 'VC', 'Admin'],
    },
    {
      label: 'Complaints',
      href: '/complaints',
      icon: FaFileAlt,
      roles: ['Student', 'Staff', 'DepartmentHead', 'VC', 'Admin'],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: FaChartBar,
      roles: ['DepartmentHead', 'VC', 'Admin'],
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: FaUsers,
      roles: ['Admin'],
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (!user) return null;

  return (
    <>
      <BootstrapNavbar 
        bg={theme} 
        variant={theme} 
        expand="lg" 
        fixed="top" 
        className="shadow-sm"
      >
        <Container fluid>
          {/* Brand */}
          <BootstrapNavbar.Brand as={Link} href="/dashboard" className="fw-bold">
            <span className="text-primary">Hamari</span> Awaz
          </BootstrapNavbar.Brand>

          {/* Mobile menu toggle */}
          <Button
            variant="outline-secondary"
            className="d-lg-none"
            onClick={() => setShowOffcanvas(true)}
          >
            <FaBars />
          </Button>

          {/* Desktop Navigation */}
          <BootstrapNavbar.Collapse id="navbar-nav" className="d-none d-lg-flex">
            <Nav className="me-auto">
              {visibleMenuItems.map((item) => (
                <Nav.Link
                  key={item.href}
                  as={Link}
                  href={item.href}
                  className="d-flex align-items-center"
                >
                  <item.icon className="me-2" />
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>

            <Nav className="align-items-center">
              {/* Theme Toggle */}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={toggleTheme}
                className="me-3"
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </Button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Menu */}
              <NavDropdown
                title={
                  <span className="d-flex align-items-center">
                    <FaUser className="me-2" />
                    {user.first_name} {user.last_name}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Header>
                  <div className="fw-bold">{user.first_name} {user.last_name}</div>
                  <small className="text-muted">{getRoleDisplayName(user.role)}</small>
                  {user.department && (
                    <small className="text-muted d-block">{user.department.name}</small>
                  )}
                </NavDropdown.Header>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} href="/profile">
                  <FaUser className="me-2" />
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/profile/settings">
                  <FaCog className="me-2" />
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement="start"
        className={`bg-${theme}`}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <span className="text-primary">Hamari</span> Awaz
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {visibleMenuItems.map((item) => (
              <Nav.Link
                key={item.href}
                as={Link}
                href={item.href}
                className="d-flex align-items-center py-3"
                onClick={() => setShowOffcanvas(false)}
              >
                <item.icon className="me-3" />
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          <hr />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Theme</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </Button>
          </div>

          <div className="mt-auto pt-4">
            <div className="d-flex align-items-center mb-3">
              <FaUser className="me-2" />
              <div>
                <div className="fw-bold">{user.first_name} {user.last_name}</div>
                <small className="text-muted">{getRoleDisplayName(user.role)}</small>
              </div>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleLogout}
              className="w-100"
            >
              <FaSignOutAlt className="me-2" />
              Logout
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Navbar;

