
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Phone, MessageCircle } from 'lucide-react';
import { Professional } from '@/services/professionalsService';

interface ProfessionalSelectionProps {
  professionals: Professional[];
  selectedProfessional: string;
  onProfessionalSelect: (professionalId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ProfessionalSelection = ({ 
  professionals, 
  selectedProfessional, 
  onProfessionalSelect, 
  onNext, 
  onBack 
}: ProfessionalSelectionProps) => {
  // Pular esta etapa automaticamente se não há profissionais ou se há apenas um
  if (professionals.length === 0 || professionals.length === 1) {
    // Se há um profissional, selecionar automaticamente
    if (professionals.length === 1) {
      onProfessionalSelect(professionals[0].id);
    } else {
      // Se não há profissionais, continuar sem seleção
      onProfessionalSelect('');
    }
    onNext();
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Escolha o Profissional</h2>
        <p className="text-gray-600">Selecione com qual profissional você gostaria de ser atendido(a).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {professionals.map((professional) => (
          <Card 
            key={professional.id}
            className={`cursor-pointer transition-all border-2 public-card-border ${
              selectedProfessional === professional.id 
                ? 'border-[var(--public-theme-primary)] bg-green-50' 
                : 'border-gray-200 hover:border-[var(--public-theme-primary)]'
            }`}
            onClick={() => onProfessionalSelect(professional.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-whatsapp-green/10 p-2 rounded-full">
                  <User className="w-5 h-5 text-whatsapp-green" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{professional.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{professional.role}</p>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{professional.phone}</span>
                    </div>
                    {professional.whatsapp && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{professional.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedProfessional === professional.id && (
                  <div className="w-5 h-5 bg-whatsapp-green rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button 
          onClick={onNext}
          disabled={!selectedProfessional}
          className="flex-1 bg-whatsapp-green hover:bg-green-600"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default ProfessionalSelection;
