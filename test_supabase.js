// Script para testar a conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cdnlwbolfyiuxvwchhri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmx3Ym9sZnlpdXh2d2NoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQ4OTEsImV4cCI6MjA2MDM4MDg5MX0.KQM44Vn_wr63AQE2mSkW99D4Af8rctmK1cvmapUmCX4';

console.log('========== TESTE DE CONEXÃO SUPABASE ==========');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`KEY: ${SUPABASE_KEY.substring(0, 10)}...${SUPABASE_KEY.substring(SUPABASE_KEY.length - 5)}`);

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para testar a conexão
async function testConnection() {
  try {
    console.log('\nTestando conexão com o Supabase...');
    
    // Teste 1: Verificar a conexão básica
    const { data: versionData, error: versionError } = await supabase.rpc('version');
    
    if (versionError) {
      console.error('❌ Erro ao verificar versão:', versionError.message);
    } else {
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      console.log(`   Versão PostgreSQL: ${versionData || 'Não disponível'}`);
    }
    
    // Teste 2: Tentar listar as tabelas disponíveis
    console.log('\nVerificando tabelas disponíveis...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .order('tablename', { ascending: true });
    
    if (tablesError) {
      if (tablesError.code === '42501') {
        console.log('ℹ️ Acesso restrito às tabelas do sistema (comportamento esperado com chave anon)');
      } else {
        console.error('❌ Erro ao listar tabelas:', tablesError.message);
      }
      
      // Vamos tentar uma tabela específica
      console.log('\nTentando acessar a tabela "usuarios"...');
      const { data: usuariosCount, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });
      
      if (usuariosError) {
        if (usuariosError.code === '42P01') {
          console.error('❌ A tabela "usuarios" não existe.');
          console.log('   Você precisa criar o esquema do banco de dados utilizando o script "supabase_schema.sql"');
        } else {
          console.error('❌ Erro ao acessar a tabela "usuarios":', usuariosError.message);
        }
      } else {
        console.log(`✅ Tabela "usuarios" acessível! (Aproximadamente ${usuariosCount?.length || 0} registros)`);
      }
    } else {
      console.log('✅ Tabelas disponíveis:');
      if (tablesData && tablesData.length > 0) {
        tablesData.forEach(table => {
          console.log(`   - ${table.tablename}`);
        });
      } else {
        console.log('   Nenhuma tabela encontrada no schema "public".');
        console.log('   Você precisa criar o esquema do banco de dados utilizando o script "supabase_schema.sql"');
      }
    }

    console.log('\n========== RESUMO ==========');
    console.log('Conexão básica com o Supabase: ' + (versionError ? '❌ Falhou' : '✅ Sucesso'));
    
    if (!versionError) {
      console.log('\nPróximos passos recomendados:');
      
      if (tablesError || (tablesData && tablesData.length === 0)) {
        console.log('1. Execute o script "supabase_schema.sql" para criar o esquema do banco de dados');
        console.log('2. Configure as permissões de RLS (Row Level Security) nas tabelas');
        console.log('3. Crie um usuário administrador inicial');
      } else {
        console.log('1. Verifique se as políticas de RLS (Row Level Security) estão configuradas corretamente');
        console.log('2. Teste o fluxo de autenticação na aplicação');
      }
    }
  } catch (error) {
    console.error('Erro não esperado durante o teste de conexão:', error.message);
  }
}

// Executar o teste de conexão
testConnection(); 