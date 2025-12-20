# 部署适配计划：接入 Supabase 云数据库

为了让应用在 Netlify 上部署后能够正常存储和共享色卡数据，我们将从 LocalStorage 迁移到 Supabase。

## 1. 准备工作（用户操作）
您需要先完成以下 Supabase 的基础创建（完全免费）：
1.  访问 [Supabase.com](https://supabase.com/) 并注册/登录。
2.  点击 **"New Project"** 创建一个新项目（名称如 `furnicolor`，数据库密码请记好）。
3.  等待项目初始化完成后，进入 **Project Settings -> API**，找到以下两个信息：
    *   **Project URL**
    *   **anon / public Key**

## 2. 数据库与存储设置（用户操作，我会提供 SQL）
在 Supabase 的 **SQL Editor** 中，运行我稍后提供的 SQL 脚本，一键创建：
*   `palettes` 数据表。
*   `textures` 存储桶（用于存图片）。
*   设置开放的读写权限策略（RLS Policies），确保前端可以读写。

## 3. 代码改造（我来执行）
*   **安装依赖**：`npm install @supabase/supabase-js`
*   **配置环境**：在 `.env.local` 中添加 Supabase 的 URL 和 Key。
*   **重构服务**：
    *   修改 `services/backendService.ts`，用 Supabase SDK 替换 LocalStorage。
    *   实现 `uploadTexture` 方法，处理图片上传。
*   **数据迁移**：修改前端逻辑，确保新上传的图片走云存储路径。

## 4. 验证
*   在本地运行 `npm run dev`。
*   测试在“后台管理”添加一个带纹理的色卡。
*   验证刷新页面后数据是否依然存在（且数据来源已变为云端）。
