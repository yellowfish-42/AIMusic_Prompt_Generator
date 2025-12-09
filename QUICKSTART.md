# 🚀 快速启动指南

## ✅ 系统状态

**所有测试通过**: 5/5 ✅

- ✅ 依赖包检查
- ✅ 模型文件检查  
- ✅ 模型加载测试
- ✅ 遗传算法测试
- ✅ 快速优化测试

## 🎯 启动服务

### 方法1: 使用快速启动脚本(推荐)

```powershell
.\run.ps1
```

### 方法2: 直接运行Python

```powershell
& "D:\miniconda3\envs\da_env\python.exe" app.py
```

### 方法3: 使用完整启动脚本

```powershell
.\start_server.ps1
```

## 🌐 访问网页

服务启动后,打开浏览器访问:

**主地址**: http://localhost:5000

或者:
- http://127.0.0.1:5000
- http://172.19.61.45:5000

## 📖 使用流程

### 1️⃣ 选择音乐风格

从8种风格中选择:
- 0 - 经典原声人声 💫
- 1 - 喜剧与有声内容 🎭
- 2 - 高能器乐与硬核 ⚡
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
