alter table public.dogs
  add column if not exists weight_kg numeric(5, 2);
