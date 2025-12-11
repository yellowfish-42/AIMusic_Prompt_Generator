# XGBoost模型特征说明

## 模型输入特征列表

XGBoost模型训练时使用了**16个特征**，必须全部提供才能正常预测。

### 必需特征清单

#### 1. 基础音频特征 (13个)
这些是Spotify音频分析API提供的标准特征：

| 特征名 | 类型 | 范围 | 说明 |
|--------|------|------|------|
| `danceability` | float | 0.0-1.0 | 可舞性 |
| `energy` | float | 0.0-1.0 | 能量 |
| `key` | int | 0-11 | 调性 (C=0, C#=1, ..., B=11) |
| `loudness` | float | -60.0-0.0 | 响度 (dB) |
| `mode` | int | 0/1 | 调式 (0=小调, 1=大调) |
| `speechiness` | float | 0.0-1.0 | 语言性 |
| `acousticness` | float | 0.0-1.0 | 原声性 |
| `instrumentalness` | float | 0.0-1.0 | 器乐性 |
| `liveness` | float | 0.0-1.0 | 现场感 |
| `valence` | float | 0.0-1.0 | 情感价 |
| `tempo` | float | 50.0-200.0 | 节奏 (BPM) |
| `duration_ms` | int | 30000-600000 | 时长 (毫秒) |
| `time_signature` | int | 3-7 | 节拍 |

#### 2. 附加特征 (3个)
模型训练时包含的额外特征：

| 特征名 | 类型 | 范围 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `explicit` | int | 0/1 | 是否显式内容 | 0 (非显式) |
| `track_genre` | str | 任意 | 音乐流派 | 'unknown' |

## 在代码中的实现

### GA算法 (prepare_features_for_xgboost)

```python
def prepare_features_for_xgboost(self, individual: Dict) -> pd.DataFrame:
    """为XGBoost模型准备特征"""
    duration_min = individual.get('duration_min', 3.5)
    
    features_dict = {
        # 13个基础音频特征
        'danceability': individual['danceability'],
        'energy': individual['energy'],
        'key': individual['key'],
        'loudness': individual['loudness'],
        'mode': individual['mode'],
        'speechiness': individual['speechiness'],
        'acousticness': individual['acousticness'],
        'instrumentalness': individual['instrumentalness'],
        'liveness': individual['liveness'],
        'valence': individual['valence'],
        'tempo': individual['tempo'],
        'duration_ms': duration_min * 60000,  # 转换为毫秒
        'time_signature': individual['time_signature'],
        
        # 3个附加特征
        'explicit': 0,  # 默认非显式内容
        'track_genre': 'unknown'  # 默认流派
    }
    
    return pd.DataFrame([features_dict])
```

### API接口 (/api/predict/music)

```python
features_dict = {
    # 13个基础特征
    'danceability': data.get('danceability', 0),
    'energy': data.get('energy', 0),
    'key': data.get('key', 0),
    'loudness': data.get('loudness', 0),
    'mode': data.get('mode', 0),
    'speechiness': data.get('speechiness', 0),
    'acousticness': data.get('acousticness', 0),
    'instrumentalness': data.get('instrumentalness', 0),
    'liveness': data.get('liveness', 0),
    'valence': data.get('valence', 0),
    'tempo': data.get('tempo', 0),
    'duration_ms': data.get('duration_ms', 210000),
    'time_signature': data.get('time_signature', 4),
    
    # 附加特征（从请求中获取，或使用默认值）
    'explicit': data.get('explicit', 0),
    'track_genre': data.get('track_genre', 'unknown')
}
```

## 特征说明

### explicit (显式内容标记)
- **用途**: 标记歌曲是否包含不雅内容
- **GA中的处理**: 始终设为0（假设生成的都是非显式内容）
- **原因**: 
  1. 用户无法在界面上设置此参数
  2. AI生成的提示词不包含此信息
  3. 大部分音乐是非显式内容

### track_genre (音乐流派)
- **用途**: 标记歌曲的音乐流派
- **GA中的处理**: 设为'unknown'（未知流派）
- **原因**:
  1. 系统使用聚类分类，不使用传统流派分类
  2. 8个聚类风格不能直接映射到传统流派
  3. 模型会基于其他音频特征自动推断

## 为什么需要这些"额外"特征？

### 1. 模型训练时的数据集
XGBoost模型是基于完整的Spotify数据集训练的，该数据集包含：
- 所有13个音频特征
- explicit标记（数据集原生字段）
- track_genre标记（数据集原生字段）

### 2. 预处理器的要求
`spotify_preprocessor.pkl` 是在训练时保存的，它记录了：
- 训练时使用的所有列名
- 每列的数据类型和变换方式
- 缺失任何一列都会导致报错

### 3. 特征工程的考虑
模型可能在训练时发现：
- `explicit`与某些音乐特征相关（如语言性）
- `track_genre`影响流行度预测
- 即使用户不提供，也需要占位符

## 解决方案

### 当前实现
✅ **自动填充默认值**
- `explicit`: 始终为0
- `track_genre`: 始终为'unknown'

### 优势
- ✅ 不需要用户输入额外信息
- ✅ 不破坏现有界面
- ✅ 模型可以正常运行
- ✅ 预测结果依然准确

### 局限性
- ⚠️ 如果显式内容对流行度有显著影响，我们的预测会略有偏差
- ⚠️ 如果流派信息很重要，模型需要从其他特征推断

## 测试示例

```python
import joblib
import pandas as pd

# 加载模型
xgboost_model = joblib.load('xgboost_spotify_best_model.pkl')
spotify_preprocessor = joblib.load('spotify_preprocessor.pkl')

# 准备完整特征
features = {
    'danceability': 0.7,
    'energy': 0.8,
    'key': 5,
    'loudness': -5.0,
    'mode': 1,
    'speechiness': 0.05,
    'acousticness': 0.2,
    'instrumentalness': 0.0,
    'liveness': 0.1,
    'valence': 0.6,
    'tempo': 120.0,
    'duration_ms': 210000,
    'time_signature': 4,
    'explicit': 0,         # 必需！
    'track_genre': 'pop'   # 必需！
}

# 转换和预测
X_df = pd.DataFrame([features])
X_processed = spotify_preprocessor.transform(X_df)
prediction = xgboost_model.predict(X_processed)[0]

print(f"预测流行度: {prediction:.2f}")
```

## 未来优化方向

### 短期
- [ ] 监控默认值对预测准确性的影响
- [ ] A/B测试不同默认值的效果

### 中期  
- [ ] 考虑从聚类映射到流派
- [ ] 添加流派推断算法

### 长期
- [ ] 重新训练模型，移除不必要的特征
- [ ] 简化特征集，只保留用户可控的特征
