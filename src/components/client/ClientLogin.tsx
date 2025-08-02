import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useCompanyData } from '@/hooks/useCompanyData';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';

const ClientLogin = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithPhone, loading: authLoading } = useClientAuth();
  const { companyData, loading: companyLoading, error } = useCompanyData(companySlug || '');
  
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata no padrão (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(phone)) {
      toast({
        title: "Telefone inválido",
        description: "Digite um número de telefone válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!companyData?.id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const result = await loginWithPhone(cleanPhone, companyData.id);
      
      if (result.isFirstTime) {
        // Primeiro acesso - ir para agendamento
        navigate(`/${companySlug}/booking`);
      } else {
        // Cliente existente - ir para agendamento com dados carregados
        navigate(`/${companySlug}/booking`);
        toast({
          title: "Bem-vindo de volta!",
          description: `Olá, ${result.client?.name}!`,
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (companyLoading || authLoading) {
    return <LoadingState />;
  }

  if (error || !companyData) {
    return <ErrorState companySlug={companySlug} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#19c662] mb-2">ZapAgenda</h1>
          <p className="text-gray-600">Digite seu telefone para acessar seus agendamentos</p>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="text-center">
            {companyData.logo_url && (
              <img 
                src={companyData.logo_url} 
                alt={companyData.company_name}
                className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
              />
            )}
            <h2 className="text-xl font-semibold text-gray-800">{companyData.company_name}</h2>
            {companyData.address && (
              <p className="text-sm text-gray-600 mt-1">{companyData.address}</p>
            )}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Número de telefone
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="w-full"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || !validatePhone(phone)}
              className="w-full bg-[#19c662] hover:bg-[#005c39] text-white py-3 text-lg font-medium"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Primeira vez? Seu cadastro será criado automaticamente no primeiro agendamento.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;