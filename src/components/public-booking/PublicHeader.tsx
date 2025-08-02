
import React, { useState } from 'react';
import { Menu, Clock, History, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PublicHeaderProps {
  onHistoryClick?: () => void;
  onNextAppointmentClick?: () => void;
  onLogoutClick?: () => void;
}

const PublicHeader = ({ onHistoryClick, onNextAppointmentClick, onLogoutClick }: PublicHeaderProps) => {
  return (
    <header className="w-full bg-[#FAFAFA] px-4 py-3 flex justify-between items-center relative z-10">
      <div className="flex-1" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-800 hover:bg-gray-100">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg z-50">
          <DropdownMenuItem 
            onClick={onHistoryClick} 
            className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
          >
            <History className="mr-2 h-4 w-4 text-gray-600" />
            <span>Histórico de agendamentos</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onNextAppointmentClick} 
            className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
          >
            <Clock className="mr-2 h-4 w-4 text-gray-600" />
            <span>Próximo agendamento</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onLogoutClick} 
            className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
          >
            <LogOut className="mr-2 h-4 w-4 text-gray-600" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default PublicHeader;
