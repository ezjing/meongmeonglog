-- 여러 마리 산책은 사진을 한 번만 보고, 장면 설명을 산책 행에 저장한다.
-- 강아지별 일기는 이 글을 넣고, 사진은 다시 보내지 않는다.
-- 산책을 지우면 이 칸도 함께 지워진다. 앱은 읽지 않고 서버(service role)만 쓴다.

alter table public.walks add column if not exists photo_description text;
