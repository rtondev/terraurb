import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TopBar({ title, backTo }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate(backTo || -1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
    </div>
  );
}

export default TopBar; 