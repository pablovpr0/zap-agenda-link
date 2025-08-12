
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Service } from '@/types/publicBooking';
import StandardCalendar from '@/components/StandardCalendar';
import TimeSelection from '@/components/public-booking/TimeSelection';
import ServiceSelectionModal from '@/components/public-booking/ServiceSelectionModal';
import { formatToBrasilia } from '@/utils/timezone';

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
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="mx-4 mb-6 bg-white public-surface public-card-border rounded-xl shadow-md overflow-visible relative">
      {/* Header do card */}
      <div className="bg-[#19c662] dynamic-bg-primary px-6 py-4">
        <h3 className="text-white font-bold text-lg">Dados do Agendamento</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Seleção de Serviço */}
        <div className="relative">
          <label className="block text-black public-text font-medium mb-2">
            Escolha o serviço
          </label>
          <button
            type="button"
            onClick={() => setIsServiceModalOpen(true)}
            className={`w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition-colors ${
              selectedService 
                ? 'dynamic-selected-bg border-[#19c662] dynamic-border-primary text-black' 
                : 'bg-white public-surface border-gray-300 public-border hover:border-gray-400'
            }`}
          >
            <span className={selectedService ? 'text-black font-medium' : 'text-gray-500 public-text-secondary'}>
              {selectedServiceData 
                ? `${selectedServiceData.name} - ${selectedServiceData.duration}min${selectedServiceData.price ? ` - R$ ${selectedServiceData.price.toFixed(2)}` : ''}`
                : 'Selecione um serviço'
              }
            </span>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendário */}
        {selectedService && (
          <div>
            <label className="block text-black public-text font-medium mb-2">
              Escolha a data
              {selectedDate && (
                <span className="ml-2 text-sm text-[#19c662] dynamic-primary font-normal">
                  ✓ {formatToBrasilia(selectedDate + 'T12:00:00', "EEEE, dd 'de' MMMM")}
                </span>
              )}
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

      {/* Modal de Seleção de Serviços */}
      <ServiceSelectionModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        services={services}
        onServiceSelect={onServiceChange}
      />
    </div>
  );
};

export default BookingDataCard;
