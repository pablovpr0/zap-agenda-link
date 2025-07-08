
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
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Globe className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Link de Agendamento Público</h3>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Compartilhe para que seus clientes façam agendamentos online
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md border">
          <p className="text-foreground break-all text-sm font-mono flex-1">
            {bookingLink}
          </p>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onViewPublicPage}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCopyLink}
              className={`h-8 w-8 p-0 ${linkCopied ? 'text-primary' : ''}`}
            >
              {linkCopied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onShareWhatsApp}
              className="h-8 w-8 p-0"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>Link ativo e pronto para compartilhar</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicBookingLink;
