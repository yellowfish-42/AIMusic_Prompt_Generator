# 📝 更新日志 (CHANGELOG)

---

## v2.0 - 双模型系统 (2025-12-10)

### 🆕 新增功能

#### 1. 双RandomForest预测模型
- **音乐特征模型** (`rf_model_music.pkl`)
  - 13个音频特征输入
  - 专注于音乐本身质量
  - 用于AI音乐生成场景
  - 性能: R²=0.45, MAE=12.5

- **艺术家特征模型** (`rf_model_artist.pkl`)
  - 7个艺术家/专辑特征输入
  - 评估艺术家影响力
  - 识别发行时间规律
  - 性能: R²=0.48, MAE=11.8

#### 2. 艺术家流行度分析器
全新的分析模块，提供：
- 📊 **流行度预测**: 基于粉丝数、艺术家知名度等预测
- 💡 **数据洞察**: 自动生成可行的优化建议
  - 艺术家影响力评估
  - 粉丝基础分析
  - 发行时间策略（季节性规律）
  - 专辑结构优化建议
- 🎯 **输入参数**:
  - 发行年份/月份
  - 艺术家流行度 (0-100)
  - 粉丝数
  - 专辑总曲目数
  - 曲目编号

#### 3. 模式切换界面
- 双标签页设计：
  - 🎵 AI音乐生成器
  - 📊 艺术家流行度分析器
- 无缝切换，数据独立

### 🔧 后端更新

#### API端点新增

1. **`POST /api/predict/music`**
   - 输入: 13个音频特征
   - 输出: 音乐特征模型预测的流行度
   ```json
   {
     "success": true,
     "predicted_popularity": 68.42,
     "model": "RandomForest_Music",
     "features_used": [...]
   }
   ```

2. **`POST /api/predict/artist`**
   - 输入: 7个艺术家/专辑特征
   - 输出: 艺术家模型预测的流行度
   - 自动计算月份正弦/余弦编码
   ```json
   {
     "success": true,
     "predicted_popularity": 72.15,
     "model": "RandomForest_Artist",
     "input_month": 6
   }
   ```

3. **`POST /api/predict/dual`**
   - 输入: 完整特征集（音乐+艺术家）
   - 输出: 双模型对比结果
   - 包含差异分析和加权平均
   ```json
   {
     "music_model": {...},
     "artist_model": {...},
     "difference": 3.73,
     "weighted_average": 69.54,
     "recommendation": "..."
   }
   ```

#### 模型加载逻辑
- 增强的 `load_models()` 函数
- 支持独立加载两个RandomForest模型
- 向后兼容旧版预测模型

#### 洞察生成引擎
新增 `generate_recommendation()` 和 `generateArtistInsights()` 函数：
- 自动分析双模型预测差异
- 基于输入数据生成个性化建议
- 识别季节性发行规律（夏季/冬季）
- 评估曲目位置影响

### 🎨 前端更新

#### HTML结构
- 模式切换标签页 (`.mode-tabs`)
- 艺术家分析面板 (`#artistModePanel`)
- 独立的输入表单和结果展示

#### CSS样式
新增样式类：
- `.mode-tabs` - 标签页容器
- `.mode-tab` - 单个标签
- `.mode-panel` - 内容面板
- `.insights-section` - 洞察建议区域
- `.insight-item` - 单条建议

#### JavaScript功能
新增函数：
- `initModeTabs()` - 初始化模式切换
- `predictArtistPopularity()` - 调用艺术家预测API
- `displayArtistResult()` - 显示预测结果
- `generateArtistInsights()` - 生成数据洞察
  - 流行度评价
  - 艺术家影响力分析
  - 粉丝数分析
  - 季节性发行建议
  - 专辑策略提示

### 📚 文档更新

新增文档文件：
- **DUAL_MODEL_GUIDE.md** - 双模型系统完整使用指南
  - 两种模式详细说明
  - API接口文档
  - 使用场景示例
  - 性能参考

- **MODEL_SETUP.md** - 模型文件放置指南
  - 训练参数参考
  - 保存/加载示例
  - 验证脚本
  - 故障排查

更新文档：
- **README.md**
  - v2.0功能概述
  - 双模型架构说明
  - 更新的技术架构表
  - RandomForest预测原理

### 🔄 兼容性

- ✅ 保留旧版XGBoost预测模型支持
- ✅ 向后兼容现有API
- ✅ GA音乐生成功能完全保留
- ✅ DeepSeek AI提示词生成保留

### 📊 性能指标

| 模块 | 加载时间 | 预测速度 | 准确度 |
|------|---------|---------|--------|
| 音乐特征模型 | ~1s | <50ms | R²=0.45 |
| 艺术家模型 | ~1s | <50ms | R²=0.48 |
| 洞察生成 | N/A | <10ms | N/A |

---

## v1.1 - GenAI界面升级 (2025-12-09)

### 🎨 UI/UX重大更新

#### Glassmorphism设计系统
- **深色背景**: `#0f0f12` 太空黑
- **玻璃态卡片**: 
  - `backdrop-filter: blur(20px)`
  - 半透明背景 `rgba(35, 35, 41, 0.6)`
  - 渐变边框效果

#### 视觉效果
- **渐变标题**: 紫色→粉色 (`linear-gradient(135deg, #a855f7, #ec4899)`)
- **按钮发光**: 绿色光晕 + 扫光动画
- **自定义滑块**: 绿色渐变轨道 + 白色滑块
- **进度条**: Shimmer闪烁动画

#### 数据可视化
- 自动检测0-1归一化值
- 动态生成进度条（除mode/key/time_signature）
- JetBrains Mono等宽字体显示数值

#### 排版系统
- **主字体**: Inter (300-900)
- **等宽字体**: JetBrains Mono (400-700)
- Google Fonts加载

#### 动画系统
- `@keyframes pulse` - 脉冲动画
- `@keyframes shimmer` - 闪烁动画
- `@keyframes scan` - 扫描动画
- `@keyframes fadeIn` - 淡入动画
- 悬停提升效果 (`translateY(-4px)`)

### 📝 文档
- **CHANGELOG.md**: 完整设计系统文档
- 颜色方案、动画清单、代码示例

---

## v1.0 - Spotify主题 (2025-12-09)

### 🎨 Spotify配色方案
- **主色**: Spotify绿 `#1DB954`
- **背景**: 深黑 `#191414` + 暗灰 `#121212`
- **卡片**: `#181818`
- **文字**: 白色 `#ffffff` + 浅灰 `#b3b3b3`

### 功能实现
- 8种音乐风格聚类
- 遗传算法优化（2-10秒可调）
- 特征锁定功能
- DeepSeek AI提示词生成
- XGBoost流行度预测

### 技术栈
- Flask 3.1.2
- XGBoost
- K-Prototypes
- 遗传算法（种群=50）

### 文档
- **FILES.md**: 文件清理指南
- **START.md**: 快速开始指南
- **README.md**: 技术原理说明

---

## v0.1 - 初始版本 (2025-12-08)

### 核心功能
- Flask后端框架
- 基础遗传算法实现
- K-Prototypes聚类
- XGBoost预测模型
- 简单Web界面

---

**版本号规则**:
- **主版本号**: 架构性变更（如双模型系统）
- **次版本号**: 功能性更新（如UI升级）
- **修订号**: Bug修复和小优化

**下一步计划**:
- v2.1: 混合元模型（融合双RandomForest）
- v2.2: 时间序列流行度预测
- v3.0: 推荐系统（基于艺术家特征推荐音乐特征）
