import React, { useState, useEffect } from 'react';
import { Send, Trash2, Clock, Flag, AlertTriangle, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReportButton from './ReportButton';

function CommentSection({ complaintId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [commentToReport, setCommentToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [complaintId]);

  const loadComments = async () => {
    try {
      const response = await api.get(`/api/comments/complaint/${complaintId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      setError('Erro ao carregar comentários');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/api/comments', {
        complaintId,
        content: newComment
      });

      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      setError('Erro ao enviar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      setError('Erro ao deletar comentário');
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffTime = Math.abs(now - commentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const hours = commentDate.getHours().toString().padStart(2, '0');
    const minutes = commentDate.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    if (diffDays === 0) return `hoje às ${timeStr}`;
    if (diffDays === 1) return `há 1 dia`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return `${commentDate.toLocaleDateString('pt-BR')}`;
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    try {
      await api.post('/api/reports', {
        type: 'comment',
        targetId: commentToReport.id,
        reason: reportReason
      });
      
      setShowReportDialog(false);
      setCommentToReport(null);
      setReportReason('');
    } catch (error) {
      setError('Erro ao denunciar comentário');
    } finally {
      setReportLoading(false);
    }
  };

  // Diálogo de denúncia
  const ReportDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Denunciar Comentário
          </h3>
        </div>

        <form onSubmit={handleReport}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da denúncia
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
              required
              placeholder="Descreva o motivo da denúncia..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowReportDialog(false);
                setCommentToReport(null);
                setReportReason('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={reportLoading || !reportReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {reportLoading ? 'Enviando...' : 'Denunciar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Campo de comentário */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.nickname}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-none bg-white"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Comentar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm overflow-hidden">
                {comment.user?.avatarUrl ? (
                  <img 
                    src={comment.user.avatarUrl} 
                    alt={comment.user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user?.nickname}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comment.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ReportButton 
                    type="comment"
                    targetId={comment.id}
                    userId={comment.userId}
                    currentUserId={user?.id}
                  />
                  {(user?.id === comment.userId || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {showReportDialog && <ReportDialog />}
    </div>
  );
}

export default CommentSection; 