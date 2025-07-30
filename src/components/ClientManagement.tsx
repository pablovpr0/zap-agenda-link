
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus, Search, Phone, User, Calendar, MessageCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
}

const ClientManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isNewClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        return;
      }

      setClients(clientsData || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (clients.length === 0) {
      toast({
        title: "Nenhum cliente",
        description: "Não há clientes para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ['Nome', 'Telefone', 'Email', 'Data de Cadastro'];
    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        `"${client.name}"`,
        `"${client.phone}"`,
        `"${client.email || ''}"`,
        `"${new Date(client.created_at).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportado com sucesso!",
      description: "A lista de clientes foi exportada para CSV.",
    });
  };

  const handleWhatsAppClick = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}! Como posso ajudá-lo?`);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleOpenDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      setClients(clients.filter(client => client.id !== selectedClient.id));
      toast({
        title: "Cliente removido",
        description: "O cliente foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cliente.",
        variant: "destructive",
      });
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenNewClientModal = () => {
    setNewClientModalOpen(true);
  };

  const handleCloseNewClientModal = () => {
    setNewClientModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const handleCreateNewClient = async () => {
    if (!newClientName || !newClientPhone || !user) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_id: user.id,
          name: newClientName,
          phone: newClientPhone
        })
        .select()
        .single();

      if (error) throw error;

      setClients([data, ...clients]);
      toast({
        title: "Cliente adicionado",
        description: "O cliente foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive",
      });
    } finally {
      handleCloseNewClientModal();
    }
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Gerenciar Clientes</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button onClick={handleOpenNewClientModal}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute top-2.5 right-2 w-5 h-5 text-gray-500" />
            </div>

            {loading ? (
              <div className="text-center">Carregando clientes...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center">Nenhum cliente encontrado.</div>
            ) : (
              <div className="grid gap-2">
                {filteredClients.map(client => (
                  <Card key={client.id} className="border">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          {client.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsAppClick(client.phone, client.name)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(client)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Client Modal */}
      <Dialog open={isNewClientModalOpen} onOpenChange={setNewClientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                type="text"
                id="name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input
                type="tel"
                id="phone"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="col-span-3"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCloseNewClientModal}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleCreateNewClient}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;
