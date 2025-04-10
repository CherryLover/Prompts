# AI提示词管理工具

> 🚀 基于React和Supabase构建的现代化AI提示词管理系统，支持标签分类、快速搜索和快捷键操作，让AI提示词管理更高效。

## 项目简介

AI提示词管理工具是一个专为AI爱好者、开发者和内容创作者设计的提示词管理系统，帮助用户高效管理、组织和复用各类AI模型的提示词。AI提示词管理工具是一个用于创建、存储、搜索和管理AI提示词（Prompts）的React应用程序。该工具可帮助用户有效地组织和使用自己的AI提示词库，提高与AI交互的效率。

## 核心功能

- **提示词管理**：创建、编辑、删除和收藏AI提示词
- **标签系统**：为提示词添加标签，便于分类和搜索
- **模型推荐**：标记适用于特定AI模型的提示词
- **全文搜索**：快速检索提示词，支持标题和内容搜索
- **标签搜索**：通过`tag:`语法进行精确标签搜索
- **快捷键支持**：使用键盘快捷键快速操作（搜索、导航等）

## 技术栈

- **前端框架**：React 18 + TypeScript
- **UI组件**：Chakra UI
- **状态管理**：React Hooks
- **数据存储**：Supabase（PostgreSQL云数据库）
- **构建工具**：Vite
- **依赖管理**：npm

## 项目结构

```
src/
├── components/         # 组件目录
│   ├── PromptForm.tsx  # 提示词创建表单
│   ├── PromptList.tsx  # 提示词列表与管理
│   └── SearchModal.tsx # 搜索弹窗组件
├── lib/
│   └── supabase.ts     # Supabase客户端配置
├── App.tsx             # 应用主组件
├── types.ts            # 类型定义
└── main.tsx            # 应用入口
```

## 安装与配置

1. 克隆仓库并安装依赖

```bash
git clone <repository-url>
cd ai-prompt-manager
npm install
```

2. 配置环境变量

创建一个`.env`文件，添加以下配置：

```
VITE_SUPABASE_URL=<您的Supabase项目URL>
VITE_SUPABASE_ANON_KEY=<您的Supabase匿名密钥>
```

3. 运行开发服务器

```bash
npm run dev
```

## 数据库结构

项目使用Supabase作为后端数据库，需要创建以下表结构：

**prompts表**
- `id`: UUID (主键)
- `title`: 字符串 (提示词标题)
- `content`: 文本 (提示词内容)
- `tags`: 字符串数组 (标签)
- `models`: 字符串数组 (适用的AI模型)
- `favorite`: 布尔值 (是否收藏)
- `created_at`: 时间戳 (创建时间)
- `updated_at`: 时间戳 (更新时间)
- `user_id`: UUID (用户ID，可选)

## 使用指南

### 提示词创建

1. 点击"创建提示词"标签页
2. 填写提示词标题和内容
3. 可选：添加标签（使用逗号分隔）
4. 可选：添加适用的AI模型（使用逗号分隔）
5. 点击提交按钮保存

### 提示词搜索

1. 按`Command+K`（Mac）或`Ctrl+K`（Windows/Linux）打开搜索弹窗
2. 输入搜索关键词
3. 使用上下箭头键选择结果
4. 按Enter键复制选中的提示词

### 标签搜索

在搜索框中使用`tag:标签名`格式进行标签搜索。

### 键盘快捷键

- `Command+K` / `Ctrl+K`: 打开搜索窗口
- `←` / `→`: 切换主页标签页
- 搜索窗口内:
  - `↑` / `↓`: 导航搜索结果
  - `Enter`: 复制选中的提示词
  - `Esc`: 关闭搜索窗口或返回搜索框

## 贡献指南

欢迎贡献代码或提出改进建议！请通过Issues或Pull Requests参与项目开发。

## 许可证

[MIT License](LICENSE) 