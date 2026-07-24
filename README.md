# 炉石竞技场 传奇推断器（原型）

说明
- 这是一个 Electron + TypeScript + React 的桌面原型，用于在竞技场中基于手动录入的观测推断对手可能拥有的传奇卡。
- 实现了两类推断：
  - 独立近似（即时返回，适合 UI）
  - 后台重要性采样（异步，提供更准确的后验估计）

功能（已实现的最重要功能）
- 手动录入观测（对手打出 / 展示 / Mulligan / 生成等）
- 显示候选传奇的 prior / posterior / 已见标记
- 保存对局到本地 SQLite（用户目录）
- 后台重要性采样（简化版）

快速启动
1. 安装依赖
   npm install

2. 开发启动（在两个进程中运行 Vite + Electron）
   npm run dev

3. 打包（需 electron-builder 配置自定义）
   npm run build

项目结构（重要文件）
- electron/ : Electron 主进程、preload、后端模块
- src/renderer/ : React 前端
- shared/types.ts : 前后端共享类型
- electron/data/legendaries.json : 示例传奇卡表（可替换为完整数据）
- 用户数据库保存在：Electron userData 目录中的 app.db

工程说明与后续改进建议
- 当前重要性采样对似然做了简化（只判断与观测是否“兼容”）。要提高精度，请把 computeLikelihood() 替换为：
  - 更精确的超几何概率计算（考虑抽牌顺序 / 已打数量）
  - 模拟 draw/play 策略并计算观测出现概率
- 可在 inferenceEngine 中增加 MCMC / SMC 的完整实现以处理观测序列和在线更新。
- 如果需要 Overlay（覆盖炉石窗口），需额外开发窗口透明与点击穿透的功能，并遵守暴雪的工具使用条款。

注意事项（合规）
- 本工具仅基于你手动输入的观测并在本地运行；不包含任何自动化操作、内存读取或注入功能。
- 使用时请遵循暴雪/炉石的第三方工具政策与社区规范。

如果你希望，我接下来可以：
- 把重要性采样中的似然改为使用超几何公式计算（更精确）；
- 或者把 SMC（粒子滤波）实现为在线逐回合更新；
- 或者把示例卡表替换为完整卡表（如果你提供 JSON）。
