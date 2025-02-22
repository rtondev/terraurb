import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-green-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2">A página que você está procurando não existe ou foi removida.</p>
        <Link
          to="/"
          className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
