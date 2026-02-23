-- ==============================================
-- Recipe Management System - Supabase Migration
-- Run this in the Supabase SQL Editor
-- ==============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

create table if not exists recipes (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  servings    integer,
  prep_time   integer,  -- minutes
  cook_time   integer,  -- minutes
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists ingredients (
  id          uuid primary key default uuid_generate_v4(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  name        text not null,
  quantity    numeric,
  unit        text not null default '',
  order_index integer not null default 0
);

create table if not exists recipe_steps (
  id          uuid primary key default uuid_generate_v4(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  description text not null,
  image_url   text,
  order_index integer not null default 0
);

create table if not exists tags (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null unique,
  color text not null default '#6366f1'
);

create table if not exists recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id    uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

create index if not exists idx_ingredients_recipe_id on ingredients(recipe_id);
create index if not exists idx_recipe_steps_recipe_id on recipe_steps(recipe_id);
create index if not exists idx_recipe_tags_recipe_id on recipe_tags(recipe_id);
create index if not exists idx_recipe_tags_tag_id on recipe_tags(tag_id);

-- ─────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security (public read, no auth required)
-- ─────────────────────────────────────────────

alter table recipes     enable row level security;
alter table ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table tags        enable row level security;
alter table recipe_tags enable row level security;

-- Allow full access for everyone (single-user personal app, no auth)
create policy "allow all on recipes"      on recipes      for all using (true) with check (true);
create policy "allow all on ingredients"  on ingredients  for all using (true) with check (true);
create policy "allow all on recipe_steps" on recipe_steps for all using (true) with check (true);
create policy "allow all on tags"         on tags         for all using (true) with check (true);
create policy "allow all on recipe_tags"  on recipe_tags  for all using (true) with check (true);

-- ─────────────────────────────────────────────
-- Storage bucket
-- ─────────────────────────────────────────────

-- Run this in the Storage section of Supabase dashboard:
-- Create a public bucket named "recipe-images"
-- Or run via SQL:
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "allow all on recipe-images"
  on storage.objects for all
  using (bucket_id = 'recipe-images')
  with check (bucket_id = 'recipe-images');

-- ─────────────────────────────────────────────
-- Add cooking-mode timer duration to steps
-- ─────────────────────────────────────────────

alter table recipe_steps add column if not exists duration integer; -- minutes

-- ─────────────────────────────────────────────
-- Recipe lock: SHA-256 hash of password (null = unlocked)
-- ─────────────────────────────────────────────

alter table recipes add column if not exists lock_password text; -- SHA-256 hex hash, null means unlocked

-- ─────────────────────────────────────────────
-- Sample tags
-- ─────────────────────────────────────────────

insert into tags (name, color) values
  ('ארוחת בוקר', '#f59e0b'),
  ('ארוחת צהריים', '#10b981'),
  ('ארוחת ערב', '#6366f1'),
  ('קינוח', '#ec4899'),
  ('טבעוני', '#22c55e'),
  ('צמחוני', '#84cc16'),
  ('בשר', '#ef4444'),
  ('דגים', '#06b6d4'),
  ('מהיר', '#8b5cf6'),
  ('בריא', '#14b8a6')
on conflict (name) do nothing;
