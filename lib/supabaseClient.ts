
import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables across different environments (Vite, Webpack, Node)
const getEnv = (key: string): string => {
  // Check import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] || '';
  }
  // Check process.env (Node/Next.js/Webpack)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

// Try getting the variables using both VITE_ and NEXT_PUBLIC_ prefixes for compatibility
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). La conexión fallará.');
}

// Fallback values prevent immediate crash during initialization, though requests will fail if keys are missing.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/*
================================================================================
 COPIA Y PEGA EL SIGUIENTE CÓDIGO EN EL SQL EDITOR DE SUPABASE PARA CONFIGURAR LA BD
================================================================================

-- 1. Extensiones
create extension if not exists "uuid-ossp";

-- 2. Tabla de Perfiles (Extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  business_name text,
  tax_id text, -- NIF/CIF para facturación española
  address text, -- Domicilio Fiscal
  avatar_url text,
  plan text default 'Free', -- 'Free', 'Pro', 'Teams'
  ai_credits int default 50,
  hourly_rate_cents int default 4000, -- 40.00 €
  pdf_color text default '#d9009f',
  bio text,
  skills text[],
  portfolio_url text,
  
  -- Configuración
  payment_reminders_enabled boolean default false,
  reminder_template_upcoming text,
  reminder_template_overdue text,

  -- Stripe & Monetización
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end timestamp with time zone,
  affiliate_code text unique,
  stripe_account_id text, -- Para Stripe Connect (cobros a terceros)
  stripe_onboarding_complete boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Seguridad Perfiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 3. Tabla de Clientes
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  company text,
  email text,
  phone text,
  tax_id text, -- CIF del cliente
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.clients enable row level security;
create policy "Users can crud own clients" on public.clients for all using (auth.uid() = user_id);

-- 4. Tabla de Proyectos
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  description text,
  status text default 'planning', -- planning, in-progress, completed, on-hold
  start_date date,
  due_date date,
  budget_cents int default 0,
  category text,
  priority text default 'Medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.projects enable row level security;
create policy "Users can crud own projects" on public.projects for all using (auth.uid() = user_id);

-- 5. Tabla de Tareas
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  description text not null,
  completed boolean default false,
  invoice_id uuid, -- Link opcional a factura si se cobra por tarea
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.tasks enable row level security;
create policy "Users can crud own tasks" on public.tasks for all using (auth.uid() = user_id);

-- 6. Tabla de Facturas (AEAT Compliance)
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  invoice_number text not null, -- Debe ser secuencial por usuario
  issue_date date not null,
  due_date date not null,
  items jsonb default '[]'::jsonb, -- Array de objetos {description, quantity, price_cents}
  subtotal_cents int not null,
  tax_percent int default 21, -- IVA General 21%
  irpf_percent int default 0, -- Retención IRPF (ej. 15% o 7%)
  total_cents int not null,
  paid boolean default false,
  payment_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.invoices enable row level security;
create policy "Users can crud own invoices" on public.invoices for all using (auth.uid() = user_id);

-- 7. Tabla de Gastos
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  description text not null,
  amount_cents int not null,
  tax_percent int default 21,
  date date not null,
  category text default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.expenses enable row level security;
create policy "Users can crud own expenses" on public.expenses for all using (auth.uid() = user_id);

-- 8. Tabla de Registros de Tiempo (Time Entries)
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  duration_seconds int not null,
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.time_entries enable row level security;
create policy "Users can crud own time entries" on public.time_entries for all using (auth.uid() = user_id);

-- 9. Ofertas de Trabajo (Job Marketplace)
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  posted_by_user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description_short text,
  description_long text,
  budget_cents int,
  duration_weeks int,
  skills text[],
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS para Jobs: Todos pueden ver, solo el creador puede editar/borrar
alter table public.jobs enable row level security;
create policy "Anyone can view jobs" on public.jobs for select using (true);
create policy "Users can insert jobs" on public.jobs for insert with check (auth.uid() = posted_by_user_id);
create policy "Users can update own jobs" on public.jobs for update using (auth.uid() = posted_by_user_id);

-- 10. Aplicaciones a Ofertas
create table public.job_applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  applicant_user_id uuid references public.profiles(id) on delete cascade not null,
  proposal_text text,
  status text default 'sent', -- sent, viewed, accepted, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.job_applications enable row level security;
create policy "Users can apply" on public.job_applications for insert with check (auth.uid() = applicant_user_id);
create policy "Applicants view own" on public.job_applications for select using (auth.uid() = applicant_user_id);
create policy "Posters view applications" on public.job_applications for select using (
  exists (select 1 from public.jobs where id = job_applications.job_id and posted_by_user_id = auth.uid())
);

-- 11. Trigger para crear perfil automático al registrarse
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, affiliate_code)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    substring(md5(random()::text) from 0 for 8) -- Código aleatorio simple
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 12. Función segura para incrementar créditos (llamada por webhooks de Stripe)
create or replace function increment_credits(user_id uuid, amount int)
returns void as $$
begin
  update public.profiles
  set ai_credits = ai_credits + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

*/
