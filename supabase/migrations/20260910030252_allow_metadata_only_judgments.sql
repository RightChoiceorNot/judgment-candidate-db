alter table public.raw_judgments
  alter column judgment_text drop not null;

alter table public.raw_judgments
  add column full_text_available boolean not null default false;

update public.raw_judgments
set full_text_available = true
where judgment_text is not null;