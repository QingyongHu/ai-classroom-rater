# AI 评课挑战 · 童心智教 / CUHK-SZ

> 你的评课直觉准不准？看完视频你来打分，看看和 AI 差多少。

## 项目简介

AI Classroom Rater 是一个面向展览展位的移动端交互式单页应用（SPA），由 **童心智教 / 香港中文大学（深圳）** 团队开发。

参观者可以：
1. 观看幼儿园教学视频片段
2. 从多个维度对教学过程进行评分
3. 将自己的评分与 AI 预评分进行对比
4. 生成分享卡片，查看排行榜

## 在线体验

部署于阿里云 ECS，通过 GitHub Actions 自动部署。

## 技术栈

- **纯前端**：HTML + CSS + Vanilla JavaScript，无构建步骤，无框架依赖
- **Chart.js**：雷达图可视化（用户评分 vs AI 评分）
- **html2canvas**：分享卡片截图
- **数据**：所有内容为预置 JSON，无真实 AI 推理

## 项目结构

```
├── index.html              # 主 SPA 入口（6 个页面段落）
├── leaderboard.html         # 排行榜（大屏展示）
├── css/style.css            # 全局样式
├── js/
│   ├── app.js               # App 命名空间 + 路由
│   ├── state.js             # 集中式状态管理
│   ├── router.js            # Hash 路由
│   ├── videoplayer.js       # 视频播放器
│   ├── rating.js            # 评分交互
│   ├── radarchart.js        # 雷达图（Chart.js）
│   ├── sharecard.js         # 分享卡片生成
│   └── leaderboard.js       # 排行榜逻辑
├── data/
│   ├── videos.json          # 3 个视频及其评分维度
│   └── seed-leaderboard.json # 60 条预生成排行数据
├── assets/                  # 视频、缩略图、Logo
└── .github/workflows/       # GitHub Actions 自动部署
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/QingyongHu/ai-classroom-rater.git
cd ai-classroom-rater

# 本地启动（任选一种）
python3 -m http.server 8081
# 或
npx serve .

# 打开浏览器访问
open http://localhost:8081
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动通过 SCP 将文件部署到阿里云 ECS 服务器。

## 致谢

- 视频素材来源于公开平台，仅用于学术展示与教育讨论
- 由香港中文大学（深圳）童心智教团队开发

## License

MIT
