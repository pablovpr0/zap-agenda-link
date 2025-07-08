
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, CheckCircle, Share, Globe } from 'lucide-react';

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
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Link de Agendamento Público</h3>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Compartilhe para que seus clientes façam agendamentos online
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 p-3 rounded-md">
          <p className="text-foreground break-all text-sm font-mono">
            {bookingLink}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Link ativo e pronto para compartilhar</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewPublicPage}
              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visualizar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCopyLink}
              className={`bg-green-50 border-green-200 hover:bg-green-100 ${
                linkCopied ? 'text-green-600' : 'text-green-700'
              }`}
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShareWhatsApp}
              className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
            >
              <Share className="w-4 h-4 mr-1" />
              Compartilhar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicBookingLink;
