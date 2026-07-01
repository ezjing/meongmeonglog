alter table public.users
  add column if not exists guardian_title text,
  add column if not exists parenting_style text,
  add column if not exists current_concern text;
