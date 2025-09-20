'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { analyticsApi, complaintApi } from '@/lib/api';
import { DashboardStats, Complaint } from '@/types';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemComplaints, setSystemComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await analyticsApi.getDashboardStats();
        setStats(statsResponse.data);
        
        // Fetch all system complaints
        const complaintsResponse = await complaintApi.getComplaints({ 
          limit: 10,
          ordering: '-created_at' 
        });
        setSystemComplaints(complaintsResponse.data.results);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'Admin') {
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
            System Administrator Dashboard ⚙️
          </h1>
          <p className="text-gray-600 mt-2">
            Complete system management, user administration, and technical oversight
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
