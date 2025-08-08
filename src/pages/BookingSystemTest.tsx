import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import NewAppointmentModal from '@/components/NewAppointmentModal';

const BookingSystemTest = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  const mockServices = [
    { id: '1', name: 'Corte de Cabelo', duration: 30, price: 35 },
    { id: '2', name: 'Barba', duration: 20, price: 20 },
    { id: '3', name: 'Corte + Barba', duration: 50, price: 50 }
  ];

  const mockProfessionals = [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' }
  ];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleSubmit = () => {
    if (selectedDate && name && phone) {
      alert(`Agendamento para ${name} (${phone}) em ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}`);
    } else {
      alert('Preencha todos os campos!');
    }
  };

  const handleNewAppointmentSuccess = () => {
    // Refresh appointments after successful creation
    setShowNewAppointmentModal(false);
    // Add any refresh logic here if needed
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Teste de Agendamento</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome:</Label>
            <Input type="text" id="name" placeholder="Seu nome" value={name} onChange={handleNameChange} />
          </div>

          <div>
            <Label htmlFor="phone">Telefone:</Label>
            <Input type="tel" id="phone" placeholder="(11) 99999-9999" value={phone} onChange={handlePhoneChange} />
          </div>

          <div>
            <Label>Data:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button className="w-full" onClick={handleSubmit}>Agendar</Button>
          
          <Button className="w-full" onClick={() => setShowNewAppointmentModal(true)}>
            Novo Agendamento (Modal)
          </Button>
        </div>
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        companyId="test-company-id"
        services={mockServices}
        professionals={mockProfessionals}
        onAppointmentCreated={handleNewAppointmentSuccess}
      />
    </div>
  );
};

export default BookingSystemTest;
