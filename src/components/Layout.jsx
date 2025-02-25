import React from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

function Layout({ children }) {
  const location = useLocation();
  const noSpacing = ['/perfil', '/configuracoes'].includes(location.pathname);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className={`container mx-auto 
          ${noSpacing
            ? 'px-0' // Remove padding para perfil e configurações
            : 'px-4 py-6 md:px-8 md:py-8' // Mantém padding nas outras páginas
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout; 