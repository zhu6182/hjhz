
-- 1. 创建色卡表
create table palettes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  hex text not null,
  category text not null,
  finish text not null,
  image_url text
);

-- 2. 启用行级安全 (RLS) 但允许公开读写 (为了简化Demo，生产环境建议加上认证限制)
alter table palettes enable row level security;

create policy "Enable read access for all users"
on palettes for select
using (true);

create policy "Enable insert access for all users"
on palettes for insert
with check (true);

create policy "Enable update access for all users"
on palettes for update
using (true);

create policy "Enable delete access for all users"
on palettes for delete
using (true);

-- 3. 创建存储桶 (Storage Bucket) 用于存放纹理图片
insert into storage.buckets (id, name, public) 
values ('textures', 'textures', true);

-- 4. 确保存储桶允许公开上传和下载
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'textures' );

create policy "Public Insert"
on storage.objects for insert
with check ( bucket_id = 'textures' );
