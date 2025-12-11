// ==================== 全局变量 ====================
let hasStarted = false;  // 欢迎页面状态
let currentResult = null;
let lockedFeatures = {};  // 存储锁定的特征值
const API_BASE = '';

// 特征定义（包含描述、范围等信息）
// 注意：前12个是GA优化的音频特征，后6个是辅助参数（不参与优化，但影响流行度预测）
const FEATURE_DEFINITIONS = {
    // ========== GA优化的音频特征 ==========
    'danceability': {
        name: '可舞性',
        description: '描述音乐适合跳舞的程度，基于节奏稳定性、节拍强度等',
        range: [0, 1],
        step: 0.01,
        default: 0.5,
        isInteger: false,
        isAuxiliary: false
    },
    'energy': {
        name: '能量',
        description: '音乐的强度和活跃度，高能量音乐通常快速、响亮、嘈杂',
        range: [0, 1],
        step: 0.01,
        default: 0.5,
        isInteger: false
    },
    'loudness': {
        name: '响度',
        description: '音乐的整体音量(dB)，通常在-60到0之间',
        range: [-60, 0],
        step: 0.5,
        default: -10,
        isInteger: false
    },
    'speechiness': {
        name: '语言性',
        description: '检测音轨中语言内容的比例，接近1表示像播客或有声书',
        range: [0, 1],
        step: 0.01,
        default: 0.05,
        isInteger: false
    },
    'acousticness': {
        name: '原声性',
        description: '音乐是否为原声乐器演奏，1.0表示高度确信为原声',
        range: [0, 1],
        step: 0.01,
        default: 0.5,
        isInteger: false
    },
    'instrumentalness': {
        name: '器乐性',
        description: '预测音轨是否不含人声，接近1表示纯器乐',
        range: [0, 1],
        step: 0.01,
        default: 0,
        isInteger: false
    },
    'liveness': {
        name: '现场感',
        description: '检测录音中是否有观众，高值表示现场演出的可能性大',
        range: [0, 1],
        step: 0.01,
        default: 0.2,
        isInteger: false
    },
    'valence': {
        name: '情感价',
        description: '音乐的积极程度，高值表示快乐/欢快，低值表示悲伤/愤怒',
        range: [0, 1],
        step: 0.01,
        default: 0.5,
        isInteger: false
    },
    'tempo': {
        name: '节奏(BPM)',
        description: '音乐的速度，以每分钟节拍数(BPM)表示',
        range: [50, 200],
        step: 1,
        default: 120,
        isInteger: true
    },
    'key': {
        name: '调性',
        description: '音乐的音调，0=C, 1=C#, 2=D... 11=B',
        range: [0, 11],
        step: 1,
        default: 0,
        isInteger: true
    },
    'mode': {
        name: '调式',
        description: '大调(1)或小调(0)，影响音乐的明暗色彩',
        range: [0, 1],
        step: 1,
        default: 1,
        isInteger: true
    },
    'time_signature': {
        name: '节拍',
        description: '每小节的拍数，通常是3-7，最常见是4/4拍',
        range: [3, 7],
        step: 1,
        default: 4,
        isInteger: true
    },
    'artist_popularity': {
        name: '艺术家流行度',
        description: '艺术家的流行度评分(0-100)，0表示未知艺术家',
        range: [0, 100],
        step: 1,
        default: 0,
        isInteger: true
    },
    'artist_followers': {
        name: '艺术家粉丝量',
        description: '艺术家的粉丝数量，0表示无粉丝或未知',
        range: [0, 100000000],
        step: 10000,
        default: 0,
        isInteger: true
    },
    'duration_min': {
        name: '歌曲时长(分钟)',
        description: '歌曲的总时长，单位为分钟',
        range: [0.5, 20],
        step: 0.1,
        default: 3.5,
        isInteger: false
    },
    'track_name_length': {
        name: '歌曲名长度',
        description: '推荐的歌曲名称字符长度',
        range: [1, 100],
        step: 1,
        default: 20,
        isInteger: true
    },
    'album_total_tracks': {
        name: '专辑曲目数',
        description: '专辑中的总曲目数量',
        range: [1, 100],
        step: 1,
        default: 1,
        isInteger: true
    },
    'track_number': {
        name: '音轨编号',
        description: '该曲目在专辑中的位置编号',
        range: [1, 100],
        step: 1,
        default: 1,
        isInteger: true
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    loadStyles();
    setupEventListeners();
    initializeFeatureLockPanel();
    initModeTabs();  // 初始化模式切换
    initFeaturesToggle();  // 初始化特征列表折叠功能
});

// ==================== 加载音乐风格 ====================
async function loadStyles() {
    try {
        const response = await fetch(`${API_BASE}/api/styles`);
        const styles = await response.json();
        
        const select = document.getElementById('styleSelect');
        select.innerHTML = '<option value="">-- 请选择音乐风格 --</option>';
        
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style.id;
            option.textContent = style.name;
            option.dataset.description = style.description || '';
            select.appendChild(option);
        });
        // 添加悬浮提示事件监听
        setupStyleTooltip(select, styles);
    } catch (error) {
        showToast('加载风格列表失败', 'error');
        console.error(error);
    }
}

// 设置风格悬浮提示
function setupStyleTooltip(selectElement, styles) {
    const tooltip = document.getElementById('styleTooltip');
    const wrapper = selectElement.closest('.style-select-wrapper');
    
    // 创建风格映射表
    const styleMap = {};
    styles.forEach(style => {
        styleMap[style.id] = style;
    });
    
    // 监听鼠标移动
    selectElement.addEventListener('mousemove', (e) => {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (selectedOption && selectedOption.value !== '') {
            const styleId = parseInt(selectedOption.value);
            const style = styleMap[styleId];
            
            if (style && style.description) {
                tooltip.innerHTML = `
                    <span class="tooltip-title">${style.name}</span>
                    <span class="tooltip-content">${style.description}</span>
                `;
                tooltip.classList.remove('hidden');
                tooltip.classList.add('show');
            }
        }
    });
    
    // 鼠标离开时隐藏
    selectElement.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        setTimeout(() => {
            if (!tooltip.classList.contains('show')) {
                tooltip.classList.add('hidden');
            }
        }, 300);
    });
    
    // 选择改变时也更新提示
    selectElement.addEventListener('change', () => {
        tooltip.classList.remove('show');
        tooltip.classList.add('hidden');
    });
}

// ==================== 事件监听 ====================
function setupEventListeners() {
    // 运行时间滑块
    const runtimeSlider = document.getElementById('runtimeSlider');
    const runtimeValueDisplay = document.getElementById('runtimeValue');
    runtimeSlider.addEventListener('input', (e) => {
        runtimeValueDisplay.textContent = e.target.value + ' 秒';
    });
    
    // 艺术家流行度滑块
    const artistPopSlider = document.getElementById('artistPopularity');
    const artistPopValue = document.getElementById('artistPopularityValue');
    if (artistPopSlider && artistPopValue) {
        artistPopSlider.addEventListener('input', (e) => {
            artistPopValue.textContent = e.target.value;
        });
    }
    
    // 风格选择 - 仅用于悬浮提示
    document.getElementById('styleSelect').addEventListener('change', () => {
        // 风格改变时关闭提示框
        const tooltip = document.getElementById('styleTooltip');
        tooltip.classList.remove('show');
        tooltip.classList.add('hidden');
    });
    
    // 特征锁定面板切换
    document.getElementById('toggleFeatureLock').addEventListener('click', toggleFeatureLockPanel);
    
    // 生成按钮
    document.getElementById('generateBtn').addEventListener('click', generateMusic);
    
    // 复制提示词
    document.getElementById('copyPromptBtn').addEventListener('click', copyPrompt);
    
    // 生成AI提示词
    document.getElementById('generateAiPromptBtn').addEventListener('click', generateAiPrompt);
    
    // 导出JSON
    document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
    
    // 重新生成
    document.getElementById('regenerateBtn').addEventListener('click', generateMusic);
    
    // 欢迎页面 - 开始体验按钮
    initLandingPage();
    
    // 艺术家预测按钮（新增）
    document.getElementById('predictArtistBtn').addEventListener('click', predictArtistPopularity);
}

// ==================== 欢迎页面初始化 ====================
function initLandingPage() {
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    const startBtn = document.getElementById('startBtn');
    
    // 检查是否已经访问过（使用sessionStorage）
    const hasVisited = sessionStorage.getItem('hasVisited');
    
    if (hasVisited) {
        // 已访问过，直接显示主应用
        landingPage.style.display = 'none';
        mainApp.classList.remove('main-app');
        mainApp.classList.add('main-app-active');
        hasStarted = true;
    } else {
        // 首次访问，显示欢迎页面
        mainApp.style.display = 'none';
    }
    
    // 开始体验按钮点击事件
    startBtn.addEventListener('click', () => {
        startApplication();
    });
}

function startApplication() {
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    // 标记为已访问
    sessionStorage.setItem('hasVisited', 'true');
    hasStarted = true;
    
    // 添加退出动画
    landingPage.classList.add('fade-exit');
    
    // 等待退出动画完成后显示主应用
    setTimeout(() => {
        landingPage.style.display = 'none';
        mainApp.style.display = 'flex';
        mainApp.classList.remove('main-app');
        mainApp.classList.add('main-app-active');
        
        // 添加进入动画
        mainApp.classList.add('fade-enter');
        
        // 移除动画类
        setTimeout(() => {
            landingPage.classList.remove('fade-exit');
            mainApp.classList.remove('fade-enter');
        }, 600);
    }, 500);
}

// ==================== 初始化特征锁定面板 ====================
function initializeFeatureLockPanel() {
    const panel = document.getElementById('featureLockPanel');
    panel.innerHTML = '';
    
    Object.entries(FEATURE_DEFINITIONS).forEach(([featureKey, featureInfo]) => {
        const item = document.createElement('div');
        item.className = 'feature-lock-row';
        item.id = `lock-item-${featureKey}`;
        
        // 计算初始值
        const defaultValue = featureInfo.default;
        
        item.innerHTML = `
            <label class="feature-row-label" data-tooltip="${featureInfo.description}">${featureInfo.name}</label>
            <div class="feature-row-slider">
                <input type="range" 
                       id="slider-${featureKey}"
                       class="feature-slider"
                       min="${featureInfo.range[0]}"
                       max="${featureInfo.range[1]}"
                       step="${featureInfo.step}"
                       value="${defaultValue}"
                       disabled>
            </div>
            <span class="feature-row-value" id="value-${featureKey}">${defaultValue}</span>
            <button class="feature-lock-btn" 
                    id="lock-btn-${featureKey}"
                    onclick="toggleFeatureLock('${featureKey}')">
                🔓
            </button>
        `;
        
        panel.appendChild(item);
        
        // 添加slider监听器
        const slider = item.querySelector(`#slider-${featureKey}`);
        const valueDisplay = item.querySelector(`#value-${featureKey}`);
        
        slider.addEventListener('input', function() {
            let value = parseFloat(this.value);
            // 格式化显示值
            if (featureInfo.isInteger || featureKey === 'key' || featureKey === 'mode' || featureKey === 'time_signature') {
                value = Math.round(value);
                valueDisplay.textContent = value;
            } else {
                valueDisplay.textContent = value.toFixed(2);
            }
            updateLockedFeatureValue(featureKey, value);
        });
    });
}

// ==================== 设置Tooltip动态定位 ====================
function setupTooltipPositioning() {
    document.querySelectorAll('.feature-tooltip').forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function(e) {
            const tooltipText = this.querySelector('.tooltip-text');
            if (!tooltipText) return;
            
            // 获取触发元素的位置
            const rect = this.getBoundingClientRect();
            
            // 计算tooltip应该显示的位置（显示在元素上方）
            const tooltipLeft = rect.left;
            const tooltipTop = rect.top - 10; // 10px间距
            
            tooltipText.style.left = tooltipLeft + 'px';
            tooltipText.style.top = tooltipTop + 'px';
            tooltipText.style.transform = 'translateY(-100%)';
        });
    });
}

// ==================== 切换特征锁定面板 ====================
function toggleFeatureLockPanel() {
    const panel = document.getElementById('featureLockPanel');
    const button = document.getElementById('toggleFeatureLock');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        button.textContent = '收起特征设置';
    } else {
        panel.classList.add('hidden');
        button.textContent = '展开特征设置';
    }
}

// ==================== 切换单个特征锁定 ====================
function toggleFeatureLock(featureKey) {
    const lockBtn = document.getElementById(`lock-btn-${featureKey}`);
    const slider = document.getElementById(`slider-${featureKey}`);
    const item = document.getElementById(`lock-item-${featureKey}`);
    const valueDisplay = document.getElementById(`value-${featureKey}`);
    
    const isLocked = lockBtn.textContent === '🔒';
    
    if (isLocked) {
        // 解锁
        lockBtn.textContent = '🔓';
        lockBtn.classList.remove('locked');
        slider.disabled = true;
        item.classList.remove('locked');
        delete lockedFeatures[featureKey];
    } else {
        // 锁定
        lockBtn.textContent = '🔒';
        lockBtn.classList.add('locked');
        slider.disabled = false;
        item.classList.add('locked');
        
        // 保存当前值
        const value = parseFloat(slider.value);
        lockedFeatures[featureKey] = value;
    }
}

// ==================== 更新锁定特征的值 ====================
function updateLockedFeatureValue(featureKey, value) {
    // 只有在锁定状态才保存值
    if (lockedFeatures.hasOwnProperty(featureKey)) {
        lockedFeatures[featureKey] = value;
    }
}

// ==================== 风格改变 ====================
async function generateMusic() {
    const styleId = parseInt(document.getElementById('styleSelect').value);
    const runtime = parseFloat(document.getElementById('runtimeSlider').value);
    
    // 验证输入
    if (isNaN(styleId)) {
        showToast('请先选择音乐风格', 'error');
        return;
    }
    
    // UI状态更新
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '🧬 正在生成...';
    
    // 隐藏空状态和结果，显示骨架屏
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('resultContent').classList.add('hidden');
    document.getElementById('skeletonLoader').classList.remove('hidden');
    
    const progressSection = document.getElementById('progressSection');
    const progressText = document.getElementById('progressText');
    
    progressSection.classList.remove('hidden');
    progressText.textContent = '正在初始化遗传算法...';
    
    // 更新进度文本（不再使用进度条）
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += (100 / runtime / 10);
        if (progress > 95) progress = 95;
        const messages = [
            '正在初始化种群...',
            '正在优化特征组合...',
            '正在评估适应度...',
            '正在进化迭代中...',
            '即将完成...'
        ];
        const msgIndex = Math.min(Math.floor(progress / 20), messages.length - 1);
        progressText.textContent = messages[msgIndex];
    }, 100);
    
    // 调试信息
    console.log('📤 发送到后端的数据:', {
        style_id: styleId,
        runtime: runtime,
        locked_features: lockedFeatures
    });
    
    try {
        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                style_id: styleId,
                runtime: runtime,
                locked_features: lockedFeatures  // 传递锁定的特征
            })
        });
        
        const result = await response.json();
        
        clearInterval(progressInterval);
        progressText.textContent = '✅ 生成完成!';
        
        if (result.success) {
            currentResult = result.data;
            
            // 延迟显示结果，创建平滑过渡
            setTimeout(() => {
                document.getElementById('skeletonLoader').classList.add('hidden');
                displayResult(result.data);
            }, 500);
            
            showToast('音乐特征生成成功!', 'success');
        } else {
            throw new Error(result.error || '生成失败');
        }
        
    } catch (error) {
        clearInterval(progressInterval);
        document.getElementById('skeletonLoader').classList.add('hidden');
        document.getElementById('emptyState').classList.remove('hidden');
        showToast('生成失败: ' + error.message, 'error');
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 开始生成';
        setTimeout(() => {
            progressSection.classList.add('hidden');
        }, 2000);
    }
}

// ==================== 展示结果 ====================
let radarChart = null; // 存储雷达图实例

function displayResult(data) {
    // 显示结果内容
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('skeletonLoader').classList.add('hidden');
    document.getElementById('resultContent').classList.remove('hidden');
    
    // 更新圆形进度环
    updateCircularProgress(data.predicted_popularity);
    
    // 概览数据
    document.getElementById('clusterName').textContent = data.cluster_name.split('(')[0].trim();
    
    // 显示BPM而不是迭代代数
    const bpmValue = data.features.tempo ? Math.round(data.features.tempo) : '--';
    document.getElementById('bpmValue').textContent = bpmValue;
    
    // 创建雷达图
    createRadarChart(data.features);
    
    // 特征详情（完整列表） - 只显示音乐特征模型使用的13个特征
    const featuresGrid = document.getElementById('featuresGrid');
    featuresGrid.innerHTML = '';
    
    // 音乐特征模型使用的特征列表（13个）
    const musicModelFeatures = [
        'danceability', 'energy', 'key', 'loudness', 'mode', 
        'speechiness', 'acousticness', 'instrumentalness', 'liveness', 
        'valence', 'tempo', 'duration_ms', 'time_signature'
    ];
    
    const featureDisplayNames = {
        'danceability': '可舞性',
        'energy': '能量',
        'key': '调性',
        'loudness': '响度',
        'mode': '调式',
        'speechiness': '语言性',
        'acousticness': '原声性',
        'instrumentalness': '器乐性',
        'liveness': '现场感',
        'valence': '情感价',
        'tempo': '节奏(BPM)',
        'time_signature': '节拍',
        'duration_ms': '歌曲时长'
    };
    
    // 只显示音乐模型用到的特征
    musicModelFeatures.forEach(key => {
        if (data.features[key] !== undefined && featureDisplayNames[key]) {
            const value = data.features[key];
            const item = document.createElement('div');
            item.className = 'feature-item';
            
            let displayValue = value;
            if (typeof value === 'number') {
                if (key === 'key') {
                    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    displayValue = keys[Math.round(value)] || value;
                } else if (key === 'mode') {
                    displayValue = value === 1 ? '大调' : '小调';
                } else if (key === 'tempo' || key === 'time_signature') {
                    displayValue = Math.round(value);
                } else if (key === 'duration_ms') {
                    displayValue = (value / 60000).toFixed(2) + ' 分钟';
                } else if (value < 1 && value > 0) {
                    displayValue = value.toFixed(2);
                } else {
                    displayValue = value.toFixed(1);
                }
            }
            
            const featureDef = FEATURE_DEFINITIONS[key];
            const description = featureDef ? featureDef.description : '';
            
            item.innerHTML = `
                <div class="feature-name">
                    ${featureDisplayNames[key]}
                </div>
                <div class="feature-value" title="${description}">${displayValue}</div>
            `;
            featuresGrid.appendChild(item);
        }
    });
    
    // AI提示词数据 - 显示为JSON格式
    const promptElement = document.getElementById('aiPrompt');
    if (data.ai_prompt && typeof data.ai_prompt === 'object') {
        // 保存到全局变量供AI生成使用
        currentResult.ai_prompt_data = data.ai_prompt;
        // 格式化JSON显示
        promptElement.textContent = JSON.stringify(data.ai_prompt, null, 2);
    } else {
        // 兼容旧格式
        promptElement.textContent = data.ai_prompt || '暂无数据';
    }
    
    // 重置AI提示词生成状态
    const aiPlaceholder = document.getElementById('aiPromptPlaceholder');
    const aiContent = document.getElementById('aiPromptContent');
    const aiLoading = document.getElementById('aiPromptLoading');
    
    aiPlaceholder.classList.remove('hidden');
    aiContent.classList.add('hidden');
    aiLoading.classList.add('hidden');
    aiContent.textContent = '';
}

// ==================== 复制提示词 ====================
async function copyPrompt() {
    const promptText = document.getElementById('aiPrompt').textContent;
    const btn = document.getElementById('copyPromptBtn');
    const originalText = btn.textContent;
    
    // 方法1: 尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(promptText);
            showToast('提示词已复制到剪贴板!', 'success');
            btn.textContent = '✅ 已复制';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            return;
        } catch (error) {
            console.log('Clipboard API 失败,尝试备用方法', error);
        }
    }
    
    // 方法2: 备用方法 - 使用传统的 execCommand
    try {
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showToast('提示词已复制到剪贴板!', 'success');
            btn.textContent = '✅ 已复制';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } else {
            throw new Error('execCommand 复制失败');
        }
    } catch (error) {
        console.error('复制失败:', error);
        // 方法3: 最后的备选 - 选中文本让用户手动复制
        const promptElement = document.getElementById('aiPrompt');
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(promptElement);
        selection.removeAllRanges();
        selection.addRange(range);
        
        showToast('已选中文本,请按 Ctrl+C 手动复制', 'error');
    }
}

// ==================== 导出JSON ====================
function exportJson() {
    if (!currentResult) {
        showToast('没有可导出的数据', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(currentResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `music_features_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('JSON文件已导出!', 'success');
}

// ==================== 生成AI提示词 ====================
async function generateAiPrompt() {
    if (!currentResult || !currentResult.ai_prompt_data) {
        showToast('请先生成音乐特征', 'error');
        return;
    }
    
    const apiKey = document.getElementById('deepseekApiKey').value.trim();
    if (!apiKey) {
        showToast('请输入DeepSeek API密钥', 'error');
        document.getElementById('deepseekApiKey').focus();
        return;
    }
    
    const btn = document.getElementById('generateAiPromptBtn');
    const placeholder = document.getElementById('aiPromptPlaceholder');
    const content = document.getElementById('aiPromptContent');
    const loading = document.getElementById('aiPromptLoading');
    
    // 显示加载状态
    placeholder.classList.add('hidden');
    content.classList.add('hidden');
    loading.classList.remove('hidden');
    btn.disabled = true;
    btn.textContent = '生成中...';
    
    try {
        const response = await fetch(`${API_BASE}/api/generate-ai-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                music_features: currentResult.ai_prompt_data
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 显示AI生成的提示词
            content.textContent = result.ai_prompt;
            loading.classList.add('hidden');
            content.classList.remove('hidden');
            showToast('AI提示词生成成功!', 'success');
        } else {
            throw new Error(result.error || '生成失败');
        }
    } catch (error) {
        loading.classList.add('hidden');
        placeholder.classList.remove('hidden');
        showToast('生成失败: ' + error.message, 'error');
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = '✨ 生成AI提示词';
    }
}

// ==================== Toast通知 ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ==================== 圆形进度环 ====================
function updateCircularProgress(popularity) {
    const progressBar = document.getElementById('popularityProgressBar');
    const progressText = document.getElementById('popularityScore');
    
    // 计算进度百分比
    const percentage = Math.min(100, Math.max(0, popularity));
    const circumference = 2 * Math.PI * 70; // r=70 (更大的圆)
    const offset = circumference - (percentage / 100) * circumference;
    
    // 动画更新
    setTimeout(() => {
        progressBar.style.strokeDashoffset = offset;
        progressText.textContent = percentage.toFixed(1);
    }, 100);
    
    // 根据分数改变颜色
    let color;
    if (percentage >= 70) {
        color = '#1DB954'; // 绿色 - 高分
    } else if (percentage >= 40) {
        color = '#FFA500'; // 橙色 - 中等
    } else {
        color = '#FF4444'; // 红色 - 低分
    }
    progressBar.style.stroke = color;
}

// ==================== 雷达图 ====================
function createRadarChart(features) {
    // 销毁旧图表
    if (radarChart) {
        radarChart.destroy();
    }
    
    // 筛选0-1范围的音频特征用于雷达图
    const radarFeatures = {
        'danceability': '可舞性',
        'energy': '能量',
        'speechiness': '语言性',
        'acousticness': '原声性',
        'instrumentalness': '器乐性',
        'liveness': '现场感',
        'valence': '情感价'
    };
    
    const labels = [];
    const values = [];
    
    Object.entries(radarFeatures).forEach(([key, label]) => {
        if (features[key] !== undefined) {
            labels.push(label);
            values.push((features[key] * 100).toFixed(1)); // 转换为0-100显示
        }
    });
    
    const ctx = document.getElementById('featuresRadarChart').getContext('2d');
    
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '音频特征',
                data: values,
                fill: true,
                backgroundColor: 'rgba(29, 185, 84, 0.2)',
                borderColor: '#1DB954',
                pointBackgroundColor: '#1DB954',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#1DB954',
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#1DB954',
                    borderColor: '#1DB954',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.r + '%';
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        stepSize: 20,
                        color: '#888',
                        backdropColor: 'transparent',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#b8b8b8',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// ==================== 模式切换 ====================
function initModeTabs() {
    const musicTab = document.getElementById('tabMusicMode');
    const artistTab = document.getElementById('tabArtistMode');
    const musicPanel = document.getElementById('musicModePanel');
    const artistPanel = document.getElementById('artistModePanel');
    
    // 切换到音乐生成模式
    musicTab.addEventListener('click', () => {
        musicTab.classList.add('active');
        artistTab.classList.remove('active');
        musicPanel.classList.add('active');
        artistPanel.classList.add('hidden');
        musicPanel.classList.remove('hidden');
        artistPanel.classList.remove('active');
        
        // 平滑滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 切换到艺术家分析模式
    artistTab.addEventListener('click', () => {
        artistTab.classList.add('active');
        musicTab.classList.remove('active');
        artistPanel.classList.add('active');
        musicPanel.classList.add('hidden');
        artistPanel.classList.remove('hidden');
        musicPanel.classList.remove('active');
        
        // 平滑滚动到顶部 - 确保用户能立即看到艺术家面板内容
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== 特征列表折叠功能 ====================
function initFeaturesToggle() {
    const toggleHeader = document.getElementById('featuresToggle');
    const contentContainer = document.getElementById('featuresGridContainer');
    const toggleText = toggleHeader.querySelector('.toggle-text');
    
    if (!toggleHeader || !contentContainer) return;
    
    // 默认折叠状态
    let isExpanded = false;
    
    toggleHeader.addEventListener('click', () => {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // 展开
            contentContainer.classList.remove('collapsed');
            contentContainer.classList.add('expanded');
            toggleHeader.classList.add('expanded');
            toggleText.textContent = '收起';
        } else {
            // 折叠
            contentContainer.classList.remove('expanded');
            contentContainer.classList.add('collapsed');
            toggleHeader.classList.remove('expanded');
            toggleText.textContent = '展开';
        }
    });
}

// ==================== 艺术家流行度预测 ====================
async function predictArtistPopularity() {
    const releaseYear = parseInt(document.getElementById('releaseYear').value);
    const releaseMonth = parseInt(document.getElementById('releaseMonth').value);
    const artistPopularity = parseInt(document.getElementById('artistPopularity').value);
    const artistFollowers = parseInt(document.getElementById('artistFollowers').value);
    const albumTotalTracks = parseInt(document.getElementById('albumTotalTracks').value);
    const trackNumber = parseInt(document.getElementById('trackNumber').value);
    
    // 验证输入
    if (artistPopularity < 0 || artistPopularity > 100) {
        showToast('艺术家流行度必须在0-100之间', 'error');
        return;
    }
    
    try {
        showToast('正在预测...', 'info');
        
        const response = await fetch(`${API_BASE}/api/predict/artist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                release_year: releaseYear,
                release_month: releaseMonth,
                artist_popularity: artistPopularity,
                artist_followers: artistFollowers,
                album_total_tracks: albumTotalTracks,
                track_number: trackNumber
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayArtistResult(result, {
                releaseYear,
                releaseMonth,
                artistPopularity,
                artistFollowers,
                albumTotalTracks,
                trackNumber
            });
            showToast('预测完成!', 'success');
        } else {
            throw new Error(result.error || '预测失败');
        }
    } catch (error) {
        showToast('预测失败: ' + error.message, 'error');
        console.error(error);
    }
}

function displayArtistResult(result, inputs) {
    const emptyState = document.getElementById('artistEmptyState');
    const resultContent = document.getElementById('artistResultContent');
    
    // 切换显示
    emptyState.classList.add('hidden');
    resultContent.classList.remove('hidden');
    
    // 显示预测流行度
    document.getElementById('artistPredictedPop').textContent = result.predicted_popularity.toFixed(1);
    
    // 计算艺术家影响力等级
    const influence = inputs.artistPopularity >= 70 ? '高' : inputs.artistPopularity >= 40 ? '中' : '低';
    document.getElementById('artistInfluence').textContent = influence;
    
    // 显示发行信息
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('releaseInfo').textContent = `${inputs.releaseYear}年${monthNames[inputs.releaseMonth-1]}`;
    
    // 显示输入特征
    const featuresGrid = document.getElementById('artistFeaturesGrid');
    featuresGrid.innerHTML = `
        <div class="feature-item">
            <span class="feature-name">发行年份</span>
            <span class="feature-value">${inputs.releaseYear}</span>
        </div>
        <div class="feature-item">
            <span class="feature-name">发行月份</span>
            <span class="feature-value">${monthNames[inputs.releaseMonth-1]} (${inputs.releaseMonth})</span>
        </div>
        <div class="feature-item">
            <span class="feature-name">艺术家流行度</span>
            <span class="feature-value">${inputs.artistPopularity}/100</span>
        </div>
        <div class="feature-item">
            <span class="feature-name">艺术家粉丝数</span>
            <span class="feature-value">${inputs.artistFollowers.toLocaleString()}</span>
        </div>
        <div class="feature-item">
            <span class="feature-name">专辑总曲目</span>
            <span class="feature-value">${inputs.albumTotalTracks}</span>
        </div>
        <div class="feature-item">
            <span class="feature-name">曲目编号</span>
            <span class="feature-value">#${inputs.trackNumber}</span>
        </div>
    `;
    
    // 生成洞察建议
    const insights = generateArtistInsights(result.predicted_popularity, inputs);
    const insightsContent = document.getElementById('artistInsights');
    insightsContent.innerHTML = insights.map(insight => 
        `<div class="insight-item">${insight}</div>`
    ).join('');
}

function generateArtistInsights(predictedPop, inputs) {
    const insights = [];
    
    // 流行度评价
    if (predictedPop >= 70) {
        insights.push('🎯 <strong>预测流行度较高</strong>：该曲目有很大潜力获得关注');
    } else if (predictedPop >= 40) {
        insights.push('📊 <strong>预测流行度中等</strong>：属于正常表现范围');
    } else {
        insights.push('💡 <strong>预测流行度较低</strong>：可能需要额外推广支持');
    }
    
    // 艺术家影响力分析
    if (inputs.artistPopularity >= 70) {
        insights.push('👤 <strong>艺术家影响力强</strong>：较高的流行度有助于新歌推广');
    } else if (inputs.artistPopularity < 30) {
        insights.push('👤 <strong>建议提升艺术家知名度</strong>：增加社交媒体互动和演出曝光');
    }
    
    // 粉丝数分析
    if (inputs.artistFollowers >= 1000000) {
        insights.push('🔥 <strong>粉丝基础雄厚</strong>：百万级粉丝将带来强大传播力');
    } else if (inputs.artistFollowers < 10000) {
        insights.push('📢 <strong>建议扩大粉丝群</strong>：通过合作、宣传增加关注者');
    }
    
    // 发行时间分析
    const summerMonths = [6, 7, 8];
    const winterMonths = [12, 1, 2];
    if (summerMonths.includes(inputs.releaseMonth)) {
        insights.push('☀️ <strong>夏季发行</strong>：适合发布欢快、节奏感强的作品');
    } else if (winterMonths.includes(inputs.releaseMonth)) {
        insights.push('❄️ <strong>冬季发行</strong>：适合发布抒情、温暖主题的作品');
    }
    
    // 专辑策略
    if (inputs.trackNumber <= 3) {
        insights.push('🎵 <strong>专辑前排曲目</strong>：作为开场曲更容易被听众发现');
    }
    
    if (inputs.albumTotalTracks > 15) {
        insights.push('💿 <strong>大型专辑</strong>：曲目较多，建议重点推广核心单曲');
    }
    
    return insights;
}
