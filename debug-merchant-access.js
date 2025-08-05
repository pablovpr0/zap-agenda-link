// Script de Debug para Acesso do Comerciante
// Cole este código no console do navegador (F12) para diagnosticar problemas

console.log('🔍 Iniciando diagnóstico de acesso do comerciante...');

// Função para verificar dados de autenticação
function checkAuthData() {
    console.log('\n📋 1. Verificando dados de autenticação...');
    
    // Procurar por dados do Supabase no localStorage
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
    
    if (supabaseKeys.length === 0) {
        console.log('❌ Nenhum dado de autenticação encontrado no localStorage');
        return null;
    }
    
    supabaseKeys.forEach(key => {
        console.log(`🔑 Chave encontrada: ${key}`);
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.user) {
                console.log(`✅ Usuário logado: ${data.user.email}`);
                console.log(`⏰ Sessão expira: ${new Date(data.expires_at * 1000)}`);
                console.log(`🆔 User ID: ${data.user.id}`);
                return data;
            }
        } catch (e) {
            console.log(`❌ Erro ao parsear ${key}:`, e);
        }
    });
    
    return null;
}

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
    console.log('\n🔌 2. Testando conexão com Supabase...');
    
    try {
        // Tentar importar o cliente Supabase (se disponível globalmente)
        if (typeof window.supabase !== 'undefined') {
            const { data, error } = await window.supabase.auth.getSession();
            if (error) {
                console.log('❌ Erro ao obter sessão:', error);
                return false;
            }
            console.log('✅ Conexão com Supabase OK');
            console.log('👤 Sessão atual:', data.session ? 'Ativa' : 'Inativa');
            return true;
        } else {
            console.log('⚠️ Cliente Supabase não disponível globalmente');
            return null;
        }
    } catch (error) {
        console.log('❌ Erro na conexão:', error);
        return false;
    }
}

// Função para verificar perfil do usuário
async function checkUserProfile(userId) {
    console.log('\n👤 3. Verificando perfil do usuário...');
    
    if (!userId) {
        console.log('❌ ID do usuário não fornecido');
        return null;
    }
    
    try {
        // Simular chamada para o perfil (se Supabase estiver disponível)
        if (typeof window.supabase !== 'undefined') {
            const { data, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
                
            if (error) {
                console.log('❌ Erro ao buscar perfil:', error);
                return null;
            }
            
            if (!data) {
                console.log('❌ Perfil não encontrado');
                return null;
            }
            
            console.log('✅ Perfil encontrado:', data);
            
            if (!data.company_name) {
                console.log('⚠️ company_name não definido - redirecionamento para /company-setup esperado');
            } else {
                console.log('✅ company_name definido:', data.company_name);
            }
            
            return data;
        } else {
            console.log('⚠️ Não é possível verificar perfil - Supabase não disponível');
            return null;
        }
    } catch (error) {
        console.log('❌ Erro ao verificar perfil:', error);
        return null;
    }
}

// Função para verificar rotas
function checkCurrentRoute() {
    console.log('\n🛣️ 4. Verificando rota atual...');
    
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    
    console.log(`📍 Rota atual: ${currentPath}`);
    console.log(`🌐 URL completa: ${currentUrl}`);
    
    // Verificar se está na rota correta
    if (currentPath === '/') {
        console.log('✅ Na rota raiz - deve mostrar dashboard do comerciante');
    } else if (currentPath === '/auth') {
        console.log('🔐 Na página de autenticação');
    } else if (currentPath === '/company-setup') {
        console.log('🏢 Na página de configuração da empresa');
    } else if (currentPath.startsWith('/public/')) {
        console.log('🌍 Na área pública');
    } else {
        console.log('❓ Rota não reconhecida');
    }
}

// Função para verificar erros no console
function checkConsoleErrors() {
    console.log('\n🚨 5. Verificando erros recentes...');
    
    // Interceptar erros futuros
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
        errors.push(args);
        originalError.apply(console, args);
    };
    
    setTimeout(() => {
        console.error = originalError;
        if (errors.length > 0) {
            console.log(`❌ ${errors.length} erro(s) detectado(s):`);
            errors.forEach((error, index) => {
                console.log(`${index + 1}.`, ...error);
            });
        } else {
            console.log('✅ Nenhum erro detectado nos últimos segundos');
        }
    }, 2000);
}

// Função principal de diagnóstico
async function runDiagnosis() {
    console.log('🔍 DIAGNÓSTICO DE ACESSO DO COMERCIANTE');
    console.log('=====================================');
    
    // 1. Verificar autenticação
    const authData = checkAuthData();
    
    // 2. Testar conexão
    await testSupabaseConnection();
    
    // 3. Verificar perfil (se tiver usuário)
    if (authData && authData.user) {
        await checkUserProfile(authData.user.id);
    }
    
    // 4. Verificar rota
    checkCurrentRoute();
    
    // 5. Monitorar erros
    checkConsoleErrors();
    
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('========================');
    console.log('1. Verifique os resultados acima');
    console.log('2. Se não há usuário logado → acesse /auth');
    console.log('3. Se perfil incompleto → acesse /company-setup');
    console.log('4. Se há erros → resolva-os primeiro');
    console.log('5. Se tudo OK mas não funciona → limpe cache e tente novamente');
    
    console.log('\n🛠️ AÇÕES SUGERIDAS:');
    console.log('==================');
    console.log('• Para limpar dados: localStorage.clear(); sessionStorage.clear();');
    console.log('• Para ir ao login: window.location.href = "/auth";');
    console.log('• Para ir ao setup: window.location.href = "/company-setup";');
    console.log('• Para recarregar: window.location.reload();');
}

// Executar diagnóstico
runDiagnosis();

// Disponibilizar funções globalmente para uso manual
window.debugMerchant = {
    checkAuth: checkAuthData,
    testConnection: testSupabaseConnection,
    checkProfile: checkUserProfile,
    checkRoute: checkCurrentRoute,
    clearData: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Dados limpos. Recarregue a página.');
    },
    goToAuth: () => window.location.href = '/auth',
    goToSetup: () => window.location.href = '/company-setup',
    goToHome: () => window.location.href = '/',
    reload: () => window.location.reload()
};

console.log('\n🔧 Funções disponíveis:');
console.log('window.debugMerchant.checkAuth() - Verificar autenticação');
console.log('window.debugMerchant.clearData() - Limpar dados');
console.log('window.debugMerchant.goToAuth() - Ir para login');
console.log('window.debugMerchant.goToSetup() - Ir para setup');
console.log('window.debugMerchant.reload() - Recarregar página');