// ==================== 全局变量 ====================
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
    const slider = document.getElementById('runtimeSlider');
    const valueDisplay = document.getElementById('runtimeValue');
    slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
    });
    
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
}

// ==================== 初始化特征锁定面板 ====================
function initializeFeatureLockPanel() {
    const panel = document.getElementById('featureLockPanel');
    panel.innerHTML = '';
    
    Object.entries(FEATURE_DEFINITIONS).forEach(([featureKey, featureInfo]) => {
        const item = document.createElement('div');
        item.className = 'feature-lock-item';
        item.id = `lock-item-${featureKey}`;
        
        item.innerHTML = `
            <div class="feature-lock-header">
                <div class="feature-lock-name">
                    <span class="feature-tooltip" data-feature="${featureKey}">
                        ${featureInfo.name}
                        <span class="tooltip-text">${featureInfo.description}</span>
                    </span>
                </div>
                <div class="lock-toggle">
                    <input type="checkbox" 
                           id="lock-${featureKey}" 
                           class="lock-checkbox"
                           onchange="toggleFeatureLock('${featureKey}')">
                    <label for="lock-${featureKey}" class="lock-label">🔒 锁定</label>
                </div>
            </div>
            <div class="feature-input-container">
                <input type="number" 
                       id="input-${featureKey}"
                       class="feature-input"
                       min="${featureInfo.range[0]}"
                       max="${featureInfo.range[1]}"
                       step="${featureInfo.step}"
                       value="${featureInfo.default}"
                       disabled
                       placeholder="设置值"
                       oninput="updateLockedFeatureValue('${featureKey}', false)"
                       onblur="updateLockedFeatureValue('${featureKey}', true)">
            </div>
            <div class="feature-range-hint">范围: ${featureInfo.range[0]} ~ ${featureInfo.range[1]}</div>
        `;
        
        panel.appendChild(item);
    });
    
    // 添加tooltip位置动态调整
    setupTooltipPositioning();
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
    const checkbox = document.getElementById(`lock-${featureKey}`);
    const input = document.getElementById(`input-${featureKey}`);
    const item = document.getElementById(`lock-item-${featureKey}`);
    const featureInfo = FEATURE_DEFINITIONS[featureKey];
    
    if (checkbox.checked) {
        // 启用输入框
        input.disabled = false;
        item.classList.add('locked');
        
        // 立即读取并保存当前值
        updateLockedFeatureValue(featureKey);
        showToast(`已锁定 ${featureInfo.name}`, 'success');
    } else {
        // 禁用输入框并移除锁定
        input.disabled = true;
        item.classList.remove('locked');
        delete lockedFeatures[featureKey];
        showToast(`已解锁 ${featureInfo.name}`, 'info');
    }
}

// ==================== 更新锁定特征的值 ====================
function updateLockedFeatureValue(featureKey, validateRange = false) {
    const checkbox = document.getElementById(`lock-${featureKey}`);
    const input = document.getElementById(`input-${featureKey}`);
    const featureInfo = FEATURE_DEFINITIONS[featureKey];
    
    // 只有在锁定状态才更新
    if (!checkbox.checked) {
        return;
    }
    
    // 读取值
    let value = parseFloat(input.value);
    
    // 如果是空值或正在输入中，暂不验证（除非是blur事件）
    if (!validateRange && (isNaN(value) || input.value === '')) {
        return;
    }
    
    // 验证范围（只在blur时或初始化时验证）
    if (validateRange) {
        if (isNaN(value) || input.value === '') {
            value = featureInfo.default;
            input.value = value;
            showToast(`${featureInfo.name}不能为空，已重置为 ${value}`, 'warning');
        } else if (value < featureInfo.range[0] || value > featureInfo.range[1]) {
            value = Math.max(featureInfo.range[0], Math.min(featureInfo.range[1], value));
            input.value = value;
            showToast(`${featureInfo.name}值已调整到范围内: ${value}`, 'warning');
        }
    }
    
    // 如果是整数类型，取整
    if (featureInfo.isInteger && !isNaN(value)) {
        value = Math.round(value);
        if (validateRange) {
            input.value = value;
        }
    }
    
    // 只有有效值才更新锁定特征字典
    if (!isNaN(value)) {
        lockedFeatures[featureKey] = value;
        console.log(`🔒 更新锁定特征: ${featureKey} = ${value}, 类型: ${typeof value}`);
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
    
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressSection.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = '正在初始化遗传算法...';
    
    // 模拟进度条
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += (100 / runtime / 10);
        if (progress > 95) progress = 95;
        progressFill.style.width = progress + '%';
        progressText.textContent = `正在优化中... (${Math.round(progress)}%)`;
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
        progressFill.style.width = '100%';
        progressText.textContent = '✅ 生成完成!';
        
        if (result.success) {
            currentResult = result.data;
            displayResult(result.data);
            showToast('音乐特征生成成功!', 'success');
        } else {
            throw new Error(result.error || '生成失败');
        }
        
    } catch (error) {
        clearInterval(progressInterval);
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
function displayResult(data) {
    // 隐藏空状态,显示结果
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('resultContent').classList.remove('hidden');
    
    // 概览数据
    document.getElementById('popularityScore').textContent = data.predicted_popularity.toFixed(1);
    document.getElementById('clusterName').textContent = data.cluster_name.split('(')[0].trim();
    document.getElementById('generations').textContent = data.generations;
    
    // 特征详情
    const featuresGrid = document.getElementById('featuresGrid');
    featuresGrid.innerHTML = '';
    
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
        'artist_popularity': '艺术家流行度',
        'artist_followers': '艺术家粉丝量',
        'duration_min': '歌曲时长(分钟)',
        'track_name_length': '歌曲名长度',
        'album_total_tracks': '专辑曲目数',
        'track_number': '音轨编号'
    };
    
    Object.entries(data.features).forEach(([key, value]) => {
        if (featureDisplayNames[key]) {
            const item = document.createElement('div');
            item.className = 'feature-item';
            
            let displayValue = value;
            if (typeof value === 'number') {
                if (key === 'key') {
                    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    displayValue = keys[Math.round(value)] || value;
                } else if (key === 'mode') {
                    displayValue = value === 1 ? '大调' : '小调';
                } else if (key === 'tempo' || key === 'time_signature' || key === 'artist_popularity' || 
                           key === 'track_name_length' || key === 'album_total_tracks' || key === 'track_number') {
                    displayValue = Math.round(value);
                } else if (key === 'artist_followers') {
                    displayValue = Math.round(value).toLocaleString();  // 添加千位分隔符
                } else if (key === 'duration_min') {
                    displayValue = value.toFixed(2) + ' 分钟';
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
                    <span class="feature-tooltip result-tooltip" data-feature="${key}">
                        ${featureDisplayNames[key]}
                        <span class="tooltip-text">${description}</span>
                    </span>
                </div>
                <div class="feature-value">${displayValue}</div>
            `;
            featuresGrid.appendChild(item);
        }
    });
    
    // 为结果区域的tooltip添加定位
    setTimeout(() => {
        setupTooltipPositioning();
    }, 100);
    
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
