
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
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-medium text-green-800 mb-1">Link de Agendamento Público</h3>
            <p className="text-sm text-green-600 break-all">
              {bookingLink}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewPublicPage}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCopyLink}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {linkCopied ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {linkCopied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShareWhatsApp}
              className="border-green-300 text-green-700 hover:bg-green-100"
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
