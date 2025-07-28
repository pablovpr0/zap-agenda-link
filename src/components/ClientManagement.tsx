import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Search, Phone, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getStorageData, setStorageData, MockClient, MockAppointment, STORAGE_KEYS } from '@/data/mockData';

const ClientManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<MockClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<MockClient | null>(null);
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
      const storedClients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
      const userClients = storedClients.filter(client => client.company_id === user?.id);
      setClients(userClients);
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleOpenDeleteDialog = (client: MockClient) => {
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
      const updatedClients = clients.filter(client => client.id !== selectedClient.id);
      setStorageData(STORAGE_KEYS.CLIENTS, updatedClients);
      setClients(updatedClients);
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
      const newClient: MockClient = {
        id: `client-${Date.now()}`,
        company_id: user.id,
        name: newClientName,
        phone: newClientPhone,
        created_at: new Date().toISOString()
      };

      const updatedClients = [...clients, newClient];
      setStorageData(STORAGE_KEYS.CLIENTS, updatedClients);
      setClients(updatedClients);
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
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Gerenciar Clientes</CardTitle>
          <Button onClick={handleOpenNewClientModal}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
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
                        <Badge variant="secondary" className="space-x-1">
                          <User className="w-3 h-3" />
                          <span>0</span>
                        </Badge>
                        <Badge variant="secondary" className="space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>0</span>
                        </Badge>
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
              />
            </div>
          </div>
          <div className="flex justify-end">
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
