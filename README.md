# Central Geral

Um sistema modular para organizar sua vida **profissional**, **intelectual** e **pessoal** — com um **painel único** ("Hoje") que reúne tudo o que você precisa fazer no dia.

- 🧩 **Módulos** — cada área da vida é um módulo (crie, renomeie, escolha cor e ícone).
- 🗓️ **Atividades fixas ou pontuais** — uma matéria que se repete toda semana, ou uma tarefa só daquele dia.
- ✨ **Cronograma 100% editável** — monte sua grade da semana do jeito que quiser.
- 📊 **Painel "Hoje"** — abre e mostra tudo que você deveria fazer hoje, agrupado por módulo, com progresso e streak.
- 🔒 **Login + nuvem (Supabase)** ou **modo demo** (funciona na hora, sem configurar nada).
- 🎨 Visual editorial escuro + dourado, animações suaves (sem travar).

---

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Sem chaves do Supabase, o app entra em **modo demonstração** (dados no navegador) — clique em **"Explorar em modo demonstração"**.

---

## Passo a passo do deploy (Supabase + Netlify)

### 1. Criar o banco no Supabase

1. Crie um projeto em <https://supabase.com>.
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Isso cria as tabelas, ativa a segurança por usuário (RLS) e semeia os 3 módulos padrão para cada novo cadastro.
3. Em **Project Settings → API**, copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
4. (Opcional) Em **Authentication → Providers → Email**, desligue "Confirm email" se quiser entrar sem confirmar o e-mail durante os testes.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Com as chaves presentes, o app usa login real + nuvem automaticamente.

### 3. Publicar no Netlify

1. Suba este repositório no GitHub.
2. No Netlify: **Add new site → Import from Git** e selecione o repo.
3. O build já está configurado em `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Em **Site settings → Environment variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Pronto. 🎉

> Depois de publicar, adicione a URL do Netlify em **Supabase → Authentication → URL Configuration → Site URL / Redirect URLs** para o login funcionar em produção.

---

## Como usar

- **Hoje** — seu painel central. Mostra as atividades do dia de todos os módulos; marque conforme conclui. Use as setas para ver outros dias.
- **Módulos** (Profissional / Intelectual / Pessoal / os seus) — gerencie as atividades de cada área. Cada atividade é **fixa** (repete nos dias da semana marcados) ou **pontual** (uma data só).
- **Cronograma** — a grade semanal inteira, editável. Clique em **+** num dia para encaixar algo fixo naquele dia.
- **Ajustes** — crie/edite módulos, exporte backup, veja o status da conexão e saia.

---

## Stack

React + TypeScript + Vite · Tailwind CSS · Framer Motion · Supabase (Postgres + Auth) · deploy no Netlify.

## Estrutura

```
src/
  lib/        tipos, helpers de data, ícones, lógica e a camada de dados (Supabase ou local)
  context/    autenticação e dados (estado global)
  components/ layout, modais, linhas de atividade, toasts
  pages/      Login, Hoje (Dashboard), Módulo, Cronograma, Ajustes
supabase/
  schema.sql  tabelas + RLS + seed (cole no Supabase)
```
