# 📦 模型文件放置说明

## 必需的模型文件

请将以下训练好的模型文件放置到项目根目录：

```
music_generator_system/
├── rf_model_music.pkl          ⭐ 音乐特征RandomForest模型
├── rf_model_artist.pkl         ⭐ 艺术家特征RandomForest模型
├── kproto_clustering_model.pkl ⭐ K-Prototypes聚类模型
├── music_prediction_engine_final.pkl  (旧版，可选)
└── future_predictions.csv      (可选)
```

---

## ⭐ 模型1: rf_model_music.pkl

### 训练参数
```python
rf_best_params_df1 = {
    'max_depth': 18,
    'max_features': 'log2',
    'min_samples_leaf': 2,
    'min_samples_split': 5,
    'n_estimators': 600,
    'random_state': 42,
    'n_jobs': -1
}
```

### 训练代码 (参考)
```python
from sklearn.ensemble import RandomForestRegressor
import joblib

# 准备数据
features_rf = [
    'danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
    'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo',
    'duration_ms', 'time_signature'
]

X_train = df1_unique[features_rf].fillna(0)
y_train = df1_unique['popularity']

# 训练模型
rf_model_df1 = RandomForestRegressor(**rf_best_params_df1)
rf_model_df1.fit(X_train, y_train)

# 保存模型
joblib.dump(rf_model_df1, 'rf_model_music.pkl')
```

### 预期性能
- **R²**: ~0.45
- **MAE**: ~12.5
- **RMSE**: ~15.8

---

## ⭐ 模型2: rf_model_artist.pkl

### 训练参数
```python
rf_best_params_df2 = {
    'max_depth': 18,
    'max_features': 'sqrt',
    'min_samples_leaf': 2,
    'min_samples_split': 5,
    'n_estimators': 600,
    'random_state': 42,
    'n_jobs': -1
}
```

### 训练代码 (参考)
```python
from sklearn.ensemble import RandomForestRegressor
import joblib
import numpy as np
import pandas as pd

# 准备数据
df2['album_release_date'] = pd.to_datetime(df2['album_release_date'], errors='coerce')
df2['release_year'] = df2['album_release_date'].dt.year
_month = df2['album_release_date'].dt.month
df2['release_month_sin'] = np.sin(2 * np.pi * _month / 12)
df2['release_month_cos'] = np.cos(2 * np.pi * _month / 12)

features_rf_df2 = [
    'release_year', 'release_month_sin', 'release_month_cos',
    'artist_popularity', 'artist_followers', 'album_total_tracks', 'track_number'
]

X_train_df2 = df2_unique[features_rf_df2].fillna(0)
y_train_df2 = df2_unique['track_popularity']

# 训练模型
rf_model_df2 = RandomForestRegressor(**rf_best_params_df2)
rf_model_df2.fit(X_train_df2, y_train_df2)

# 保存模型
joblib.dump(rf_model_df2, 'rf_model_artist.pkl')
```

### 预期性能
- **R²**: ~0.48
- **MAE**: ~11.8
- **RMSE**: ~14.9

---

## ⭐ 模型3: kproto_clustering_model.pkl

这是K-Prototypes聚类模型，用于音乐风格分类。

### 期望格式
```python
{
    'model': <KPrototypes对象>,
    'scaler': <StandardScaler对象>
}
```

### 保存示例
```python
import joblib

clustering_artifacts = {
    'model': kproto_model,
    'scaler': scaler
}

joblib.dump(clustering_artifacts, 'kproto_clustering_model.pkl')
```

---

## 🔍 验证模型文件

运行以下命令检查模型是否加载成功：

```python
import joblib

# 测试音乐模型
try:
    rf_music = joblib.load('rf_model_music.pkl')
    print("✅ rf_model_music.pkl 加载成功")
    print(f"   特征数: {rf_music.n_features_in_}")
except Exception as e:
    print(f"❌ rf_model_music.pkl 加载失败: {e}")

# 测试艺术家模型
try:
    rf_artist = joblib.load('rf_model_artist.pkl')
    print("✅ rf_model_artist.pkl 加载成功")
    print(f"   特征数: {rf_artist.n_features_in_}")
except Exception as e:
    print(f"❌ rf_model_artist.pkl 加载失败: {e}")

# 测试聚类模型
try:
    clustering = joblib.load('kproto_clustering_model.pkl')
    print("✅ kproto_clustering_model.pkl 加载成功")
    print(f"   模型类型: {type(clustering['model'])}")
    print(f"   缩放器类型: {type(clustering['scaler'])}")
except Exception as e:
    print(f"❌ kproto_clustering_model.pkl 加载失败: {e}")
```

---

## 📝 注意事项

1. **模型兼容性**: 
   - 使用与训练时相同版本的scikit-learn
   - 推荐: scikit-learn >= 1.0.0

2. **文件大小**:
   - rf_model_music.pkl: ~100-200 MB (600棵树)
   - rf_model_artist.pkl: ~100-200 MB (600棵树)
   - kproto_clustering_model.pkl: ~10-50 MB

3. **安全性**:
   - joblib加载的pkl文件可能包含恶意代码
   - 仅加载您信任的模型文件
   - 不要从不可信来源下载pkl文件

4. **版本控制**:
   - 建议将模型文件加入`.gitignore`
   - 使用Git LFS管理大文件（如果需要版本控制）

---

## 🆘 故障排查

### 问题1: ModuleNotFoundError
```
ModuleNotFoundError: No module named 'sklearn'
```

**解决方案**:
```bash
pip install scikit-learn
```

### 问题2: 模型版本不兼容
```
ValueError: The features_names attribute from the training data are not available in the model
```

**解决方案**:
- 使用相同版本的scikit-learn重新训练模型
- 或升级/降级scikit-learn版本

### 问题3: 文件路径错误
```
FileNotFoundError: [Errno 2] No such file or directory: 'rf_model_music.pkl'
```

**解决方案**:
- 确认模型文件在项目根目录
- 检查文件名拼写是否正确
- 使用绝对路径测试: `C:/path/to/rf_model_music.pkl`

---

## ✅ 完成检查清单

- [ ] rf_model_music.pkl 已放置在项目根目录
- [ ] rf_model_artist.pkl 已放置在项目根目录
- [ ] kproto_clustering_model.pkl 已放置在项目根目录
- [ ] 运行验证脚本测试模型加载
- [ ] 启动Flask服务器无报错
- [ ] 访问 http://localhost:5000 界面正常显示
- [ ] 切换到艺术家分析模式可以正常使用

---

**🎉 模型文件准备完成后，即可启动系统！**

运行:
```bash
python app.py
```
