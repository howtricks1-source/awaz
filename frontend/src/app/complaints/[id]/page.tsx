'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useComplaintStore } from '@/store/useComplaintStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { ComplaintComments } from '@/components/complaints/ComplaintComments';
import { ComplaintActions } from '@/components/complaints/ComplaintActions';

export default function ComplaintDetail() {
  const params = useParams();
  const complaintId = parseInt(params.id as string);
  const { user } = useAuthStore();
  const { 
    currentComplaint, 
    timeline, 
    comments, 
    loading, 
    error, 
    fetchComplaint, 
    fetchTimeline, 
    fetchComments 
  } = useComplaintStore();

  const [activeTab, setActiveTab] = useState<'timeline' | 'comments'>('timeline');

  useEffect(() => {
    if (complaintId) {
      fetchComplaint(complaintId);
      fetchTimeline(complaintId);
      fetchComments(complaintId);
    }
  }, [complaintId, fetchComplaint, fetchTimeline, fetchComments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentComplaint) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-red-900 mb-2">Complaint Not Found</h2>
            <p className="text-red-700">{error || 'The complaint you are looking for does not exist or you do not have permission to view it.'}</p>
            <a
              href="/complaints"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Complaints
            </a>
          </div>
        </div>
      </div>
    );
  }

  const canTakeActions = user && (
    user.role !== 'Student' || 
    (user.role === 'Student' && currentComplaint.created_by.id === user.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <a href="/complaints" className="hover:text-gray-700">Complaints</a>
            <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{currentComplaint.complaint_number}</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentComplaint.title}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-mono text-gray-500">
                  {currentComplaint.complaint_number}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${currentComplaint.status_color}`}>
                  {currentComplaint.status}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${currentComplaint.priority_color}`}>
                  {currentComplaint.priority}
                </span>
                {currentComplaint.is_urgent && (
                  <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                    Urgent
                  </span>
                )}
                {currentComplaint.is_anonymous && (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                    Anonymous
                  </span>
                )}
              </div>
            </div>
            
            {canTakeActions && (
              <ComplaintActions complaint={currentComplaint} />
            )}
          </div>
        </div>

        {/* Complaint Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                <p className="text-gray-900">{currentComplaint.department_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created By</h3>
                <p className="text-gray-900">
                  {currentComplaint.is_anonymous ? 'Anonymous' : currentComplaint.created_by_name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Created Date</h3>
                <p className="text-gray-900">
                  {new Date(currentComplaint.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {currentComplaint.assigned_to && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                  <p className="text-gray-900">{currentComplaint.assigned_to_name}</p>
                </div>
              )}
              {currentComplaint.expected_resolution_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Expected Resolution</h3>
                  <p className="text-gray-900">
                    {new Date(currentComplaint.expected_resolution_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {currentComplaint.resolved_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Resolved Date</h3>
                  <p className="text-gray-900">
                    {new Date(currentComplaint.resolved_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">{currentComplaint.description}</p>
              </div>
            </div>

            {currentComplaint.attachment && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Attachment</h3>
                <a
                  href={currentComplaint.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  View Attachment
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Timeline
                {timeline.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {timeline.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comments & Replies
                {comments.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {comments.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'timeline' && (
              <ComplaintTimeline 
                timeline={timeline} 
                complaintId={complaintId}
              />
            )}
            {activeTab === 'comments' && (
              <ComplaintComments 
                comments={comments} 
                complaintId={complaintId}
                complaint={currentComplaint}
              />
            )}
          </div>
        </div>

        {/* Feedback Section */}
        {currentComplaint.can_receive_feedback && user?.role === 'Student' && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              📝 Provide Feedback
            </h3>
            <p className="text-blue-800 mb-4">
              Your complaint has been resolved. Please share your feedback to help us improve our services.
            </p>
            <a
              href={`/feedback/create?complaint=${complaintId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Feedback
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
