
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, CheckCircle, Share } from 'lucide-react';

interface PublicBookingLinkProps {
  bookingLink: string;
  linkCopied: boolean;
  onViewPublicPage: () => void;
  onCopyLink: () => void;
  onShareWhatsApp: () => void;
}

const PublicBookingLink = ({ 
  bookingLink, 
  linkCopied, 
  onViewPublicPage, 
  onCopyLink, 
  onShareWhatsApp 
}: PublicBookingLinkProps) => {
  if (!bookingLink) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Link de Agendamento Público
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Compartilhe este link para que seus clientes façam agendamentos
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-800 break-all text-sm font-mono">
                {bookingLink}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewPublicPage}
              className="flex-1 min-w-[120px]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar Página
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCopyLink}
              className="flex-1 min-w-[120px]"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShareWhatsApp}
              className="flex-1 min-w-[120px]"
            >
              <Share className="w-4 h-4 mr-2" />
              Compartilhar WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicBookingLink;
