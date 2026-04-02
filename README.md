# FitBlock - 体趣方块

基于计算机视觉的健身小游戏，将经典俄罗斯方块与体感控制结合，让你在游戏中完成上肢运动。

## 功能特性

### 经典游戏玩法
- 7 种经典方块（I、L、J、O、S、T、Z）
- 完整俄罗斯方块操作：下落、移动、旋转、消除
- 得分与连击系统
- 10 级难度递进

### 体感控制
- 6 种手臂动作控制游戏
- 实时姿态识别（MediaPipe Pose）
- 动作校准功能
- 摄像头实时预览

### 健身数据统计
- 有效动作计数（分左右臂）
- 卡路里消耗估算
- 手臂运动平衡度
- 运动时长记录

### 多种游戏模式

| 模式 | 描述 | 速度 | 动作阈值 |
|------|------|------|----------|
| 经典模式 | 标准玩法 | 1x | 标准 |
| 肩颈放松 | 舒缓动作 | 0.7x | 降低 20% |
| 燃脂强化 | 高强度 | 1.2x | 标准 |
| 康复训练 | 慢速自定义 | 0.5x | 降低 30% |

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

## 操作说明

### 键盘控制

| 按键 | 操作 |
|------|------|
| 左箭头 | 左移 |
| 右箭头 | 右移 |
| 上箭头 | 旋转 |
| 下箭头 | 加速下落 |
| 空格 | 暂停/继续 |
| Enter | 开始游戏 |

### 体感控制

| 动作 | 游戏操作 |
|------|----------|
| 左臂水平左挥 | 方块左移 |
| 右臂水平右挥 | 方块右移 |
| 双臂同时上抬 | 方块旋转 |
| 双臂快速下压 | 快速下落 |
| 单臂前推 | 暂停 1 秒 |
| 双臂交叉 | 暂停/继续 |
| C 键 | 姿态校准 |

## 技术架构

```
FitBlock/
├── electron/              # Electron 主进程
│   ├── main.cjs           # 主窗口管理
│   └── preload.cjs        # 预加载脚本
├── src/
│   ├── game/              # 游戏逻辑
│   │   ├── Game.js        # 游戏主类
│   │   ├── Board.js       # 游戏板
│   │   ├── Piece.js       # 方块定义
│   │   └── Renderer.js    # Canvas 渲染
│   ├── pose/              # 姿态识别
│   │   ├── PoseDetector.js     # MediaPipe 封装
│   │   └── MotionMapper.js     # 动作映射
│   ├── fitness/           # 健身数据
│   │   └── FitnessTracker.js
│   ├── ui/                # UI 组件
│   │   ├── UIManager.js
│   │   └── CameraView.js
│   ├── styles/            # 样式文件
│   └── utils/             # 工具函数
│       └── constants.js
├── public/                # 静态资源
└── release/               # 打包输出
```

## 桌面应用打包

### 开发模式

```bash
npm run electron:dev
```

### 打包应用

```bash
# 构建绿色版
npm run electron:build

# 构建安装包（需要 Windows + wine）
npm run electron:dist
```

### Windows 部署

1. 将 `release/win-unpacked` 整个文件夹复制到 Windows 电脑
2. 双击 `FitBlock.exe` 即可运行

## Web 部署方案

### 方案一：静态部署（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/FitBlock/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # HTTPS 配置（摄像头需要）
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
}
```

重启 Nginx：
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 方案二：Vercel 部署

```bash
npm i -g vercel
vercel --prod
```

### 方案三：PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "fitblock" -- run dev

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 方案四：Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
```

构建运行：
```bash
docker build -t fitblock .
docker run -d -p 3000:3000 --name fitblock fitblock
```

### 方案五：宝塔面板部署

1. 在宝塔中创建 Python 项目（选择静态）
2. 上传 `dist` 目录内容
3. 配置静态网站
4. 开启 HTTPS
5. 设置反代理（如需要）

## 配置说明

### Vite 配置

修改 `vite.config.js` 添加域名白名单：

```javascript
export default defineConfig({
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['your-domain.com', '.your-domain.com']
  }
})
```

### 动作阈值调整

在游戏设置面板中调整：

| 参数 | 默认值 | 可调范围 |
|------|--------|----------|
| 挥臂角度 | 60° | 45° - 90° |
| 抬起角度 | 90° | 70° - 110° |
| 前推角度 | 120° | 100° - 150° |

### 环境变量

```bash
# .env 文件
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

## 常见问题

### Q: 摄像头无法启动？

1. 检查浏览器是否授权摄像头权限
2. 确保使用 HTTPS 访问（摄像头需要安全上下文）
3. 确认没有其他应用占用摄像头
4. 尝试刷新页面或重启浏览器

### Q: 体感识别不准确？

1. 确保光线充足（建议 100-500lux）
2. 按 C 键进行姿态校准
3. 调整设置中的动作阈值
4. 确保上半身在摄像头范围内

### Q: 游戏卡顿？

1. 查看左上角帧率显示（目标 60FPS）
2. 关闭其他占用摄像头的应用
3. 降低游戏难度
4. 尝试使用 Chrome 或 Edge 浏览器

### Q: 如何离线使用？

下载 Windows 绿色版，脱离浏览器独立运行：

```
release/win-unpacked/FitBlock.exe
```

## 技术栈

- **前端框架**: HTML5 + CSS3 + JavaScript ES6+
- **游戏引擎**: Canvas 2D 自研
- **姿态识别**: MediaPipe Pose (Google)
- **桌面打包**: Electron
- **构建工具**: Vite

## 浏览器兼容

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 90+ | 完全支持 |
| Edge | 90+ | 完全支持 |
| Firefox | 88+ | 完全支持 |
| Safari | 14+ | 部分支持 |
| IE | - | 不支持 |

## 隐私说明

- 摄像头数据仅在本地处理，不会上传到任何服务器
- 所有姿态识别在浏览器端实时完成
- 不存储任何用户生物特征数据
- 游戏数据保存在浏览器本地存储

## 开发路线图

- [ ] 联机对战功能
- [ ] 全球排行榜
- [ ] 道具系统
- [ ] 历史数据图表分析
- [ ] 运动报告导出（PDF/Excel）
- [ ] 新手引导教程
- [ ] 康复动作标准度检测

## 许可证

MIT License

## 更新日志

### v1.0.0 (2026-04-02)

- 初始版本发布
- 经典俄罗斯方块游戏核心玩法
- MediaPipe Pose 姿态识别
- 6 种体感动作控制
- 健身数据统计（动作计数、卡路里、平衡度）
- 4 种游戏模式
- Electron 桌面应用打包支持
