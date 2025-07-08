
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  companySlug?: string;
}

const ErrorState = ({ companySlug }: ErrorStateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-xl font-bold text-red-600 mb-2">Empresa não encontrada</div>
        <div className="text-gray-600 mb-4">
          Verifique se o link está correto: {companySlug}
        </div>
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
