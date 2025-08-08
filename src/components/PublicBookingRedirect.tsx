import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

/**
 * Componente para redirecionar rotas antigas /public/{slug} para /{slug}
 * Mantém compatibilidade com links antigos
 */
const PublicBookingRedirect = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (companySlug && location.pathname.startsWith('/public/')) {
      // Redirecionar de /public/{slug} para /{slug}
      // Preserva query parameters e hash
      const newPath = `/${companySlug}${location.search}${location.hash}`;
      
      // Usar replace: true para não adicionar entrada no histórico
      // Isso faz com que o botão "voltar" não leve para a URL antiga
      navigate(newPath, { replace: true });
    }
  }, [companySlug, location, navigate]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Redirecionando para o novo formato...</p>
        <p className="text-gray-500 text-sm mt-2">
          Você será redirecionado automaticamente
        </p>
      </div>
    </div>
  );
};

export default PublicBookingRedirect;