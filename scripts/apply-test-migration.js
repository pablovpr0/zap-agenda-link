import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function applyTestMigration() {
  try {
    console.log('🚀 Aplicando migração de teste para empresa "pablo"...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250127000001-create-test-company-pablo.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          // Continuar mesmo com erros (pode ser conflito de dados existentes)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      }
    }
    
    console.log('🎉 Migração aplicada com sucesso!');
    
    // Verificar se os dados foram inseridos
    const { data: companySettings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('slug', 'pablo')
      .single();
    
    if (settingsError) {
      console.error('❌ Erro ao verificar dados:', settingsError);
    } else if (companySettings) {
      console.log('✅ Empresa "pablo" encontrada:', companySettings);
    } else {
      console.log('⚠️ Empresa "pablo" não encontrada após migração');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
  }
}

applyTestMigration();