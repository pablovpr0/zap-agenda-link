
import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ServiceSelectionModal from './ServiceSelectionModal';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  category?: string;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
}

const ServiceSelection = ({ services, selectedService, onServiceChange }: ServiceSelectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">Escolha o serviço</Label>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full justify-between h-auto p-3 public-border-primary border-opacity-30 focus:public-border-primary focus:ring-opacity-20 bg-opacity-10 public-bg-primary hover:bg-opacity-20"
      >
        {selectedServiceData ? (
          <div className="flex justify-between items-center w-full">
            <span className="font-medium">{selectedServiceData.name}</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              {selectedServiceData.duration}min
              {selectedServiceData.price && (
                <span className="font-medium public-primary">
                  R$ {selectedServiceData.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Qual serviço você deseja?</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </Button>

      <ServiceSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        services={services}
        onServiceSelect={onServiceChange}
      />
    </div>
  );
};

export default ServiceSelection;
