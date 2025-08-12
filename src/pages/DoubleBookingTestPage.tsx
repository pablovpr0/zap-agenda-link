import DoubleBookingTest from '@/components/debug/DoubleBookingTest';

const DoubleBookingTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Teste de Prevenção de Double-Booking
          </h1>
          <p className="text-gray-600 mt-2">
            Ferramenta para testar se o sistema está prevenindo agendamentos duplicados.
          </p>
        </div>
        
        <DoubleBookingTest />
      </div>
    </div>
  );
};

export default DoubleBookingTestPage;