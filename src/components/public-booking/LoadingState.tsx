
const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="text-center bg-white public-surface public-card-border p-8 rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <div className="text-xl font-bold text-green-600 mb-2">ZapAgenda</div>
        <div className="text-gray-600">Carregando...</div>
      </div>
    </div>
  );
};

export default LoadingState;
