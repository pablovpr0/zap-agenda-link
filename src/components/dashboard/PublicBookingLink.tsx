
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
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              🔗 Link de Agendamento Público
            </h3>
            <p className="text-green-100 text-sm mb-3">
              Compartilhe este link para que seus clientes façam agendamentos
            </p>
            <div className="bg-white/90 p-3 rounded-lg">
              <p className="text-green-800 break-all font-mono text-sm font-semibold">
                {bookingLink}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewPublicPage}
              className="border-2 border-green-400 text-green-700 hover:bg-green-100 font-semibold shadow-md flex-1 min-w-[120px]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar Página
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCopyLink}
              className="border-2 border-blue-400 text-blue-700 hover:bg-blue-100 font-semibold shadow-md flex-1 min-w-[120px]"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copiado! ✅
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
              className="border-2 border-emerald-400 text-emerald-700 hover:bg-emerald-100 font-semibold shadow-md flex-1 min-w-[120px]"
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
