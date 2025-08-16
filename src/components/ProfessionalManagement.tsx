
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { fetchProfessionals, createProfessional, updateProfessional, deleteProfessional, Professional } from '@/services/professionalsService';

const ProfessionalManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      loadProfessionals();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfessionals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await fetchProfessionals(user.id);
      setProfessionals(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.name || !formData.phone || !formData.role) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProfessional) {
        await updateProfessional(editingProfessional.id, formData);
        toast({
          title: "Profissional atualizado!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        await createProfessional(user.id, formData);
        toast({
          title: "Profissional cadastrado!",
          description: "O profissional foi adicionado à equipe.",
        });
      }
      
      setIsDialogOpen(false);
      setEditingProfessional(null);
      setFormData({ name: '', phone: '', whatsapp: '', role: '' });
      loadProfessionals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o profissional.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      phone: professional.phone,
      whatsapp: professional.whatsapp || '',
      role: professional.role
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (professionalId: string) => {
    try {
      await deleteProfessional(professionalId);
      toast({
        title: "Profissional removido!",
        description: "O profissional foi removido da equipe.",
      });
      loadProfessionals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o profissional.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-whatsapp-green" />
          Gerenciar Equipe
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-whatsapp-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Profissional
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar' : 'Adicionar'} Profissional
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do profissional"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Função *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ex: Cabeleireiro, Manicure, Esteticista"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingProfessional(null);
                    setFormData({ name: '', phone: '', whatsapp: '', role: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-whatsapp-green hover:bg-green-600">
                  {editingProfessional ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((professional) => (
          <Card key={professional.id} className="border-whatsapp">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{professional.name}</CardTitle>
              <p className="text-sm text-gray-600">{professional.role}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <p><strong>Telefone:</strong> {professional.phone}</p>
                {professional.whatsapp && (
                  <p><strong>WhatsApp:</strong> {professional.whatsapp}</p>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(professional)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(professional.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {professionals.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum profissional cadastrado ainda.</p>
          <p className="text-sm text-gray-500">Clique em "Adicionar Profissional" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalManagement;
