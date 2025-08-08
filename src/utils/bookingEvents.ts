/**
 * Sistema de eventos para sincronização de agendamentos em tempo real
 */

export type BookingEventType = 'appointment_created' | 'appointment_cancelled' | 'appointment_updated';

export interface BookingEvent {
  type: BookingEventType;
  companyId: string;
  date: string;
  time: string;
  appointmentId?: string;
}

class BookingEventManager {
  private listeners: { [key: string]: ((event: BookingEvent) => void)[] } = {};

  /**
   * Adiciona um listener para eventos de agendamento
   */
  addEventListener(type: BookingEventType, listener: (event: BookingEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  /**
   * Remove um listener
   */
  removeEventListener(type: BookingEventType, listener: (event: BookingEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener);
    }
  }

  /**
   * Dispara um evento para todos os listeners
   */
  dispatchEvent(event: BookingEvent) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          // Error handling
        }
      });
    }
  }

  /**
   * Remove todos os listeners
   */
  removeAllListeners() {
    this.listeners = {};
  }
}

// Instância singleton
export const bookingEventManager = new BookingEventManager();

/**
 * Hook para facilitar o uso do sistema de eventos
 */
export const useBookingEvents = () => {
  return {
    addEventListener: bookingEventManager.addEventListener.bind(bookingEventManager),
    removeEventListener: bookingEventManager.removeEventListener.bind(bookingEventManager),
    dispatchEvent: bookingEventManager.dispatchEvent.bind(bookingEventManager)
  };
};