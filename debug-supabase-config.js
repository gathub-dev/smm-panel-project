// Debug script para verificar configuração do Supabase
// Execute: node debug-supabase-config.js

require('dotenv').config();

console.log('=== VERIFICAÇÃO DAS VARIÁVEIS DE AMBIENTE ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENTE' : 'AUSENTE');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'PRESENTE' : 'AUSENTE');

console.log('\n=== VERIFICAÇÃO DA FUNÇÃO isSupabaseConfigured ===');
const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

console.log('isSupabaseConfigured:', isSupabaseConfigured);

if (!isSupabaseConfigured) {
  console.log('\n❌ PROBLEMA: Supabase não está configurado corretamente');
  console.log('Isso significa que a aplicação está usando cliente mock');
  console.log('Por isso o checkIsAdmin() sempre retorna false');
} else {
  console.log('\n✅ SUCESSO: Supabase está configurado corretamente');
}
