import React, { useState } from 'react';
import { Flag, AlertCircle, X } from 'lucide-react';
import api from '../services/api';

function ReportDialog({ onClose, onSubmit, type, loading, error }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden" role="dialog" aria-modal="true">
        {/* Header */}
        <header className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Denunciar {type === 'comment' ? 'Comentário' : 'Conteúdo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-red-100/50 transition-all"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Content */}
        <main className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Por que você está denunciando este {type === 'comment' ? 'comentário' : 'conteúdo'}?
              </label>
              <textarea
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
                placeholder="Descreva o motivo da sua denúncia de forma clara e objetiva..."
                required
                aria-invalid={error ? 'true' : 'false'}
              />
            </div>

            {error && (
              <div 
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <footer className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    <span>Denunciar</span>
                  </>
                )}
              </button>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
}

function ReportButton({ type, targetId, userId, currentUserId }) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Não mostrar botão se for o próprio conteúdo do usuário
  if (userId === currentUserId) return null;

  const handleReport = async (reason) => {
    setLoading(true);
    setError('');

    try {
      await api.post('/api/reports', {
        type,
        targetId,
        reason
      });

      setShowDialog(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao enviar denúncia');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setError('');
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all"
        title="Denunciar"
        aria-label="Denunciar"
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
      </button>

      {showDialog && (
        <ReportDialog
          type={type}
          onClose={handleClose}
          onSubmit={handleReport}
          loading={loading}
          error={error}
        />
      )}
    </>
  );
}

export default ReportButton; 