-- 일기 공유 링크. 토큰을 아는 사람만 공개 항목을 본다.
-- 경로·보호자 정보는 이 함수가 돌려주지 않는다.

alter table public.share_cards
  add column token text,
  add column revoked_at timestamptz;

alter table public.share_cards
  alter column image_url drop not null;

create unique index share_cards_token_key on public.share_cards (token);

create or replace function public.ensure_diary_share_link(target_diary_id uuid)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  row_id uuid;
  row_token text;
  new_token text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- 이미 발급한 토큰이 있으면 그 행을 다시 켠다. 빈 행이 나중에 생겨도 주소는 그대로다.
  select sc.id, sc.token
    into row_id, row_token
  from public.share_cards sc
  where sc.diary_id = target_diary_id
  order by (sc.token is not null) desc, sc.created_at desc
  limit 1;

  if row_id is null then
    new_token := encode(extensions.gen_random_bytes(24), 'hex');
    insert into public.share_cards (diary_id, image_url, token)
    values (target_diary_id, null, new_token);
    return new_token;
  end if;

  if row_token is null then
    new_token := encode(extensions.gen_random_bytes(24), 'hex');
  else
    new_token := row_token;
  end if;

  update public.share_cards
  set token = new_token,
      revoked_at = null
  where id = row_id;

  return new_token;
end;
$$;

create or replace function public.stop_diary_share_link(target_diary_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.share_cards
  set revoked_at = now()
  where diary_id = target_diary_id
    and revoked_at is null;
end;
$$;

create or replace function public.get_shared_diary(share_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'dogName', d.name,
    'content', di.diary_content,
    'dailyQuote', di.daily_quote,
    'createdAt', di.created_at,
    'distanceMeter', w.distance_meter,
    'durationSec', w.duration_sec,
    'photos', coalesce((
      select jsonb_agg(
        jsonb_build_object('imageUrl', wp.image_url, 'sortOrder', wp.sort_order)
        order by wp.sort_order
      )
      from public.walk_photos wp
      where wp.walk_id = w.id
    ), '[]'::jsonb)
  )
  from public.share_cards sc
  join public.diaries di on di.id = sc.diary_id
  join public.dogs d on d.id = di.dog_id
  join public.walks w on w.id = di.walk_id
  where sc.token = share_token
    and sc.revoked_at is null
  limit 1;
$$;

revoke all on function public.ensure_diary_share_link(uuid) from public, anon;
grant execute on function public.ensure_diary_share_link(uuid) to authenticated;

revoke all on function public.stop_diary_share_link(uuid) from public, anon;
grant execute on function public.stop_diary_share_link(uuid) to authenticated;

revoke all on function public.get_shared_diary(text) from public;
grant execute on function public.get_shared_diary(text) to anon, authenticated;
