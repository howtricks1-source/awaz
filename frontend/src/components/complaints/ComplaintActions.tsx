'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useComplaintStore } from '@/store/useComplaintStore';
import { Complaint } from '@/types';

interface ComplaintActionsProps {
  complaint: Complaint;
}

export function ComplaintActions({ complaint }: ComplaintActionsProps) {
  const { user } = useAuthStore();
  const { updateComplaint, forwardComplaint } = useComplaintStore();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardRemarks, setForwardRemarks] = useState('');

  if (!user || user.role === 'Student') {
    return null;
  }

  const canUpdateStatus = user.role !== 'Student';
  const canForward = complaint.can_be_forwarded && user.role !== 'Student';

  const handleStatusUpdate = async () => {
    try {
      await updateComplaint(complaint.id, { status: newStatus as any });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleForward = async () => {
    if (!forwardTo) return;
    
    try {
      await forwardComplaint({
        complaint: complaint.id,
        to_user: parseInt(forwardTo),
        remarks: forwardRemarks.trim() || undefined,
      });
      setShowForwardModal(false);
      setForwardTo('');
      setForwardRemarks('');
    } catch (error) {
      console.error('Failed to forward complaint:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Status Update Button */}
      {canUpdateStatus && (
        <button
          onClick={() => setShowStatusModal(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update Status
        </button>
      )}

      {/* Forward Button */}
      {canForward && (
        <button
          onClick={() => setShowForwardModal(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Forward
        </button>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Complaint Status</h3>
              
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Not Resolved">Not Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Forward Complaint</h3>
              
              <div className="mb-4">
                <label htmlFor="forward-to" className="block text-sm font-medium text-gray-700 mb-2">
                  Forward To
                </label>
                <select
                  id="forward-to"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user...</option>
                  {/* This would be populated with available users from API */}
                  <option value="1">Department Head</option>
                  <option value="2">VC Office</option>
                  <option value="3">Admin</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  id="remarks"
                  value={forwardRemarks}
                  onChange={(e) => setForwardRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any remarks for forwarding..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowForwardModal(false);
                    setForwardTo('');
                    setForwardRemarks('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForward}
                  disabled={!forwardTo}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
