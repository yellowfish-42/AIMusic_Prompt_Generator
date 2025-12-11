# 🚀 快速启动指南 - v2.0 双模型系统

## ✅ 系统状态

**v2.0 双模型系统已就绪**

必需模型文件：
- ⭐ `rf_model_music.pkl` - 音乐特征RandomForest模型
- ⭐ `rf_model_artist.pkl` - 艺术家特征RandomForest模型
- ⭐ `kproto_clustering_model.pkl` - K-Prototypes聚类模型

详细配置: [MODEL_SETUP.md](MODEL_SETUP.md)

---

## ⚡ 5分钟上手

### 步骤1: 准备模型文件
将训练好的模型文件放到项目根目录：
```
music_generator_system/
├── rf_model_music.pkl      ← 放这里
├── rf_model_artist.pkl     ← 放这里
├── kproto_clustering_model.pkl ← 放这里
├── app.py
└── ...
```

### 步骤2: 安装依赖
```powershell
pip install flask flask-cors joblib numpy pandas scikit-learn requests
```

### 步骤3: 启动服务

**方法1: 使用快速启动脚本(推荐)**
```powershell
.\run.ps1
```

**方法2: 直接运行Python**
```powershell
python app.py
```

成功输出示例：
```
✅ 聚类模型加载成功
✅ 音乐特征RandomForest模型加载成功
✅ 艺术家特征RandomForest模型加载成功
🌐 服务运行在: http://localhost:5000
```

### 步骤4: 测试API
```powershell
python test_api.py
```

## 🌐 访问网页

服务启动后,打开浏览器访问:

**主地址**: http://localhost:5000

或者:
- http://127.0.0.1:5000
- http://172.19.61.45:5000 (局域网访问)

---

## 📖 使用流程

### 模式1: 🎵 AI音乐生成器

#### 1️⃣ 选择音乐风格
从8种风格中选择:
- 0 - 经典原声人声 💫
- 1 - 喜剧与有声内容 🎭
- 2 - 高能器乐与硬核 ⚡
- 3 - 重型摇滚与EDM 🔥
- 4 - 热情现场与拉美 🎺
- 5 - 极速激昂 ⚡
- 6 - 快乐律动舞曲 💃
- 7 - 静谧氛围轻音乐 🌙

#### 2️⃣ （可选）锁定特征
点击"展开特征设置"：
- 勾选要锁定的特征
- 拖动滑块设置具体值
- 锁定的特征在优化时保持不变

#### 3️⃣ 调整优化时间
拖动滑块选择2-10秒（建议5秒）

#### 4️⃣ 开始生成
点击"开始生成"按钮，等待遗传算法优化

#### 5️⃣ 查看结果
- 预测流行度
- 13个优化后的音频特征
- 原始JSON数据

#### 6️⃣ 生成AI提示词（可选）
- 输入DeepSeek API密钥
- 点击"生成AI提示词"
- 复制提示词到Suno/Udio等工具

---

### 模式2: 📊 艺术家流行度分析器 (新增)

#### 1️⃣ 切换模式
点击顶部"艺术家流行度分析"标签

#### 2️⃣ 输入数据
填写以下信息：
- **发行年份**: 2025
- **发行月份**: 6月（夏季）
- **艺术家流行度**: 0-100（如75）
- **艺术家粉丝数**: 实际粉丝数（如1,000,000）
- **专辑总曲目数**: 12
- **曲目编号**: 5

#### 3️⃣ 预测流行度
点击"预测流行度"按钮

#### 4️⃣ 查看分析结果
系统会显示：
- 预测的流行度评分
- 艺术家影响力评级
- 发行时间信息
- 输入特征总览
- **数据洞察建议**（自动生成）

#### 5️⃣ 阅读洞察建议
包括：
- ✅ 流行度评价
- 👤 艺术家影响力分析
- 🔥 粉丝基础评估
- ☀️ 季节性发行建议
- 💿 专辑策略提示
- 3 - 重型摇滚与EDM 🔥
- 4 - 热情现场与拉美 🌴
- 5 - 极速激昂 🚀
- 6 - 快乐律动舞曲 🎉 (推荐首次尝试)
- 7 - 静谧氛围轻音乐 🌙

### 2️⃣ 设置优化时间

拖动滑块选择2-10秒:
- **2-3秒**: 快速预览
- **5秒**: 推荐平衡点
- **7-10秒**: 精细优化

### 3️⃣ 点击生成

点击 **"🚀 开始生成"** 按钮

### 4️⃣ 查看结果

获得以下信息:
- 📈 预测流行度分数
- 🎨 音乐风格分类
- ⚡ 优化迭代代数
- 🎚️ 12个音乐特征值
- 🤖 AI音乐生成提示词

### 5️⃣ 使用提示词

1. 点击 **"📋 复制提示词"**
2. 访问AI音乐工具:
   - **Suno AI**: https://suno.ai
   - **Udio**: https://udio.com
3. 粘贴提示词并生成音乐

## 💡 快速示例

**测试结果示例** (风格6 - 快乐舞曲, 2秒优化):
```
预测流行度: 67.71
音乐风格: 极速激昂
迭代代数: 32代
用时: 2.02秒
```

## 🛠️ 常用命令

### 测试系统
```powershell
& "D:\miniconda3\envs\da_env\python.exe" test_system.py
```

### 停止服务
在终端按 `Ctrl + C`

### 查看日志
服务运行时终端会显示所有请求日志

## 📊 API测试

### 测试获取风格列表
```powershell
curl http://localhost:5000/api/styles
```

### 测试生成音乐特征
```powershell
curl -X POST http://localhost:5000/api/generate `
  -H "Content-Type: application/json" `
  -d '{"style_id": 6, "runtime": 5}'
```

## ⚠️ 故障排除

### 问题1: 端口被占用
如果5000端口被占用,修改 `app.py` 最后一行:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # 改为5001
```

### 问题2: 模型加载失败
确保以下文件存在:
- `kproto_clustering_model.pkl` (0.22 MB)
- `music_prediction_engine_final.pkl` (4.77 MB)

### 问题3: 生成速度慢
- 正常现象,遗传算法需要计算时间
- 可以降低运行时间到2-3秒

## 📁 项目文件说明

```
✅ app.py                              # 后端主程序
✅ requirements.txt                    # 依赖列表
✅ test_system.py                      # 测试脚本
✅ run.ps1                             # 快速启动
✅ start_server.ps1                    # 完整启动
✅ kproto_clustering_model.pkl         # 聚类模型
✅ music_prediction_engine_final.pkl   # 预测模型
✅ templates/index.html                # 网页界面
✅ static/style.css                    # 样式文件
✅ static/script.js                    # 前端脚本
✅ README.md                           # 项目说明
✅ USER_GUIDE.md                       # 使用指南
✅ PROJECT_OVERVIEW.md                 # 项目概览
```

## 🎓 进一步学习

- 📖 详细使用说明: 查看 `USER_GUIDE.md`
- 🏗️ 技术架构: 查看 `PROJECT_OVERVIEW.md`
- 🎨 风格说明: 查看 `类别说明.md`

## 🎉 开始创作

一切就绪！享受AI音乐创作的乐趣吧！🎵

---

**当前配置**:
- Python环境: `D:\miniconda3\envs\da_env\python.exe`
- 服务地址: `http://localhost:5000`
- 测试状态: ✅ 全部通过
