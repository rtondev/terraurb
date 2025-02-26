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
  return statusColors[status] || statusColors['Em Análise'];
};

export { statusColors, getStatusColor };