# 🎵 双模型系统使用指南

## 📊 系统概述

本系统现在支持**两种预测模式**，基于两个独立的RandomForest模型：

### 模式1: 🎵 AI音乐生成器
- **模型**: `rf_model_music.pkl` (RandomForest)
- **输入**: 13个音频特征
- **输出**: 流行度预测 + AI音乐提示词
- **用途**: 为AI音乐生成工具创建最优特征组合

### 模式2: 📊 艺术家流行度分析器
- **模型**: `rf_model_artist.pkl` (RandomForest)
- **输入**: 7个艺术家/专辑特征
- **输出**: 流行度预测 + 数据洞察建议
- **用途**: 分析艺术家影响力和发行策略

---

## 🎯 模式1: AI音乐生成器

### 输入特征 (13个)
```python
[
    'danceability',      # 可舞性 (0-1)
    'energy',            # 能量 (0-1)
    'key',               # 调性 (0-11)
    'loudness',          # 响度 (-60 to 0 dB)
    'mode',              # 调式 (0=小调, 1=大调)
    'speechiness',       # 语言性 (0-1)
    'acousticness',      # 原声性 (0-1)
    'instrumentalness',  # 器乐性 (0-1)
    'liveness',          # 现场感 (0-1)
    'valence',           # 情感价 (0-1)
    'tempo',             # 节奏 (BPM)
    'duration_ms',       # 时长 (毫秒)
    'time_signature'     # 节拍 (3-7)
]
```

### 核心功能
1. **风格选择**: 8种音乐风格聚类
2. **遗传算法优化**: 自动寻找最优特征组合
3. **特征锁定**: 手动指定某些特征保持不变
4. **AI提示词生成**: 使用DeepSeek API生成自然语言描述

### 使用场景
- ✨ 为Suno、Udio等AI音乐工具生成提示词
- 🎨 探索不同风格的音乐特征模式
- 🧬 通过GA算法优化流行度潜力

---

## 👤 模式2: 艺术家流行度分析器

### 输入特征 (7个)
```python
{
    'release_year': 2025,           # 发行年份
    'release_month': 6,             # 发行月份 (1-12)
    'artist_popularity': 75,        # 艺术家流行度 (0-100)
    'artist_followers': 1000000,    # 粉丝数
    'album_total_tracks': 12,       # 专辑总曲目数
    'track_number': 5               # 曲目编号
}
```

### 特征工程
系统会自动计算：
- `release_month_sin` = sin(2π × month / 12)
- `release_month_cos` = cos(2π × month / 12)

这种**周期性编码**捕捉季节性规律（夏季vs冬季发行）。

### 数据洞察
系统自动生成以下洞察：
- 📈 流行度评价（高/中/低）
- 👤 艺术家影响力分析
- 🔥 粉丝基础评估
- ☀️ 发行时间策略建议
- 💿 专辑结构优化提示

### 使用场景
- 📊 测试自己的粉丝数据和流行度影响
- 🎯 规划最佳发行时间
- 💡 评估艺术家影响力对新歌的帮助
- 🔮 预测不同专辑策略的效果

---

## 🔄 API接口

### 1. 音乐特征预测
```http
POST /api/predict/music
Content-Type: application/json

{
  "danceability": 0.7,
  "energy": 0.8,
  "key": 5,
  "loudness": -5.0,
  "mode": 1,
  "speechiness": 0.05,
  "acousticness": 0.2,
  "instrumentalness": 0.0,
  "liveness": 0.1,
  "valence": 0.6,
  "tempo": 120.0,
  "duration_ms": 200000,
  "time_signature": 4
}
```

**响应示例**:
```json
{
  "success": true,
  "predicted_popularity": 68.42,
  "model": "RandomForest_Music",
  "features_used": ["danceability", "energy", ...]
}
```

---

### 2. 艺术家特征预测
```http
POST /api/predict/artist
Content-Type: application/json

{
  "release_year": 2025,
  "release_month": 6,
  "artist_popularity": 75,
  "artist_followers": 1000000,
  "album_total_tracks": 12,
  "track_number": 5
}
```

**响应示例**:
```json
{
  "success": true,
  "predicted_popularity": 72.15,
  "model": "RandomForest_Artist",
  "features_used": ["release_year", "release_month_sin", ...],
  "input_month": 6
}
```

---

### 3. 双模型对比预测
```http
POST /api/predict/dual
Content-Type: application/json

{
  // 包含所有音乐特征 + 艺术家特征
  "danceability": 0.7,
  "energy": 0.8,
  ...
  "release_year": 2025,
  "artist_popularity": 75,
  ...
}
```

**响应示例**:
```json
{
  "success": true,
  "music_model": {
    "predicted_popularity": 68.42,
    "model": "RandomForest_Music"
  },
  "artist_model": {
    "predicted_popularity": 72.15,
    "model": "RandomForest_Artist"
  },
  "difference": 3.73,
  "weighted_average": 69.54,
  "recommendation": "⚠️ 两个模型预测存在一定差异（差异 3.7），建议综合参考"
}
```

---

## 📦 模型文件要求

请将训练好的模型文件放置在项目根目录：

```
music_generator_system/
├── rf_model_music.pkl      # 音乐特征RandomForest模型
├── rf_model_artist.pkl     # 艺术家特征RandomForest模型
├── kproto_clustering_model.pkl  # 聚类模型（风格分类）
├── music_prediction_engine_final.pkl  # 旧版预测模型（兼容性保留）
└── future_predictions.csv  # 未来趋势预测数据
```

---

## 🚀 启动系统

1. **安装依赖**:
```bash
pip install flask flask-cors joblib numpy pandas scikit-learn requests
```

2. **放置模型文件**:
- 将 `rf_model_music.pkl` 放到项目根目录
- 将 `rf_model_artist.pkl` 放到项目根目录

3. **启动服务器**:
```bash
python app.py
```

4. **访问界面**:
```
http://localhost:5000
```

---

## 💡 使用建议

### AI音乐生成器 (模式1)
1. 选择一个音乐风格（如"快乐律动舞曲"）
2. 可选：锁定某些特征（如tempo=128 BPM）
3. 点击"开始生成"，等待GA优化
4. 查看优化后的特征组合
5. 输入DeepSeek API密钥生成自然语言提示词
6. 复制提示词到Suno/Udio等AI音乐工具

### 艺术家流行度分析器 (模式2)
1. 切换到"艺术家流行度分析"标签页
2. 输入您的数据：
   - 粉丝数（如100,000）
   - 艺术家流行度（如50/100）
   - 发行计划（2025年6月）
   - 专辑信息（12首曲目，第5首）
3. 点击"预测流行度"
4. 查看预测结果和系统建议
5. 根据洞察调整发行策略

### 双模型对比 (高级)
在AI音乐生成器中：
- 生成结果后，系统会自动调用双模型预测
- 查看音乐特征模型 vs 艺术家模型的差异
- 差异<5：预测可靠
- 差异>15：说明音乐质量与艺术家影响力有显著差距

---

## 🎨 模型性能参考

### RandomForest (音乐特征)
```python
参数配置:
- n_estimators: 600
- max_depth: 18
- max_features: 'log2'
- min_samples_leaf: 2
- min_samples_split: 5

测试集性能:
- R²: ~0.45
- MAE: ~12.5
- RMSE: ~15.8
```

### RandomForest (艺术家特征)
```python
参数配置:
- n_estimators: 600
- max_depth: 18
- max_features: 'sqrt'
- min_samples_leaf: 2
- min_samples_split: 5

测试集性能:
- R²: ~0.48
- MAE: ~11.8
- RMSE: ~14.9
```

---

## 🔮 后续扩展建议

1. **混合模型**: 创建一个元模型（Meta-Model）融合两个预测结果
2. **时间序列**: 加入历史流行度趋势预测
3. **A/B测试**: 对比不同艺术家策略的效果
4. **推荐系统**: 基于艺术家特征推荐最佳音乐特征组合
5. **可视化**: 添加雷达图对比不同特征配置

---

## 📞 技术支持

- 模型训练代码: 见用户提供的Jupyter Notebook单元格
- API文档: 本文档 + `README.md`
- 问题反馈: 检查控制台日志和浏览器开发者工具

---

**✨ 祝您创作出流行的音乐！**
