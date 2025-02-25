import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  User, 
  Users, 
  AlertTriangle, 
  Map,
  Tags,
  Settings
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

const SidebarOption = ({ active, text, Icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center p-4 hover:bg-blue-50 hover:text-blue-500 rounded-full cursor-pointer ${
      active ? "text-blue-500" : ""
    }`}
  >
    <Icon className="h-5 w-5 md:h-6 md:w-6" />
    <span className="hidden md:inline text-md font-bold ml-4">{text}</span>
  </div>
);

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Menu base para todos os usuários
  const baseMenuItems = [
    { Icon: Home, text: "Início", path: "/" },
    { Icon: Map, text: "Denúncias", path: "/denuncias" },
    { Icon: User, text: "Meu Perfil", path: "/perfil" },
    { Icon: Settings, text: "Configurações", path: "/configuracoes" }
  ];

  // Menu adicional apenas para administradores
  const adminMenuItems = [
    { Icon: Tags, text: "Tags", path: "/tags" },
    { Icon: AlertTriangle, text: "Reportes", path: "/reportes" },
    { Icon: Users, text: "Usuários", path: "/usuarios" }
  ];

  // Combina os menus baseado no papel do usuário
  const menuItems = isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems;

  return (
    <div className="fixed md:relative bottom-0 md:bottom-auto w-full md:w-auto bg-white md:bg-transparent border-t md:border-t-0 md:border-r border-gray-200 md:h-screen md:flex-[0.3] md:min-w-[200px] z-50">
      {/* Logo - visível apenas em desktop */}
      <div className="hidden md:flex items-center p-4 text-blue-500 mb-5">
        <img src="/logo.svg" alt="TerraUrb Logo" className="w-8 h-8" />
      </div>

      {/* Menu de navegação */}
      <div className="flex md:block justify-around py-1 px-2 md:p-5">
        {menuItems.map((item) => (
          <SidebarOption 
            key={item.text} 
            {...item} 
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
}

export default Sidebar; 