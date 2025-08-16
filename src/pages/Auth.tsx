import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
const Auth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    isLoading,
    signIn,
    signUp,
    resetPassword
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [currentTab, setCurrentTab] = useState<'signin' | 'signup'>('signin');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Carregar email salvo se "lembrar-me" estiver ativo
  useEffect(() => {
    const savedEmail = localStorage.getItem('zapagenda_remember_email');
    const savedRemember = localStorage.getItem('zapagenda_remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  const validateForm = (isSignUp: boolean = false) => {
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      });
      return false;
    }
    if (isSignUp && !name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome da empresa.",
        variant: "destructive"
      });
      return false;
    }
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive"
      });
      return false;
    }
    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, digite seu email para redefinir a senha.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await resetPassword(email);
      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o email de redefinição.",
          variant: "destructive"
        });
        return;
      }
      setResetEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique seu email para redefinir a senha."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email de redefinição.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        let errorMessage = "Credenciais inválidas";
        if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu email antes de fazer login";
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos";
        }
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Salvar email se "lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('zapagenda_remember_email', email);
        localStorage.setItem('zapagenda_remember_me', 'true');
      } else {
        localStorage.removeItem('zapagenda_remember_email');
        localStorage.removeItem('zapagenda_remember_me');
      }
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!"
      });
    } catch (error: unknown) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    setLoading(true);
    try {
      const {
        error
      } = await signUp(email, password, name);
      if (error) {
        let errorMessage = "Não foi possível criar a conta";
        if (error.message.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado. Tente fazer login.";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres";
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = "Email inválido";
        }
        toast({
          title: "Erro ao criar conta",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      setEmailSent(true);
      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar a conta."
      });
    } catch (error: unknown) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>;
  }
  if (emailSent) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">Email Enviado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Enviamos um link de confirmação para <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Clique no link do email para ativar sua conta e fazer login.
            </p>
            <Button variant="outline" onClick={() => {
            setEmailSent(false);
            setCurrentTab('signin');
          }} className="w-full">
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  if (resetEmailSent) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">Email de Redefinição Enviado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Enviamos um link para redefinir sua senha para <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Clique no link do email para criar uma nova senha.
            </p>
            <Button variant="outline" onClick={() => {
            setResetEmailSent(false);
            setCurrentTab('signin');
          }} className="w-full">
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">ZapAgenda</CardTitle>
          <p className="text-gray-600">Sua agenda digital</p>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={value => setCurrentTab(value as 'signin' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} className="pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                    </Button>
                  </div>
                </div>

                {/* Lembrar-me e Esqueci minha senha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Lembrar-me
                    </Label>
                  </div>
                  <Button type="button" variant="link" className="px-0 text-sm text-green-600 hover:text-green-700" onClick={handleForgotPassword} disabled={loading}>
                    Esqueci minha senha
                  </Button>
                </div>
                
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Após criar a conta, você receberá um email de confirmação.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome da Empresa</Label>
                  <Input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sua empresa" required disabled={loading} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={loading} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha (mínimo 6 caracteres)</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} minLength={6} className="pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Repetir Senha</Label>
                  <div className="relative">
                    <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={loading} minLength={6} className="pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                    </Button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && <p className="text-sm text-red-600">As senhas não coincidem</p>}
                </div>
                
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;