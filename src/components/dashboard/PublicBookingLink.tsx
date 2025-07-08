
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, CheckCircle, Share, Globe, QrCode } from 'lucide-react';

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
    <Card className="border-green-200 bg-gradient-to-br from-green-50/40 to-emerald-50/40 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Link de Agendamento Público</h3>
            <p className="text-sm text-green-700 font-normal mt-1">
              Compartilhe para que seus clientes façam agendamentos online
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-white/70 p-4 rounded-lg border border-green-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <QrCode className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Sua URL personalizada:</span>
          </div>
          <div className="bg-green-50 p-3 rounded-md border border-green-200">
            <p className="text-green-900 break-all text-sm font-mono leading-relaxed">
              {bookingLink}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewPublicPage}
            className="flex items-center justify-center gap-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-xs font-medium">Visualizar</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCopyLink}
            className={`flex items-center justify-center gap-2 transition-all ${
              linkCopied 
                ? 'border-green-400 bg-green-100 text-green-800' 
                : 'border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400'
            }`}
          >
            {linkCopied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-xs font-medium">Copiar</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShareWhatsApp}
            className="flex items-center justify-center gap-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
          >
            <Share className="w-4 h-4" />
            <span className="text-xs font-medium">WhatsApp</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-green-200/50">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-700">
            Link ativo e pronto para compartilhar
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicBookingLink;
