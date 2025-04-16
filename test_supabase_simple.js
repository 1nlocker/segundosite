// Script simplificado para testar a conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cdnlwbolfyiuxvwchhri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmx3Ym9sZnlpdXh2d2NoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQ4OTEsImV4cCI6MjA2MDM4MDg5MX0.KQM44Vn_wr63AQE2mSkW99D4Af8rctmK1cvmapUmCX4';

console.log('========== TESTE DE CONEXÃO SUPABASE (SIMPLIFICADO) ==========');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`KEY: ${SUPABASE_KEY.substring(0, 10)}...${SUPABASE_KEY.substring(SUPABASE_KEY.length - 5)}`);

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para testar a conexão
async function testSimpleConnection() {
  try {
    console.log('\nTestando conexão com o Supabase...');
    
    // Teste 1: Verificar informações do sistema
    const { data: healthData, error: healthError } = await supabase.auth.getSession();
    
    if (healthError) {
      console.error('❌ Erro ao verificar status do Supabase:', healthError.message);
    } else {
      console.log('✅ Conexão com Supabase Auth estabelecida com sucesso!');
      
      if (healthData) {
        console.log('   Não há sessão ativa atualmente.');
      }
    }
    
    // Tentando criar uma tabela simples para teste
    console.log('\nTentando criar uma tabela de teste temporária...');
    const { error: createError } = await supabase
      .from('test_connection')
      .insert([{ id: 1, name: 'Test', created_at: new Date().toISOString() }]);
    
    if (createError) {
      if (createError.code === '42P01') {
        console.log('ℹ️ A tabela "test_connection" não existe (isso é esperado).');
        console.log('   As tabelas precisam ser criadas usando o script SQL.');
      } else {
        console.error('❌ Erro ao inserir dados de teste:', createError.message);
      }
    } else {
      console.log('✅ Dados inseridos com sucesso!');
    }

    console.log('\n========== RESUMO ==========');
    const connectionStatus = healthError ? '❌ Falhou' : '✅ Sucesso';
    console.log(`Conexão básica com o Supabase Auth: ${connectionStatus}`);
    
    if (!healthError) {
      console.log('\nPróximos passos recomendados:');
      console.log('1. Execute o script "supabase_schema.sql" no Supabase SQL Editor para criar o esquema do banco de dados');
      console.log('2. Teste a aplicação em http://localhost:3000');
    } else {
      console.log('\nVerifique se:');
      console.log('1. A URL e a chave do Supabase estão corretas');
      console.log('2. O projeto Supabase está ativo');
      console.log('3. Não há restrições de rede bloqueando a conexão');
    }
  } catch (error) {
    console.error('Erro não esperado durante o teste de conexão:', error.message);
  }
}

// Executar o teste de conexão simplificado
testSimpleConnection(); 