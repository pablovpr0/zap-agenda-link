
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Service } from '@/types/publicBooking';
import StandardCalendar from '@/components/StandardCalendar';
import TimeSelection from '@/components/public-booking/TimeSelection';

interface BookingDataCardProps {
  services: Service[];
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
  availableDates: Date[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  availableTimes: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  isLoadingTimes?: boolean;
  onRefreshTimes?: () => void;
}

const BookingDataCard = ({
  services,
  selectedService,
  onServiceChange,
  availableDates,
  selectedDate,
  onDateSelect,
  availableTimes,
  selectedTime,
  onTimeSelect,
  isLoadingTimes,
  onRefreshTimes
}: BookingDataCardProps) => {
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="mx-4 mb-6 bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header do card */}
      <div className="bg-[#19c662] px-6 py-4">
        <h3 className="text-white font-bold text-lg">Dados do Agendamento</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Seleção de Serviço */}
        <div>
          <label className="block text-black font-medium mb-2">
            Escolha o serviço
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsServiceOpen(!isServiceOpen)}
              className={`w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-colors ${
                selectedService 
                  ? 'bg-[#d0ffcf] border-[#19c662]' 
                  : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className={selectedService ? 'text-black font-medium' : 'text-gray-500'}>
                {selectedServiceData 
                  ? `${selectedServiceData.name} - ${selectedServiceData.duration}min${selectedServiceData.price ? ` - R$ ${selectedServiceData.price.toFixed(2)}` : ''}`
                  : 'Selecione um serviço'
                }
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isServiceOpen ? 'rotate-180' : ''}`} />
            </button>

            {isServiceOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      onServiceChange(service.id);
                      setIsServiceOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-black">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      {service.duration}min
                      {service.price && ` - R$ ${service.price.toFixed(2)}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendário */}
        {selectedService && (
          <div>
            <label className="block text-black font-medium mb-2">
              Escolha a data
            </label>
            <StandardCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              showNavigation={true}
              highlightToday={true}
            />
          </div>
        )}

        {/* Horários Disponíveis */}
        {selectedDate && (
          <div>
            <TimeSelection
              availableTimes={availableTimes}
              selectedTime={selectedTime}
              onTimeSelect={onTimeSelect}
              isLoading={isLoadingTimes}
              onRefresh={onRefreshTimes}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDataCard;
