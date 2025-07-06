
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, Calendar } from 'lucide-react';

interface MerchantProfileProps {
  onContinue: () => void;
}

const MerchantProfile = ({ onContinue }: MerchantProfileProps) => {
  // Dados mockados do comerciante - em uma implementação real, viriam de uma API
  const merchant = {
    name: "Salão Beleza & Estilo",
    avatar: "/placeholder.svg",
    rating: 4.8,
    reviews: 127,
    address: "Rua das Flores, 123 - Centro",
    hours: "Segunda a Sábado: 9h às 18h",
    services: [
      { name: "Corte Feminino", price: "R$ 35,00", duration: "45min" },
      { name: "Corte Masculino", price: "R$ 25,00", duration: "30min" },
      { name: "Escova", price: "R$ 30,00", duration: "60min" },
      { name: "Coloração", price: "R$ 80,00", duration: "120min" },
      { name: "Manicure", price: "R$ 20,00", duration: "45min" },
      { name: "Pedicure", price: "R$ 25,00", duration: "60min" }
    ]
  };

  return (
    <div className="p-4 space-y-6 fade-in">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <Avatar className="w-24 h-24 mx-auto border-4 border-primary/20">
          <AvatarImage src={merchant.avatar} alt={merchant.name} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {merchant.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{merchant.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{merchant.rating}</span>
            <span className="text-gray-500">({merchant.reviews} avaliações)</span>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Localização</p>
                <p className="text-sm text-gray-600">{merchant.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Horário de Funcionamento</p>
                <p className="text-sm text-gray-600">{merchant.hours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Serviços Disponíveis
          </Badge>
        </h3>
        
        <div className="space-y-2">
          {merchant.services.map((service, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{service.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-4">
        <Button 
          onClick={onContinue}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-medium"
          size="lg"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Agendar Horário
        </Button>
      </div>
    </div>
  );
};

export default MerchantProfile;
