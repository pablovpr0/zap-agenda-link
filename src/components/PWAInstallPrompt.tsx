
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const PWAInstallPrompt = () => {
  const { 
    showInstallPrompt, 
    installPWA, 
    dismissInstallPrompt, 
    appName, 
    installMessage 
  } = usePWAInstall();

  // Não renderizar nada se não deve mostrar o prompt
  if (!showInstallPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-green-50 shadow-lg md:left-auto md:right-4 md:w-80">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/b3ff3af2-efb5-406a-bac6-c7b3b5002543.png" 
              alt="ZapAgenda Icon" 
              className="w-8 h-8 rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-green-800 text-sm">
              {appName}
            </h3>
            <p className="text-green-700 text-xs mt-1">
              {installMessage}
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={installPWA}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
              >
                <Download className="w-3 h-3 mr-1" />
                Instalar
              </Button>
              <Button 
                onClick={dismissInstallPrompt}
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100 text-xs px-2 py-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
