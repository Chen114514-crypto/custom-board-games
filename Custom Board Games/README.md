# Custom Board Games

## 项目简介
Custom Board Games 是一个允许用户自定义棋局的网页应用。用户可以创建、保存和加载自己的棋盘，并且可以在个人中心修改用户名和头像，查看自己的棋盘列表。

## 技术栈
- **前端**: HTML, CSS, JavaScript
- **后端**: Node.js, Express
- **数据库**: MongoDB (或其他数据库，根据需求)

## 项目结构
```
Custom Board Games
├── frontend
│   ├── index.html          # 主入口文件
│   ├── auth.html           # 用户认证页面
│   └── profile.html        # 用户个人中心页面
├── backend
│   ├── src
│   │   ├── app.ts          # Express 应用初始化
│   │   ├── server.ts       # 启动服务器
│   │   ├── controllers
│   │   │   ├── authController.ts  # 认证控制器
│   │   │   └── profileController.ts # 个人中心控制器
│   │   ├── routes
│   │   │   ├── authRoutes.ts  # 认证相关路由
│   │   │   └── profileRoutes.ts # 个人中心相关路由
│   │   ├── middlewares
│   │   │   ├── authMiddleware.ts  # 认证中间件
│   │   │   └── uploadMiddleware.ts # 文件上传中间件
│   │   ├── models
│   │   │   ├── User.ts       # 用户模型
│   │   │   └── Board.ts      # 棋盘模型
│   │   ├── services
│   │   │   ├── authService.ts  # 认证服务
│   │   │   └── profileService.ts # 个人中心服务
│   │   ├── utils
│   │   │   └── jwt.ts        # JWT 工具函数
│   │   └── types
│   │       └── index.ts      # TypeScript 类型定义
│   ├── uploads
│   │   └── avatars           # 用户头像上传目录
│   ├── package.json          # 后端依赖和脚本配置
│   ├── tsconfig.json         # TypeScript 配置文件
│   └── .env.example          # 环境变量示例
└── README.md                 # 项目文档
```

## 安装与运行
1. 克隆项目：
   ```bash
   git clone <repository-url>
   cd Custom Board Games
   ```

2. 安装后端依赖：
   ```bash
   cd backend
   npm install
   ```

3. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`，并根据需要修改配置。

4. 启动后端服务器：
   ```bash
   npm start
   ```

5. 启动前端：
   - 直接打开 `frontend/index.html` 文件，或使用本地服务器。

## 使用说明
- 用户可以通过 `auth.html` 页面进行注册和登录。
- 登录后，用户可以访问 `profile.html` 页面，修改用户名和头像，并查看自己的棋盘列表。
- 用户可以在主页面创建和管理棋盘。

## 贡献
欢迎任何形式的贡献！请提交问题或拉取请求。

## 许可证
本项目采用 MIT 许可证。