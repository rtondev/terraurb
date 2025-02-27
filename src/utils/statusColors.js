// Utility file to manage complaint status colors

const statusColors = {
  'Em Análise': '#4287f5',     // Blue
  'Em Andamento': '#ffd700',    // Yellow
  'Resolvido': '#28a745',       // Green
  'Cancelado': '#dc3545',       // Red
  'Em Verificação': '#8a2be2',  // Purple
  'Reaberto': '#ff8c00'         // Orange
};

// Get color based on complaint status
const getStatusColor = (status) => {
  switch (status) {
    case 'Resolvido':
      return 'bg-green-100 text-green-800';
    case 'Em Andamento':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pendente':
      return 'bg-blue-100 text-blue-800';
    case 'Cancelado':
      return 'bg-red-100 text-red-800';
    case 'Em Verificação':
      return 'bg-purple-100 text-purple-800';
    case 'Reaberto':
      return 'bg-orange-100 text-orange-800';
    case 'Em Análise':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Exportar uma única vez
export { statusColors, getStatusColor };