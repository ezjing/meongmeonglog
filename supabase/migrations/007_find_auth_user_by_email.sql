-- 소셜 로그인 시 Auth 사용자를 이메일로 바로 찾는다.
-- 기존에는 auth.admin.listUsers로 전체 사용자를 1000명씩 끝까지 훑어 가입자가 늘수록 로그인이 느려졌다.
-- Edge Function(service_role)만 호출할 수 있다.

create or replace function public.find_auth_user_id_by_email(target_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  -- Supabase Auth는 이메일을 소문자로 저장한다
  select id from auth.users where email = lower(target_email) limit 1;
$$;

revoke all on function public.find_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_auth_user_id_by_email(text) to service_role;
