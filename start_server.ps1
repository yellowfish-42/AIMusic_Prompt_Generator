# 启动音乐生成系统服务器

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  🎵 AI音乐生成系统启动脚本" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 指定Python路径
$pythonPath = "D:\miniconda3\envs\da_env\python.exe"

# 检查Python是否存在
Write-Host "📌 检查Python环境..." -ForegroundColor Yellow
if (-not (Test-Path $pythonPath)) {
    Write-Host "❌ 未找到Python: $pythonPath" -ForegroundColor Red
    exit 1
}

$pythonVersion = & $pythonPath --version
Write-Host "✅ $pythonVersion" -ForegroundColor Green
Write-Host "✅ 路径: $pythonPath" -ForegroundColor Green
Write-Host ""

# 跳过虚拟环境检查(使用Conda环境)
Write-Host "📌 使用Conda环境: da_env" -ForegroundColor Yellow
Write-Host "✅ 环境已配置" -ForegroundColor Green
Write-Host ""

# 检查依赖
Write-Host "📌 检查依赖包..." -ForegroundColor Yellow
$pipList = & $pythonPath -m pip list 2>$null
if ($pipList -match "Flask") {
    Write-Host "✅ 依赖包已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️  依赖包未安装" -ForegroundColor Yellow
    $installDeps = Read-Host "是否安装依赖包? (y/n)"
    if ($installDeps -eq 'y') {
        Write-Host "🔧 安装依赖中..." -ForegroundColor Yellow
        & $pythonPath -m pip install -r requirements.txt
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    }
}
Write-Host ""

# 检查模型文件
Write-Host "📌 检查模型文件..." -ForegroundColor Yellow
$modelsExist = $true
if (-not (Test-Path "kproto_clustering_model.pkl")) {
    Write-Host "❌ 缺少聚类模型: kproto_clustering_model.pkl" -ForegroundColor Red
    $modelsExist = $false
}
if (-not (Test-Path "music_prediction_engine_final.pkl")) {
    Write-Host "❌ 缺少预测模型: music_prediction_engine_final.pkl" -ForegroundColor Red
    $modelsExist = $false
}

if ($modelsExist) {
    Write-Host "✅ 模型文件完整" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  请确保模型文件位于项目根目录" -ForegroundColor Yellow
    $continue = Read-Host "是否继续启动? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}
Write-Host ""

# 启动服务
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  🚀 正在启动Flask服务..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址: http://localhost:5000" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

& $pythonPath app.py
