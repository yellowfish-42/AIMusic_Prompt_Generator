# 🚀 快速启动指南

## 启动服务器

### 方法一：使用Python直接启动
```powershell
# 切换到项目目录
cd c:\Users\yellowfish\Desktop\dataset\spotify\music_generator_system

# 启动Flask服务器
python app.py
```

### 方法二：使用PowerShell脚本启动
```powershell
# 运行启动脚本
.\start_server.ps1
```

## 访问系统

服务器启动后，在浏览器中访问:
```
http://localhost:5000
```

## 使用流程

1. **选择音乐风格** - 鼠标悬停可查看风格详细说明
2. **设置运行时间** - 调整遗传算法优化时间(2-10秒)
3. **锁定特征(可选)** - 展开特征面板锁定特定音乐参数
4. **开始生成** - 点击按钮开始AI优化
5. **查看结果** - 获得最优特征组合和流行度预测
6. **生成AI提示词(可选)** - 输入DeepSeek API密钥生成自然语言描述

## DeepSeek API配置

1. 访问 https://platform.deepseek.com/api_keys 获取API密钥
2. 在结果页面输入API密钥
3. 点击"生成AI提示词"按钮
4. 等待AI生成自然语言音乐描述

## 停止服务器

在命令行窗口按 `Ctrl + C` 即可停止服务器

## 故障排除

### 模型文件缺失
确保以下文件存在于项目根目录:
- `kproto_clustering_model.pkl`
- `music_prediction_engine_final.pkl`
- `future_predictions.csv`

### 端口被占用
如果5000端口被占用，编辑 `app.py` 最后一行:
```python
app.run(debug=True, port=5001)  # 改为其他端口
```

### Python环境问题
确保已安装所有依赖:
```powershell
pip install -r requirements.txt
```
