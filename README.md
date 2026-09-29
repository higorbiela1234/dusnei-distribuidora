# Dusnei Distribuidora

Aplicação web de Recursos Humanos e Departamento Pessoal construída com Vite, React, TypeScript e Supabase. A persistência usa PostgreSQL; a autenticação é Supabase Auth e o acesso a dados é limitado por Row Level Security (RLS).

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
# Preencha a URL e a chave pública do projeto Supabase em .env.local
npm run dev
```

Verificações locais:

```bash
npm run lint
npm run build
```

Não configure a `service_role` no frontend. O cliente recebe somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; a autorização efetiva é aplicada no PostgreSQL.

## Banco E Autenticação

1. Crie um projeto Supabase com PostgreSQL e copie `.env.example` para `.env.local`.
2. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os dados públicos do projeto.
3. Aplique `supabase/migrations/20260929000100_init_hr_schema.sql` pelo SQL Editor do Supabase ou use a CLI via `npx`:

```bash
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref <ref-do-projeto>
npm run db:push
```

Para validar localmente no Codespace, com Docker disponível:

```bash
npm run db:start
npm run db:lint
```

4. Crie a primeira conta em **Authentication > Users** no painel Supabase. O trigger cria o perfil inicial com a role `viewer`.
5. Promova o primeiro administrador pelo SQL Editor, substituindo pelo UUID da conta criada:

```sql
update public.profiles
set role = 'master', permissions = array['*']
where id = '<uuid-do-usuario>';
```

6. Entre em `/login` e cadastre empresa, unidade, departamento e cargo em Configurações, nessa ordem. Esses registros formam as relações usadas pelos cadastros de funcionários.

Convites e alterações de roles privilegiadas são administrados pelo painel/SQL seguro ou por uma Edge Function protegida. Não há cadastro público no cliente.

## Modelo E Acesso

A migration cria empresas, unidades, departamentos, cargos, perfis, funcionários, diárias, EPIs e movimentações, crachás, exames ocupacionais, atestados, registros disciplinares, processos/checklists de RH e auditoria. Inclui integridade de vínculos, atualização automática do estoque, próximo ASO calculado no banco, auditoria de alterações e o bucket privado `hr-documents`.

Roles: `master`, `admin`, `hr`, `payroll`, `manager` e `viewer`. Dados pessoais, saúde ocupacional e registros disciplinares são restritos a `master`, `admin`, `hr` e `payroll`; diárias, a `master`, `admin` e `payroll`; a auditoria completa, somente `master`. O dashboard usa uma função agregada com restrições adicionais para indicadores médicos, disciplinares e financeiros.

Os únicos registros inseridos pela migration são catálogos organizacionais demonstrativos. A empresa inicial contém CNPJ inválido de exemplo, que deve ser substituído antes do uso operacional. Não há funcionários ou outros dados pessoais pré-carregados.