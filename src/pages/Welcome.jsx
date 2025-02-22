import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-green-600">🏙️ Terraurb</h1>
          <p className="text-xl text-gray-600">
            Ajude a tornar sua cidade mais limpa e segura
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-block bg-white text-green-600 px-6 py-3 rounded-md border-2 border-green-600 hover:bg-green-50 transition-colors"
            >
              Cadastrar
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Faça login ou cadastre-se para começar a fazer denúncias
          </p>
        </div>
      </div>
    </div>
  );
}
