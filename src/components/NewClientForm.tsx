
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, X } from 'lucide-react';

interface NewClientFormProps {
  onSubmit: (clientData: { name: string; phone: string; email?: string; notes?: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const NewClientForm = ({ onSubmit, onCancel, loading }: NewClientFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.phone.trim()) {
      onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formatar como (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-whatsapp-green" />
          Novo Cliente
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              required
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              required
              className="h-9"
              maxLength={15}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes" className="text-sm">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informações adicionais sobre o cliente..."
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-9"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 h-9 bg-whatsapp-green hover:bg-whatsapp-green-dark"
            disabled={loading || !formData.name.trim() || !formData.phone.trim()}
          >
            {loading ? 'Criando...' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewClientForm;
