
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useClientAuth } from '@/hooks/useClientAuth';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface ClientLoginProps {
  companyData: any;
  onLoginSuccess: () => void;
}

// Função para extrair apenas o primeiro nome
const extractFirstName = (fullName: string): string => {
  const names = fullName.trim().split(/\s+/);
  return names[0];
};

const ClientLogin = ({ companyData, onLoginSuccess }: ClientLoginProps) => {
  const { toast } = useToast();
  const { loginWithPhone, completeRegistration, loading } = useClientAuth();
  const [phone, setPhone] = useState('');
  const [showNameForm, setShowNameForm] = useState(false);
  const [clientName, setClientName] = useState('');

  const handleLogin = async () => {
    if (!phone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, informe seu número de telefone.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await loginWithPhone(phone.trim(), companyData.id);
      
      if (result.isFirstTime) {
        // Primeiro acesso - mostrar formulário de nome
        setShowNameForm(true);
      } else {
        // Cliente existente - login direto
        toast({
          title: "Bem-vindo(a) de volta!",
          description: `Olá, ${result.client?.name}`,
        });
        onLoginSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Não foi possível realizar o login. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteRegistration = async () => {
    if (!clientName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extrair apenas o primeiro nome antes de salvar
      const firstName = extractFirstName(clientName.trim());
      devLog('👤 Salvando cliente com primeiro nome:', firstName);

      // Criar cliente no banco com apenas o primeiro nome
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: firstName, // Salvando apenas o primeiro nome
          phone: phone.trim(),
          company_id: companyData.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Completar registro local
      const clientData = {
        id: newClient.id,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email
      };

      completeRegistration(clientData);
      
      toast({
        title: "Cadastro realizado!",
        description: `Bem-vindo(a), ${firstName}!`,
      });
      
      onLoginSuccess();
    } catch (error) {
      devError('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: "Não foi possível completar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (showNameForm) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[#19c662]">
              Primeiro Acesso
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Para continuar, informe seu nome
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="border-gray-300 focus:border-[#19c662] focus:ring-[#19c662]"
              />
              <p className="text-xs text-gray-500">
                💡 Apenas o primeiro nome será salvo no sistema
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowNameForm(false)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleCompleteRegistration}
                disabled={loading}
                className="flex-1 bg-[#19c662] hover:bg-[#005c39] text-white"
              >
                {loading ? 'Cadastrando...' : 'Confirmar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#19c662] rounded-full flex items-center justify-center">
            {companyData.logo_url ? (
              <img 
                src={companyData.logo_url} 
                alt={companyData.company_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-xl">
                {companyData.company_name?.charAt(0) || 'Z'}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-[#19c662]">
            {companyData.company_name || 'ZapAgenda'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Digite seu telefone para acessar seus agendamentos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de telefone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-gray-300 focus:border-[#19c662] focus:ring-[#19c662]"
            />
          </div>
          
          <Button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#19c662] hover:bg-[#005c39] text-white"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLogin;
