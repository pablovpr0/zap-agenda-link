
import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
}

const ServiceSelection = ({ services, selectedService, onServiceChange }: ServiceSelectionProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">Escolha o serviço</Label>
      <Select value={selectedService} onValueChange={onServiceChange} required>
        <SelectTrigger className="public-border-primary border-opacity-30 focus:public-border-primary focus:ring-opacity-20 bg-opacity-10 public-bg-primary">
          <SelectValue placeholder="Qual serviço você deseja?" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id} className="hover:public-bg-primary hover:bg-opacity-10">
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">{service.name}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                  <Clock className="w-3 h-3" />
                  {service.duration}min
                  {service.price && (
                    <span className="font-medium public-primary">
                      R$ {service.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ServiceSelection;
