# Chess Board App

## 项目简介
Chess Board App 是一个可自定义的棋局应用，允许用户在本地运行并进行棋局操作。该项目旨在提供一个简单易用的界面，用户可以通过该界面创建和管理自己的棋局。

## 文件结构
```
chess-board-app
├── src
│   ├── index.html          # 应用的主HTML文件
│   ├── app.ts              # 应用的入口文件
│   ├── components
│   │   ├── Board.ts        # 棋盘组件
│   │   ├── Piece.ts        # 棋子组件
│   │   └── Controls.ts     # 控件组件
│   ├── styles
│   │   ├── main.css        # 主样式文件
│   │   └── board.css       # 棋盘样式文件
│   ├── types
│   │   └── index.ts        # 类型定义文件
│   ├── store
│   │   └── gameState.ts    # 游戏状态管理
│   └── utils
│       └── boardHelper.ts  # 辅助函数
├── public
│   └── favicon.svg         # 网站图标
├── tests
│   ├── board.test.ts       # 棋盘组件单元测试
│   └── piece.test.ts       # 棋子组件单元测试
├── .env                    # 环境变量配置文件
├── .env.example            # 环境变量示例文件
├── .gitignore              # Git忽略文件
├── package.json            # npm配置文件
├── tsconfig.json           # TypeScript配置文件
├── vite.config.ts          # Vite配置文件
└── README.md               # 项目文档
```

## 安装与使用
1. 克隆项目到本地：
   ```
   git clone <repository-url>
   cd chess-board-app
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动开发服务器：
   ```
   npm run dev
   ```

4. 打开浏览器访问 `http://localhost:3000` 查看应用。

## 未来计划
- 增加更多棋子类型和规则。
- 提供在线多人对战功能。
- 支持棋局的保存和加载功能。

## 贡献
欢迎任何形式的贡献！请提交问题或拉取请求。