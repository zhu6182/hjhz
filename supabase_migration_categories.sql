-- 1. 创建分类表
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- 2. 开启 RLS (安全策略)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. 允许所有访问 (为了演示方便，允许读写)
CREATE POLICY "Public Access" ON public.categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. 插入初始数据 (迁移现有硬编码分类)
INSERT INTO public.categories (name) VALUES 
('木纹'), 
('纯色'), 
('金属'), 
('肤感'), 
('大理石纹')
ON CONFLICT (name) DO NOTHING;
