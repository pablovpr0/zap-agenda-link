import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Phone, Mail, Search, Edit, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
}
const ClientManagement = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);
  const loadClients = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('clients').select('*').eq('company_id', user!.id).order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveClient = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingClient) {
        // Atualizar cliente existente
        const {
          error
        } = await supabase.from('clients').update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        }).eq('id', editingClient.id);
        if (error) throw error;
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso."
        });
      } else {
        // Criar novo cliente
        const {
          error
        } = await supabase.from('clients').insert({
          company_id: user!.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          notes: formData.notes || null
        });
        if (error) throw error;
        toast({
          title: "Sucesso!",
          description: "Cliente cadastrado com sucesso."
        });
      }
      setDialogOpen(false);
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: ''
      });
      loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      notes: client.notes || ''
    });
    setDialogOpen(true);
  };
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const {
        error
      } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) throw error;
      toast({
        title: "Sucesso!",
        description: "Cliente excluído com sucesso."
      });
      loadClients();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive"
      });
    }
  };
  const handleWhatsAppContact = (phone: string, clientName: string) => {
    // Limpar o telefone removendo caracteres especiais
    const cleanPhone = phone.replace(/\D/g, '');

    // Adicionar código do país se não tiver
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Criar mensagem personalizada
    const message = `Olá ${clientName}! Aqui é da empresa. Como posso ajudá-lo?`;
    const encodedMessage = encodeURIComponent(message);

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };
  const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm));
  if (loading) {
    return <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  return <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 md:w-6 h-5 md:h-6 text-whatsapp-green" />
            Gerenciar Clientes
          </h2>
          <p className="text-whatsapp-muted text-sm">Cadastre e gerencie seus clientes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-whatsapp-green hover:bg-green-600 text-white" onClick={() => {
            setEditingClient(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              notes: ''
            });
          }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))} placeholder="Nome do cliente" className="border-whatsapp" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData(prev => ({
                ...prev,
                phone: e.target.value
              }))} placeholder="(11) 99999-9999" className="border-whatsapp" />
              </div>
              <div>
                
                
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveClient} className="flex-1 bg-whatsapp-green hover:bg-green-600 text-white">
                  {editingClient ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-whatsapp">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-whatsapp-muted w-4 h-4" />
        <Input placeholder="Buscar cliente por nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-whatsapp" />
      </div>

      {/* Clients List */}
      <Card className="bg-white border-whatsapp">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-gray-800">
            Clientes Cadastrados ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {filteredClients.length === 0 ? <div className="text-center py-8 text-whatsapp-muted">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              {searchTerm ? <p>Nenhum cliente encontrado para "{searchTerm}"</p> : <>
                  <p>Nenhum cliente cadastrado ainda</p>
                  <p className="text-sm">Comece cadastrando seu primeiro cliente</p>
                </>}
            </div> : <div className="space-y-3">
              {filteredClients.map(client => <div key={client.id} className="flex items-center justify-between p-3 border border-whatsapp rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800 truncate">{client.name}</p>
                    </div>
                    <div className="text-sm text-whatsapp-muted space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{client.email}</span>
                        </div>}
                    </div>
                  </div>
                  <div className="flex gap-1 md:gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleWhatsAppContact(client.phone, client.name)} className="border-green-300 text-green-600 hover:bg-green-50" title="Contatar via WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditClient(client)} className="border-whatsapp" title="Editar cliente">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteClient(client.id)} className="border-red-300 text-red-600 hover:bg-red-50" title="Excluir cliente">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default ClientManagement;