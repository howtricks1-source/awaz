'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar as BSNavbar, Nav, NavDropdown, Container, Badge, Button } from 'react-bootstrap';
import { FaBell, FaUser, FaCog, FaSignOutAlt, FaMoon, FaSun, FaHome, FaFileAlt, FaUsers, FaChartBar } from 'react-icons/fa';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const { theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Student': return 'Student';
      case 'Staff': return 'Staff Member';
      case 'DepartmentHead': return 'Department Head';
      case 'VC': return 'Vice Chancellor';
      case 'Admin': return 'Administrator';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Student': return 'primary';
      case 'Staff': return 'success';
      case 'DepartmentHead': return 'warning';
      case 'VC': return 'danger';
      case 'Admin': return 'dark';
      default: return 'secondary';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { href: '/dashboard', label: 'Dashboard', icon: FaHome },
    ];

    switch (user.role) {
      case 'Student':
        return [
          ...baseItems,
          { href: '/complaints', label: 'My Complaints', icon: FaFileAlt },
          { href: '/complaints/create', label: 'File Complaint', icon: FaFileAlt },
          { href: '/withdrawals', label: 'Withdrawals', icon: FaFileAlt },
        ];
      case 'Staff':
        return [
          ...baseItems,
          { href: '/complaints', label: 'Complaints', icon: FaFileAlt },
          { href: '/withdrawals', label: 'Withdrawals', icon: FaFileAlt },
        ];
      case 'DepartmentHead':
        return [
          ...baseItems,
          { href: '/complaints', label: 'Complaints', icon: FaFileAlt },
          { href: '/withdrawals', label: 'Withdrawals', icon: FaFileAlt },
          { href: '/analytics', label: 'Analytics', icon: FaChartBar },
        ];
      case 'VC':
      case 'Admin':
        return [
          ...baseItems,
          { href: '/complaints', label: 'Complaints', icon: FaFileAlt },
          { href: '/withdrawals', label: 'Withdrawals', icon: FaFileAlt },
          { href: '/analytics', label: 'Analytics', icon: FaChartBar },
          { href: '/admin/users', label: 'Users', icon: FaUsers },
        ];
      default:
        return baseItems;
    }
  };

  return (
    <BSNavbar bg="light" expand="lg" fixed="top" className="shadow-sm border-bottom">
      <Container fluid>
        {/* Brand */}
        <BSNavbar.Brand as={Link} href="/dashboard" className="d-flex align-items-center">
          <div className="bg-primary rounded-3 p-2 me-2">
            <FaFileAlt className="text-white" size={20} />
          </div>
          <span className="fw-bold fs-4 text-primary">Hamari Awaz</span>
        </BSNavbar.Brand>

        <BSNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)}
        />
        
        <BSNavbar.Collapse id="basic-navbar-nav" in={expanded}>
          {/* Navigation Links */}
          <Nav className="me-auto">
            {getNavigationItems().map((item) => (
              <Nav.Link 
                key={item.href}
                as={Link} 
                href={item.href}
                className="d-flex align-items-center"
                onClick={() => setExpanded(false)}
              >
                <item.icon className="me-2" size={16} />
                {item.label}
              </Nav.Link>
            ))}
          </Nav>

          {/* Right side items */}
          <Nav className="d-flex align-items-center">
            {/* Theme Toggle */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              className="me-2 d-flex align-items-center"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FaMoon size={14} /> : <FaSun size={14} />}
            </Button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <NavDropdown
              title={
                <div className="d-flex align-items-center">
                  <div className="bg-secondary rounded-circle p-2 me-2">
                    <FaUser className="text-white" size={14} />
                  </div>
                  <div className="d-none d-md-block">
                    <div className="fw-semibold">{user.first_name} {user.last_name}</div>
                    <Badge bg={getRoleColor(user.role)} className="small">
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </div>
              }
              id="user-nav-dropdown"
              align="end"
            >
              <NavDropdown.Header>
                <div className="text-center">
                  <div className="fw-bold">{user.first_name} {user.last_name}</div>
                  <div className="text-muted small">{user.email}</div>
                  <Badge bg={getRoleColor(user.role)} className="mt-1">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  {user.department && (
                    <div className="text-muted small mt-1">{user.department.name}</div>
                  )}
                </div>
              </NavDropdown.Header>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item as={Link} href="/profile">
                <FaUser className="me-2" />
                Profile Settings
              </NavDropdown.Item>
              
              <NavDropdown.Item as={Link} href="/notifications">
                <FaBell className="me-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge bg="danger" className="ms-2">{unreadCount}</Badge>
                )}
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              
              <NavDropdown.Item onClick={logout} className="text-danger">
                <FaSignOutAlt className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}
