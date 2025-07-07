
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const SupportSection = () => {
  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
          <HelpCircle className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
          Suporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <h3 className="font-medium mb-2 text-gray-800">Precisa de ajuda?</h3>
          <p className="text-whatsapp-muted text-sm mb-4">Nossa equipe está pronta para ajudar você</p>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full border-whatsapp">
              📞 Contato por WhatsApp
            </Button>
            <Button variant="outline" className="w-full border-whatsapp">
              📧 Enviar E-mail
            </Button>
            <Button variant="outline" className="w-full border-whatsapp">
              📚 Central de Ajuda
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4 text-center border-whatsapp">
          <p className="text-xs text-whatsapp-muted">
            ZapAgenda v1.0 - © 2024
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportSection;
