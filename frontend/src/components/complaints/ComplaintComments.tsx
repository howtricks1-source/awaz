'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useComplaintStore } from '@/store/useComplaintStore';
import { ComplaintComment, Complaint, ComplaintCommentCreate } from '@/types';

interface ComplaintCommentsProps {
  comments: ComplaintComment[];
  complaintId: number;
  complaint: Complaint;
}

export function ComplaintComments({ comments, complaintId, complaint }: ComplaintCommentsProps) {
  const { user } = useAuthStore();
  const { addComment, replyToComment, loading } = useComplaintStore();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'Comment' | 'Require Info' | 'Ask'>('Comment');
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});
  const [showReplyForm, setShowReplyForm] = useState<{ [key: number]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);

  const canAddComment = user && user.role !== 'Student';
  const canReply = user && user.role === 'Student' && complaint.created_by.id === user.id;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const commentData: ComplaintCommentCreate = {
        complaint: complaintId,
        comment_type: commentType,
        text: newComment.trim(),
      };

      await addComment(commentData);
      setNewComment('');
      setCommentType('Comment');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (commentId: number) => {
    const reply = replyText[commentId]?.trim();
    if (!reply) return;

    setSubmitting(true);
    try {
      await replyToComment(commentId, reply);
      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setShowReplyForm(prev => ({ ...prev, [commentId]: false }));
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'Comment':
        return 'bg-blue-100 text-blue-800';
      case 'Require Info':
        return 'bg-orange-100 text-orange-800';
      case 'Ask':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'Comment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'Require Info':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Ask':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Comment Form (Staff only) */}
      {canAddComment && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
          <form onSubmit={handleAddComment} className="space-y-4">
            <div>
              <label htmlFor="comment-type" className="block text-sm font-medium text-gray-700 mb-2">
                Comment Type
              </label>
              <select
                id="comment-type"
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Comment">Comment - General comment or update</option>
                <option value="Require Info">Require Info - Request additional information</option>
                <option value="Ask">Ask - Ask a question</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="comment-text" className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                id="comment-text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your comment..."
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || loading || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{comment.user_name}</p>
                    <p className="text-xs text-gray-500">{comment.user_role}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCommentTypeColor(comment.comment_type)}`}>
                    {getCommentTypeIcon(comment.comment_type)}
                    <span className="ml-1">{comment.comment_type}</span>
                  </span>
                </div>
                <time className="text-sm text-gray-500" dateTime={comment.created_at}>
                  {formatTimestamp(comment.created_at)}
                </time>
              </div>

              {/* Comment Text */}
              <div className="mb-4">
                <p className="text-gray-900 whitespace-pre-wrap">{comment.text}</p>
              </div>

              {/* Student Reply */}
              {comment.reply && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Student Reply</span>
                    {comment.replied_at && (
                      <span className="text-xs text-green-600 ml-2">
                        {formatTimestamp(comment.replied_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-green-900 whitespace-pre-wrap">{comment.reply}</p>
                </div>
              )}

              {/* Reply Form (Student only, for specific comment types) */}
              {canReply && comment.allows_student_reply && !comment.reply && (
                <div className="border-t border-gray-200 pt-4">
                  {!showReplyForm[comment.id] ? (
                    <button
                      onClick={() => setShowReplyForm(prev => ({ ...prev, [comment.id]: true }))}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Reply to this {comment.comment_type.toLowerCase()}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={replyText[comment.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your reply..."
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setShowReplyForm(prev => ({ ...prev, [comment.id]: false }));
                            setReplyText(prev => ({ ...prev, [comment.id]: '' }));
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={submitting || !replyText[comment.id]?.trim()}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Replying...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
