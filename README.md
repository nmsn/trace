# Trace Monorepo

TypeScript 函数库与 Next.js 测试应用

## 项目结构

```
trace/
├── apps/
│   └── web/          # Next.js 应用
├── packages/
│   ├── core/         # 核心功能库
│   └── utils/        # 实用工具库
```

## 开始使用

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建项目：

```bash
npm run build
```

## 技术栈

- TypeScript
- Next.js
- Turbo (Monorepo 管理)
- tsup (TypeScript 库构建)