import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
  const handleEmailClick = () => {
    window.open('mailto:zapcomercios@gmail.com', '_blank');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5535991208159', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Suporte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-gray-600 text-sm mb-6">
            Entre em contato conosco através dos canais abaixo:
          </p>

          {/* Email */}
          <div 
            onClick={handleEmailClick}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">
                Email
              </h3>
              <p className="text-sm text-gray-600">
                zapcomercios@gmail.com
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div 
            onClick={handleWhatsAppClick}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">
                WhatsApp
              </h3>
              <p className="text-sm text-gray-600">
                (35) 99120-8159
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4 border-t border-gray-200 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;