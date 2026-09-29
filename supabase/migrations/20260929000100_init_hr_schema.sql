create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'viewer' check (role in ('master', 'admin', 'hr', 'payroll', 'manager', 'viewer')),
  permissions text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) and p.active;
$$;

create or replace function public.has_any_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = any (allowed_roles), false);
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.has_any_role(text[]) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text not null,
  tax_id text not null unique,
  city text not null default '',
  state char(2) not null default '',
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  name text not null,
  city text not null default '',
  state char(2) not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  code text not null unique,
  name text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.companies (legal_name, trade_name, tax_id, city, state, notes)
values ('Dusnei Distribuidora (substituir pela razão social cadastrada)', 'Dusnei Distribuidora', '00.000.000/0000-00', 'Maringá', 'PR', 'CNPJ demonstrativo inválido; substituir antes do uso operacional.')
on conflict (tax_id) do nothing;

insert into public.departments (code, name, notes) values
  ('RH', 'Recursos Humanos', 'Registro demonstrativo'),
  ('EXP', 'Expedição', 'Registro demonstrativo'),
  ('TRN', 'Transportes', 'Registro demonstrativo'),
  ('FIN', 'Financeiro', 'Registro demonstrativo'),
  ('OPS', 'Operações', 'Registro demonstrativo')
on conflict (code) do nothing;

insert into public.units (company_id, code, name, city, state)
select c.id, item.code, item.name, item.city, item.state
from public.companies c
cross join (values
  ('01', 'Maringá', 'Maringá', 'PR'),
  ('02', 'Osvaldo Cruz', 'Osvaldo Cruz', 'SP'),
  ('03', 'Cambé', 'Cambé', 'PR'),
  ('04', 'Curitiba', 'Curitiba', 'PR'),
  ('05', 'Cascavel', 'Cascavel', 'PR')
) as item(code, name, city, state)
where c.trade_name = 'Dusnei Distribuidora'
on conflict (company_id, code) do nothing;

insert into public.positions (department_id, code, name)
select d.id, item.code, item.name
from (values
  ('RH', 'RH-01', 'Analista de RH'),
  ('EXP', 'LOG-01', 'Operador de Logística'),
  ('TRN', 'TRN-01', 'Motorista Entregador'),
  ('OPS', 'OPS-01', 'Supervisor de Operações')
) as item(department_code, code, name)
join public.departments d on d.code = item.department_code
on conflict (code) do nothing;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cpf text not null unique,
  birth_date date,
  employee_number text not null unique,
  position_id uuid references public.positions(id) on delete restrict,
  department_id uuid references public.departments(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  admission_date date not null,
  termination_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  photo_path text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (termination_date is null or termination_date >= admission_date)
);

create index employees_name_idx on public.employees (full_name);
create index employees_company_unit_idx on public.employees (company_id, unit_id);
create index employees_department_idx on public.employees (department_id);

create or replace function public.validate_employee_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  unit_company_id uuid;
  position_department_id uuid;
begin
  select u.company_id into unit_company_id from public.units u where u.id = new.unit_id;
  if unit_company_id is distinct from new.company_id then
    raise exception 'Employee unit must belong to the selected company';
  end if;
  if new.position_id is not null then
    select p.department_id into position_department_id from public.positions p where p.id = new.position_id;
    if position_department_id is distinct from new.department_id then
      raise exception 'Employee position must belong to the selected department';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.validate_employee_relationships() from public, anon, authenticated;

create trigger employees_validate_relationships
before insert or update of company_id, unit_id, department_id, position_id on public.employees
for each row execute function public.validate_employee_relationships();

create table public.daily_allowances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  department_id uuid references public.departments(id) on delete set null,
  allowance_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  transaction_code text not null unique,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index daily_allowances_date_idx on public.daily_allowances (allowance_date desc);
create index daily_allowances_employee_idx on public.daily_allowances (employee_id, allowance_date desc);

create or replace function public.validate_daily_allowance_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  employee_record record;
begin
  select e.company_id, e.unit_id, e.department_id into employee_record
  from public.employees e where e.id = new.employee_id;
  if employee_record.company_id is distinct from new.company_id
     or employee_record.unit_id is distinct from new.unit_id
     or employee_record.department_id is distinct from new.department_id then
    raise exception 'Daily allowance organization fields must match the employee record';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_daily_allowance_relationships() from public, anon, authenticated;

create trigger daily_allowances_validate_relationships
before insert or update of employee_id, company_id, unit_id, department_id on public.daily_allowances
for each row execute function public.validate_daily_allowance_relationships();

create table public.ppe_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  category text not null default '',
  certificate_number text,
  size text,
  quantity integer not null default 0 check (quantity >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ppe_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ppe_items(id) on delete restrict,
  employee_id uuid references public.employees(id) on delete restrict,
  kind text not null check (kind in ('entry', 'delivery', 'return')),
  quantity integer not null check (quantity > 0),
  movement_date date not null default current_date,
  certificate_number text,
  size text,
  reason text,
  supplier text,
  invoice_number text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index ppe_movements_item_date_idx on public.ppe_movements (item_id, movement_date desc);
create index ppe_movements_employee_idx on public.ppe_movements (employee_id, movement_date desc);

create or replace function public.apply_ppe_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  stock_delta integer;
  resulting_quantity integer;
begin
  stock_delta := case when new.kind in ('entry', 'return') then new.quantity else -new.quantity end;
  update public.ppe_items
  set quantity = quantity + stock_delta
  where id = new.item_id and quantity + stock_delta >= 0
  returning quantity into resulting_quantity;
  if resulting_quantity is null then
    raise exception 'Insufficient PPE stock for this movement';
  end if;
  return new;
end;
$$;
revoke all on function public.apply_ppe_movement() from public, anon, authenticated;

create trigger ppe_movement_updates_stock
after insert on public.ppe_movements
for each row execute function public.apply_ppe_movement();

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  display_name text not null,
  department_name text not null default '',
  photo_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.occupational_exams (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  exam_date date not null,
  exam_type text not null check (exam_type in ('admission', 'periodic', 'return_to_work', 'role_change', 'termination', 'other')),
  periodicity_months integer not null check (periodicity_months > 0),
  next_exam_date date not null,
  notes text,
  document_path text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index occupational_exams_next_date_idx on public.occupational_exams (next_exam_date);
create index occupational_exams_employee_idx on public.occupational_exams (employee_id, exam_date desc);

create or replace function public.calculate_next_exam_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.next_exam_date := (new.exam_date + make_interval(months => new.periodicity_months))::date;
  return new;
end;
$$;
revoke all on function public.calculate_next_exam_date() from public, anon, authenticated;

create trigger occupational_exams_calculate_next_date
before insert or update of exam_date, periodicity_months on public.occupational_exams
for each row execute function public.calculate_next_exam_date();

create table public.medical_certificates (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  issued_at date not null,
  start_date date not null,
  end_date date not null,
  return_date date generated always as (end_date + 1) stored,
  day_count integer generated always as (end_date - start_date + 1) stored,
  cid_code text,
  physician_name text,
  crm text,
  notes text,
  document_path text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index medical_certificates_employee_idx on public.medical_certificates (employee_id, start_date desc);

create table public.disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  record_date date not null,
  record_type text not null check (record_type in ('verbal_warning', 'written_warning', 'suspension', 'disciplinary_note', 'other')),
  reason text not null,
  description text,
  notes text,
  document_path text,
  responsible_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hr_processes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  process_type text not null check (process_type in ('admission', 'termination')),
  process_status text not null default 'pending' check (process_status in ('pending', 'in_progress', 'completed', 'cancelled')),
  requested_at date not null default current_date,
  effective_date date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hr_checklist_items (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.hr_processes(id) on delete cascade,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'not_applicable')),
  sort_order integer not null default 0,
  completed_at timestamptz,
  responsible_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hr_process_employee_idx on public.hr_processes (employee_id, process_type, created_at desc);
create index hr_checklist_process_idx on public.hr_checklist_items (process_id, sort_order);

create or replace function public.start_hr_process(
  p_employee_id uuid,
  p_process_type text,
  p_default_items text[]
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_process_id uuid;
  checklist_label text;
  item_order integer := 0;
begin
  if p_process_type not in ('admission', 'termination') then
    raise exception 'Invalid HR process type';
  end if;
  insert into public.hr_processes (employee_id, process_type, created_by)
  values (p_employee_id, p_process_type, auth.uid())
  returning id into new_process_id;
  foreach checklist_label in array p_default_items loop
    insert into public.hr_checklist_items (process_id, label, sort_order)
    values (new_process_id, checklist_label, item_order);
    item_order := item_order + 1;
  end loop;
  return new_process_id;
end;
$$;
revoke all on function public.start_hr_process(uuid, text, text[]) from public, anon;
grant execute on function public.start_hr_process(uuid, text, text[]) to authenticated;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  action text not null,
  module text not null,
  record_id text not null,
  previous_data jsonb,
  new_data jsonb
);

create index audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);

create or replace function public.dashboard_summary(
  p_company_id uuid default null,
  p_unit_id uuid default null,
  p_department_id uuid default null,
  p_position_id uuid default null,
  p_period_start date default current_date - 30,
  p_period_end date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  active_role text;
begin
  active_role := public.current_app_role();
  if active_role is null then
    raise exception 'An active authenticated profile is required';
  end if;
  return jsonb_build_object(
    'employee_total', (select count(*) from public.employees e where (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'employee_active', (select count(*) from public.employees e where e.status = 'active' and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'employee_inactive', (select count(*) from public.employees e where e.status = 'inactive' and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'admissions_recent', (select count(*) from public.employees e where e.admission_date between p_period_start and p_period_end and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'terminations_recent', (select count(*) from public.employees e where e.termination_date between p_period_start and p_period_end and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'aso_current', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.occupational_exams x join public.employees e on e.id = x.employee_id where x.next_exam_date > current_date + 45 and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'aso_due_45', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.occupational_exams x join public.employees e on e.id = x.employee_id where x.next_exam_date between current_date and current_date + 45 and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'aso_due_15', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.occupational_exams x join public.employees e on e.id = x.employee_id where x.next_exam_date between current_date and current_date + 15 and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'aso_overdue', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.occupational_exams x join public.employees e on e.id = x.employee_id where x.next_exam_date < current_date and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'certificates_recent', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.medical_certificates m join public.employees e on e.id = m.employee_id where m.issued_at between p_period_start and p_period_end and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'admissions_open', (select count(*) from public.hr_processes p join public.employees e on e.id = p.employee_id where p.process_type = 'admission' and p.process_status in ('pending', 'in_progress') and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'terminations_open', (select count(*) from public.hr_processes p join public.employees e on e.id = p.employee_id where p.process_type = 'termination' and p.process_status in ('pending', 'in_progress') and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)),
    'ppe_stock_total', (select coalesce(sum(quantity), 0) from public.ppe_items),
    'ppe_delivered_total', (select coalesce(sum(quantity), 0) from public.ppe_movements where kind = 'delivery'),
    'daily_period_count', case when active_role in ('master', 'admin', 'payroll') then (select count(*) from public.daily_allowances d where d.allowance_date between p_period_start and p_period_end and (p_company_id is null or d.company_id = p_company_id) and (p_unit_id is null or d.unit_id = p_unit_id) and (p_department_id is null or d.department_id = p_department_id)) else 0 end,
    'daily_period_amount', case when active_role in ('master', 'admin', 'payroll') then (select coalesce(sum(d.amount), 0) from public.daily_allowances d where d.allowance_date between p_period_start and p_period_end and (p_company_id is null or d.company_id = p_company_id) and (p_unit_id is null or d.unit_id = p_unit_id) and (p_department_id is null or d.department_id = p_department_id)) else 0 end,
    'warnings_recent', case when active_role in ('master', 'admin', 'hr', 'payroll') then (select count(*) from public.disciplinary_records w join public.employees e on e.id = w.employee_id where w.record_date between p_period_start and p_period_end and (p_company_id is null or e.company_id = p_company_id) and (p_unit_id is null or e.unit_id = p_unit_id) and (p_department_id is null or e.department_id = p_department_id) and (p_position_id is null or e.position_id = p_position_id)) else 0 end,
    'ppe_low_stock', (select count(*) from public.ppe_items where quantity <= minimum_stock),
    'checklist_pending', (select count(*) from public.hr_checklist_items where status = 'pending')
  );
end;
$$;

revoke all on function public.dashboard_summary(uuid, uuid, uuid, uuid, date, date) from public, anon;
grant execute on function public.dashboard_summary(uuid, uuid, uuid, uuid, date, date) to authenticated;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_record jsonb;
  new_record jsonb;
  affected_id text;
begin
  if tg_op = 'INSERT' then
    new_record := to_jsonb(new);
    affected_id := new.id::text;
  elsif tg_op = 'UPDATE' then
    old_record := to_jsonb(old);
    new_record := to_jsonb(new);
    affected_id := new.id::text;
  else
    old_record := to_jsonb(old);
    affected_id := old.id::text;
  end if;

  insert into public.audit_logs (actor_id, action, module, record_id, previous_data, new_data)
  values (auth.uid(), lower(tg_op), tg_table_name, affected_id, old_record, new_record);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
revoke all on function public.write_audit_log() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'companies', 'units', 'departments', 'positions', 'employees',
    'daily_allowances', 'ppe_items', 'ppe_movements', 'badges', 'occupational_exams',
    'medical_certificates', 'disciplinary_records', 'hr_processes', 'hr_checklist_items'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit_log()', 'audit_' || table_name, table_name);
    if table_name not in ('profiles', 'ppe_movements') then
      execute format('create trigger updated_at_%I before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    end if;
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.units enable row level security;
alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.employees enable row level security;
alter table public.daily_allowances enable row level security;
alter table public.ppe_items enable row level security;
alter table public.ppe_movements enable row level security;
alter table public.badges enable row level security;
alter table public.occupational_exams enable row level security;
alter table public.medical_certificates enable row level security;
alter table public.disciplinary_records enable row level security;
alter table public.hr_processes enable row level security;
alter table public.hr_checklist_items enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.has_any_role(array['master', 'admin']));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_master_manage on public.profiles for all to authenticated
  using (public.current_app_role() = 'master') with check (public.current_app_role() = 'master');

create policy companies_read_authenticated on public.companies for select to authenticated using (true);
create policy companies_manage_hr on public.companies for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy units_read_authenticated on public.units for select to authenticated using (true);
create policy units_manage_hr on public.units for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy departments_read_authenticated on public.departments for select to authenticated using (true);
create policy departments_manage_hr on public.departments for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy positions_read_authenticated on public.positions for select to authenticated using (true);
create policy positions_manage_hr on public.positions for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));

create policy employees_read_hr on public.employees for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy employees_insert_hr on public.employees for insert to authenticated
  with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy employees_update_hr on public.employees for update to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy employees_delete_admin on public.employees for delete to authenticated
  using (public.has_any_role(array['master', 'admin']));

create policy daily_read_payroll on public.daily_allowances for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'payroll']));
create policy daily_insert_payroll on public.daily_allowances for insert to authenticated
  with check (public.has_any_role(array['master', 'admin', 'payroll']));
create policy daily_update_payroll on public.daily_allowances for update to authenticated
  using (public.has_any_role(array['master', 'admin', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'payroll']));
create policy daily_delete_admin on public.daily_allowances for delete to authenticated
  using (public.has_any_role(array['master', 'admin']));

create policy ppe_items_read_authenticated on public.ppe_items for select to authenticated using (true);
create policy ppe_items_manage_hr on public.ppe_items for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy ppe_movements_read_hr on public.ppe_movements for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy ppe_movements_insert_hr on public.ppe_movements for insert to authenticated
  with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));

create policy badges_read_hr on public.badges for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy badges_manage_hr on public.badges for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));

create policy exams_read_private on public.occupational_exams for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy exams_manage_private on public.occupational_exams for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy certificates_read_private on public.medical_certificates for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy certificates_manage_private on public.medical_certificates for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy disciplinary_read_private on public.disciplinary_records for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy disciplinary_manage_private on public.disciplinary_records for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));

create policy hr_processes_read_private on public.hr_processes for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_processes_manage_private on public.hr_processes for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_checklist_read_private on public.hr_checklist_items for select to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_checklist_manage_private on public.hr_checklist_items for all to authenticated
  using (public.has_any_role(array['master', 'admin', 'hr', 'payroll'])) with check (public.has_any_role(array['master', 'admin', 'hr', 'payroll']));

create policy audit_master_only on public.audit_logs for select to authenticated
  using (public.current_app_role() = 'master');

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.companies, public.units, public.departments, public.positions to authenticated;
grant select, insert, update, delete on public.employees, public.daily_allowances, public.ppe_items, public.badges,
  public.occupational_exams, public.medical_certificates, public.disciplinary_records, public.hr_processes,
  public.hr_checklist_items to authenticated;
grant select, insert on public.ppe_movements to authenticated;
grant select on public.audit_logs to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hr-documents', 'hr-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy hr_documents_read_private on storage.objects for select to authenticated
  using (bucket_id = 'hr-documents' and public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_documents_upload_private on storage.objects for insert to authenticated
  with check (bucket_id = 'hr-documents' and public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_documents_update_private on storage.objects for update to authenticated
  using (bucket_id = 'hr-documents' and public.has_any_role(array['master', 'admin', 'hr', 'payroll']))
  with check (bucket_id = 'hr-documents' and public.has_any_role(array['master', 'admin', 'hr', 'payroll']));
create policy hr_documents_delete_private on storage.objects for delete to authenticated
  using (bucket_id = 'hr-documents' and public.has_any_role(array['master', 'admin', 'hr', 'payroll']));