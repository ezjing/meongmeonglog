alter table public.users
  add column if not exists guardian_profile_image text;
