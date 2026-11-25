-- 운영 DB의 Supabase 기본 권한과 같게 맞춘다. 보안은 RLS가 맡는다.
-- 함수 실행 권한은 각 마이그레이션의 grant/revoke가 기준이다. 여기서 함수를 일괄 grant하지 않는다.

grant select, insert, update, delete, truncate, references, trigger
  on all tables in schema public to anon, authenticated, service_role;
grant usage, select, update on all sequences in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete, truncate, references, trigger on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;
