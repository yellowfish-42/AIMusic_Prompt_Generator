# 🎵 AI音乐生成系统

基于遗传算法和机器学习的智能音乐特征优化平台

## 📋 功能特性

- ✅ **8种音乐风格分类** - 基于K-Prototypes聚类模型
- ✅ **遗传算法优化** - 自动搜索最优音乐特征组合
- ✅ **流行度预测** - XGBoost模型预测音乐流行度
- ✅ **AI提示词生成** - 自动将特征转换为AI音乐生成提示词
- ✅ **可视化界面** - 现代化Web界面,操作简单直观
- ✅ **灵活配置** - 支持调整优化时间(2-10秒)

## 🎨 支持的音乐风格

| ID | 风格名称 | 描述 |
|----|---------|------|
| 0 | 经典原声人声 | 爵士、民谣、柔和人声 |
| 1 | 喜剧与有声内容 | 脱口秀、有声书 |
| 2 | 高能器乐与硬核 | 极简科技、黑金属 |
| 3 | 重型摇滚与EDM | 金属、Dubstep |
| 4 | 热情现场与拉美 | 桑巴、雷鬼 |
| 5 | 极速激昂 | 硬派舞曲、朋克 |
| 6 | 快乐律动舞曲 | 派对音乐、迪斯科 |
| 7 | 静谧氛围轻音乐 | 助眠、冥想、古典 |

## 🚀 快速开始

### 1. 安装依赖

```powershell
# 创建虚拟环境(推荐)
python -m venv venv
.\venv\Scripts\Activate.ps1

# 安装依赖包
pip install -r requirements.txt
```

### 2. 准备模型文件

确保以下模型文件位于项目根目录:
- `kproto_clustering_model.pkl` - 聚类模型
- `music_prediction_engine_final.pkl` - 预测模型

### 3. 启动服务

```powershell
python app.py
```

### 4. 访问网页

打开浏览器访问: http://localhost:5000
支持同一网络下其他设备访问:http://172.19.61.45:5000

## 📊 使用流程

1. **选择音乐风格** - 从8种预定义风格中选择目标风格
2. **设置优化时间** - 调整遗传算法运行时间(2-10秒)
3. **开始生成** - 点击按钮,AI自动优化特征组合
4. **查看结果** - 获得预测流行度、特征详情和AI提示词
5. **使用提示词** - 将生成的提示词用于AI音乐工具(如Suno AI、Udio等)

## 🔧 技术架构

### 后端
- **Flask** - Web框架
- **XGBoost** - 流行度预测模型
- **K-Prototypes** - 音乐风格聚类
- **遗传算法** - 特征优化引擎

### 前端
- **原生JavaScript** - 无框架依赖
- **响应式设计** - 支持多种设备
- **实时反馈** - 进度显示和Toast通知

## 🧠 核心原理

### 1. 流行度预测原理

系统使用 **XGBoost回归模型** 预测音乐的流行度(0-100分):

**输入特征(29维):**
- **音频特征(13个)**: 舞动感、能量、调性、响度、模式、语音感、原声度、器乐性、现场感、情绪值、速度、拍号、时长
- **艺术家特征(2个)**: 艺术家流行度、粉丝数
- **曲目特征(8个)**: 歌名长度、专辑曲目数、曲目序号、发行时间、曲目标签、播出年度、播出月份（正余弦编码）、歌曲时长
- **趋势特征(6个)**: delta_duration_ms、delta_tempo_delta、delta_instrumentalness、delta_liveness、delta_key、delta_mode.（连续特征通过原值-平均值的绝对值得到，离散特征则是原值与众数的匹配情况）

**预测过程:**
```python
# 1. 特征归一化处理
scaled_features = scaler.transform(raw_features)

# 2. XGBoost模型预测
popularity_score = xgb_model.predict(scaled_features)

# 3. 输出0-100分的流行度评分
```

**模型优势:**
- 非线性拟合能力强,能捕捉复杂的特征交互
- 集成学习方法,预测稳定可靠
- 支持大规模数据训练,泛化能力好

### 2. 风格限制实现原理

系统通过 **K-Prototypes聚类模型 + 硬约束惩罚** 确保生成的音乐符合用户选择的风格:

**Step 1: 风格聚类(训练阶段)**
```python
# 使用K-Prototypes算法将历史音乐数据聚类为8个风格群
# 算法特点:同时处理数值型特征(能量、速度等)和类别型特征(调性、模式等)
kproto_model.fit(music_features, categorical=[9, 10, 11])

# 每个聚类中心代表一种典型风格的特征分布
# 例如:Cluster 6(快乐律动舞曲)中心 = {danceability:0.72, valence:0.73, tempo:116, ...}
```

**Step 2: 风格识别(运行阶段)**
```python
# 1. 标准化特征(关键步骤!)
scaled_features = clustering_scaler.transform(features)

# 2. 预测特征组合属于哪个聚类
cluster_id = kproto_model.predict(scaled_features)

# 3. 判断是否符合用户选择的风格
if cluster_id == target_style:
    return True  # 符合风格
else:
    return False  # 不符合风格
```

**Step 3: 遗传算法中的硬约束**
```python
def fitness_function(individual):
    # 1. 预测流行度
    popularity = predict_popularity(individual)
    
    # 2. 检查风格是否匹配
    cluster = predict_cluster(individual)
    
    # 3. 不符合风格的个体施加巨大惩罚
    if cluster != target_style:
        return popularity - 1000  # 硬约束:直接降低1000分
    
    return popularity  # 符合风格,返回真实流行度
```

**为什么这样能限制风格?**
1. **遗传算法是优化算法**:它会自动淘汰适应度低的个体
2. **惩罚力度远大于流行度差异**:流行度范围是0-100,惩罚是-1000,不符合风格的个体几乎不可能被选中繁殖
3. **精英保留策略**:只有符合风格且流行度高的个体才能进入下一代
4. **收敛结果**:经过几十代进化,种群中99%以上的个体都会收敛到目标风格

**技术关键点:**
- ⚠️ 必须使用 `clustering_scaler` 对特征标准化后再预测聚类(否则预测结果会错误)
- ⚠️ 聚类模型的类别特征索引必须正确设置(本系统为 `[9, 10, 11]`,对应key、mode、time_signature)
- ⚠️ 惩罚值必须足够大,确保硬约束生效

## 🧬 遗传算法参数

系统自动配置以下GA参数(用户无需调整):

```python
population_size = 50      # 种群大小
elite_size = 5           # 精英保留数
mutation_rate = 0.2      # 变异率
crossover_rate = 0.8     # 交叉率
```

**用户可控参数:**
- **优化时间**: 2-10秒(控制进化代数)
- **特征锁定**: 可锁定任意音频特征为固定值
- **目标风格**: 8种预定义音乐风格

## 📁 项目结构

```
music_generator_system/
├── app.py                              # Flask后端服务
├── requirements.txt                    # Python依赖
├── kproto_clustering_model.pkl         # 聚类模型
├── music_prediction_engine_final.pkl   # 预测模型
├── future_predictions.csv              # 未来趋势预测数据
├── templates/
│   └── index.html                      # 网页模板
├── static/
│   ├── style.css                       # 样式文件
│   └── script.js                       # 前端脚本
├── README.md                           # 项目说明
├── START.md                            # 快速启动指南
├── USER_GUIDE.md                       # 用户使用手册
└── 类别说明.md                          # 音乐风格详细说明
```

## 🎯 核心功能特点

### 1. 智能风格识别
- 悬浮在风格选择上可查看详细描述
- 8种专业分类的音乐风格
- 基于真实音乐数据聚类分析

### 2. 特征锁定系统
- 支持锁定13个GA优化特征
- 支持设置5个辅助参数
- 锁定值在优化过程中保持不变

### 3. AI提示词生成
- 集成DeepSeek API
- 自动将特征转换为自然语言
- 适用于Suno AI、Udio等音乐生成工具

### 4. 动态趋势预测
- 基于未来预测数据调整统计基准
- 自动适配当前年份的音乐趋势
- Delta特征捕捉潮流变化
│   └── script.js                       # 前端脚本
└── README.md                           # 项目文档
```

## 🎯 API接口

### 获取音乐风格列表
```
GET /api/styles
```

### 生成音乐特征
```
POST /api/generate
Content-Type: application/json

{
  "style_id": 6,
  "runtime": 5
}
```

### 预测流行度
```
POST /api/predict
Content-Type: application/json

{
  "features": {
    "danceability": 0.8,
    "energy": 0.7,
    ...
  }
}
```

### 获取特征说明
```
GET /api/feature-info
```

## 🎵 音乐特征说明

| 特征 | 范围 | 描述 |
|-----|------|------|
| danceability | 0-1 | 可舞性 |
| energy | 0-1 | 能量强度 |
| loudness | -60-0 | 响度(dB) |
| tempo | 50-200 | 节奏(BPM) |
| valence | 0-1 | 情感积极度 |
| acousticness | 0-1 | 原声性 |
| instrumentalness | 0-1 | 器乐性 |
| speechiness | 0-1 | 语言性 |
| liveness | 0-1 | 现场感 |
| key | 0-11 | 调性(C-B) |
| mode | 0/1 | 小调/大调 |
| time_signature | 3-7 | 节拍 |

## 💡 使用建议

1. **快速预览**: 设置2-4秒运行时间,快速获得初步结果
2. **精细优化**: 设置6-10秒运行时间,获得更优质的特征组合
3. **提示词使用**: 将生成的AI提示词输入到Suno AI、Udio等工具中
4. **多次尝试**: 同一风格多次生成可能得到不同的优质组合

## 🔒 注意事项

- 确保模型文件完整且版本兼容
- 首次运行可能需要较长的模型加载时间
- 遗传算法结果具有随机性,每次运行可能略有不同

## 📝 许可证

本项目仅供学习和研究使用

## 👨‍💻 作者

基于kaggle中的Spotify数据集开发：
- https://www.kaggle.com/datasets/alyahmedts13/spotify-songs-for-ml-and-analysis-over-8700-tracks
- https://www.kaggle.com/datasets/priyamchoksi/spotify-dataset-114k-songs
- https://www.kaggle.com/datasets/josephinelsy/spotify-top-hit-playlist-2010-2022

---

**祝您创作出精彩的音乐! 🎶**
