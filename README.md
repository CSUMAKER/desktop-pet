# 🐧 桌面宠物 (Desktop Pet)

一个基于 Electron 的桌面陪伴应用，在你的屏幕上放置一只可爱的像素风宠物，它会跟随鼠标移动、和你互动、打呼噜睡觉，还会时不时冒出有趣的对话框。

> "人家是企鹅啦！"

## ✨ 功能特性

### 🎭 四种状态行为

| 状态 | 说明 |
|------|------|
| **待机 (Idle)** | 静止呼吸，周围飘浮金色星光粒子 |
| **行走 (Walking)** | 跟随鼠标位置缓慢移动，身体上下弹跳 |
| **问候 (Greeting)** | 点击时蹦跳回应，随机说出一句中文台词，粉色爱心粒子绽放 |
| **睡眠 (Sleeping)** | 漂浮打盹，头顶冒出 "Zzz" 蓝色气泡 |

状态之间自动流转：待机 → (3~18秒随机) → 行走(35%) / 睡眠(65%) → 待机，循环往复。

### 🖱️ 交互方式

- **左键点击宠物**：触发问候或唤醒（如果正在睡觉），移动距离小于 6px 视为点击
- **左键拖拽窗口**：按住鼠标左键拖动即可移动整个窗口，移动距离超过 6px 视为拖拽
- **右键菜单**：弹出"退出桌面宠物"选项
- **鼠标悬停**：宠物会向鼠标方向微微倾斜，仿佛在看你

### 🌈 视觉效果

- **粒子系统**：Canvas 实时渲染三种粒子——星光✨、爱心💗、呼噜Zzz，最多 150 个粒子同时存在
- **CSS 动画**：呼吸、弹跳、漂浮、蹦跳等多种关键帧动画，根据状态自动切换
- **对话气泡**：窗口内弹出的对话框，显示宠物的随机台词
- **像素风渲染**：`image-rendering: pixelated` 确保角色精灵图清晰锐利

### 📐 紧凑窗口设计

- **60×60 像素** 的小窗口，不遮挡桌面内容
- 始终置顶显示，透明背景
- 窗口靠近屏幕边缘时自动吸附，不会掉出视野

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                  Main Process                    │
│  ┌──────────────┐  ┌───────────────┐             │
│  │ EdgeDetector  │  │  MouseTracker │             │
│  │ (边缘吸附)    │  │ (鼠标追踪)     │             │
│  └──────┬───────┘  └───────┬───────┘             │
│         └──────────┬───────┘                       │
│                    │ IPC (webContents.send)        │
└────────────────────┼───────────────────────────────┘
                     │
              ┌──────▼───────┐
              │  Preload     │  (contextBridge)
              │  petAPI      │
              └──────┬───────┘
                     │
┌────────────────────▼───────────────────────────────┐
│                 Renderer Process                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  State   │  │ Particle │  │ Dialog   │         │
│  │ Machine  │  │  System  │  │  Bubble  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       └──────┬───────┴──────┬──────┘               │
│              ▼              ▼                       │
│         ┌─────────────────────┐                     │
│         │       App.js        │  (核心控制器)        │
│         └─────────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

### 进程分工

| 进程 | 职责 |
|------|------|
| **Main** | 创建 60×60 小窗口、管理边缘吸附服务、轮询鼠标位置、广播窗口边界坐标、右键菜单 |
| **Preload** | 通过 `contextBridge` 安全暴露 IPC 订阅接口给渲染进程 |
| **Renderer** | 状态机驱动行为、DOM 渲染角色与气泡、Canvas 粒子效果、点击/拖拽交互处理、鼠标跟随行走 |

### 核心技术栈

- **Electron 33** — 跨平台桌面应用框架
- **纯原生 JavaScript** — 零外部运行时依赖（仅 Electron 自身）
- **electron-builder** — 打包分发
- **Canvas API** — 粒子系统渲染
- **CSS3 Animations** — 状态动画
- **IPC (contextBridge)** — 进程间通信

## 📁 项目结构

```
desktop-pet/
├── src/
│   ├── main/                  # 主进程
│   │   ├── index.js           # 入口：窗口创建、服务初始化、IPC 处理
│   │   ├── EdgeDetector.js    # 边缘检测与吸附
│   │   └── MouseTracker.js    # 鼠标位置轮询
│   ├── preload/
│   │   └── index.js           # 安全桥接：暴露 petAPI
│   └── renderer/              # 渲染进程
│       ├── index.html          # 四层 DOM 结构
│       ├── assets/
│       │   └── pet-sprite.png  # 角色精灵图 (60x60)
│       ├── css/
│       │   ├── pet.css         # 布局与样式
│       │   └── animations.css  # 关键帧动画
│       └── js/
│           ├── App.js          # 主控制器
│           ├── StateMachine.js # 状态机 (IDLE/WALKING/GREETING/SLEEPING)
│           ├── ParticleSystem.js # Canvas 粒子系统
│           └── DialogBubble.js   # 对话气泡管理
├── scripts/
│   ├── generate-pixel-art.js   # 像素风风格化转换
│   └── preprocess-image.js     # 图像预处理（去背景、裁剪、抗锯齿）
├── resources/                  # 构建资源
├── package.json
└── .gitignore
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Electron 33

### 安装与运行

```bash
# 安装依赖
npm install

# 启动应用
npm start
```

### 图像预处理（可选）

如果你有原始角色图片 `OIP-C.webp`，可以运行脚本重新生成精灵图：

```bash
# 预处理：去背景、裁剪、抗锯齿
npm run preprocess

# 像素风风格化
node scripts/generate-pixel-art.js
```

## ⌨️ 使用说明

1. 启动后 60×60 的宠物窗口出现在主显示器中央
2. 宠物会自己待机、走路、打瞌睡
3. **左键点击**宠物 → 打招呼或唤醒（正在睡觉时）
4. **左键拖拽**窗口 → 移动宠物到任意位置
5. **右键** → 退出桌面宠物

## 🛠️ 自定义

### 修改对话内容

编辑 `src/renderer/js/App.js` 中的问候语和唤醒语数组。

### 调整状态概率与时序

编辑 `src/renderer/js/StateMachine.js` 构造函数中的选项：

```javascript
const stateMachine = new StateMachine({
  idleMinDuration: 3000,    // 待机最短等待 (ms)
  idleMaxDuration: 15000,   // 待机最长等待 (ms)
  walkDuration: 3000,       // 行走持续时间 (ms)
  greetDuration: 3000,      // 问候持续时间 (ms)
  walkProbability: 0.35,    // 选择行走的概率
});
```

### 修改窗口大小

同时修改以下文件中的 `WINDOW_SIZE` 常量：
- `src/main/index.js`
- `src/renderer/js/App.js`

### 修改粒子效果

编辑 `src/renderer/js/ParticleSystem.js` 中的粒子类型、颜色、速度、生命周期等参数。

### 打包发布

```bash
npx electron-builder --win
```

会生成 Windows 安装包，输出目录为 `dist/`。

## 📄 许可证

MIT
