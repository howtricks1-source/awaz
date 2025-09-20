'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useComplaintStore } from '@/store/useComplaintStore';
import { ComplaintFeedbackCreate } from '@/types';

export default function CreateFeedback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintId = searchParams.get('complaint');
  
  const { submitFeedback, currentComplaint, fetchComplaint, loading, error, clearError } = useComplaintStore();
  const [formData, setFormData] = useState<ComplaintFeedbackCreate>({
    complaint: parseInt(complaintId || '0'),
    feedback_text: '',
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (complaintId) {
      fetchComplaint(parseInt(complaintId));
      setFormData(prev => ({ ...prev, complaint: parseInt(complaintId) }));
    }
  }, [complaintId, fetchComplaint]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.feedback_text.trim()) {
      alert('Please provide your feedback');
      return;
    }

    if (!formData.complaint) {
      alert('Invalid complaint ID');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(formData);
      
      // Redirect back to complaint detail page
      router.push(`/complaints/${formData.complaint}`);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Very Dissatisfied';
      case 2: return 'Dissatisfied';
      case 3: return 'Neutral';
      case 4: return 'Satisfied';
      case 5: return 'Very Satisfied';
      default: return 'Rate your experience';
    }
  };

  if (!complaintId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-red-900 mb-2">Invalid Request</h2>
            <p className="text-red-700">No complaint ID provided for feedback submission.</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
          <p className="text-gray-600 mt-2">
            Please share your experience with how your complaint was handled.
          </p>
        </div>

        {/* Complaint Info */}
        {currentComplaint && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Complaint Details</h3>
            <div className="text-sm text-blue-800">
              <p><span className="font-medium">Number:</span> {currentComplaint.complaint_number}</p>
              <p><span className="font-medium">Title:</span> {currentComplaint.title}</p>
              <p><span className="font-medium">Status:</span> {currentComplaint.status}</p>
              <p><span className="font-medium">Department:</span> {currentComplaint.department_name}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Satisfaction Rating *
              </label>
              <div className="flex items-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      star <= formData.rating
                        ? 'text-yellow-400 hover:text-yellow-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {getRatingText(formData.rating)} ({formData.rating}/5 stars)
              </p>
            </div>

            {/* Feedback Text */}
            <div>
              <label htmlFor="feedback_text" className="block text-sm font-medium text-gray-700 mb-2">
                Your Feedback *
              </label>
              <textarea
                id="feedback_text"
                name="feedback_text"
                value={formData.feedback_text}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please share your detailed feedback about how your complaint was handled. Include what went well, what could be improved, and any suggestions for better service..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Your feedback helps us improve our complaint resolution process.
              </p>
            </div>

            {/* Feedback Guidelines */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">Feedback Guidelines</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Be honest and constructive in your feedback</li>
                <li>• Mention specific aspects of the service you received</li>
                <li>• Include suggestions for improvement if applicable</li>
                <li>• Your feedback will be used to enhance our services</li>
                <li>• Feedback is confidential and used for internal improvement only</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting || loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Thank You Message */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            🙏 Thank You for Your Feedback
          </h3>
          <p className="text-blue-800">
            Your feedback is valuable to us and helps improve our complaint resolution process. 
            We appreciate you taking the time to share your experience with us.
          </p>
        </div>
      </div>
    </div>
  );
}
