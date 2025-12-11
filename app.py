"""
音乐生成系统 - Flask 后端服务
支持基于遗传算法的音乐特征优化和AI提示词生成
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import time
import random
from typing import List, Dict, Tuple
import os
from datetime import datetime
import math
import requests
import json

app = Flask(__name__)
CORS(app)

# 未来预测数据（从CSV加载）
future_predictions_df = None

# 数据集统计值（用于计算delta特征，从CSV动态加载）
DATASET_STATS = {
    'duration_mean': 194309.229508,  # 毫秒（默认值，会被CSV覆盖）
    'loudness_mean': -5.812803,
    'instrumentalness_mean': 0.017692,
    'liveness_mean': 0.189231,
    'key_mode': 0,  # 众数
    'mode_mode': 1   # 众数
}

# 全局变量存储模型
clustering_model = None
clustering_scaler = None  # 聚类模型的标准化器
prediction_artifacts = None
feature_names = None

# 双RandomForest模型（新增）
rf_model_music = None      # 音乐特征模型（13个特征）
rf_model_artist = None     # 艺术家特征模型（7个特征）

# 音乐风格映射
CLUSTER_NAMES = {
    0: "经典原声人声 (Acoustic & Vocal Standards)",
    1: "喜剧与有声内容 (Spoken Word & Comedy)", 
    2: "高能器乐与硬核 (High-Energy Instrumental)",
    3: "重型摇滚与EDM (Heavy Rock & Electronic)",
    4: "热情现场与拉美 (Live Latin & Brazilian)",
    5: "极速激昂 (High-Speed Intense)",
    6: "快乐律动舞曲 (Groovy Party & Dance)",
    7: "静谧氛围轻音乐 (Ambient & Classical)"
}

# 风格详细描述
CLUSTER_DESCRIPTIONS = {
    0: "爵士、民谣、柔和人声。主要由原声乐器伴奏，听感柔和，适合咖啡馆背景或夜晚放松。",
    1: "脱口秀、有声书、喜剧现场录音。内容几乎全是说话，带有现场笑声，非传统音乐。",
    2: "极简科技舞曲、黑金属。高能量快节奏，大部分无歌词，注重氛围渲染或感官刺激的硬核音乐。",
    3: "金属核、重金属、Dubstep、EDM。响度极高，冲击力强，适合健身、宣泄情绪、音乐节。",
    4: "桑巴、雷鬼、福音音乐。现场录音，氛围热烈，强调互动和节奏感，听起来喜庆。",
    5: "硬派舞曲、鼓打贝斯、朋克。BPM通常160以上，速度就是一切，适合跑步或极限运动。",
    6: "雷鬼顿、迪斯科、放克、Hip-hop。最适合跳舞，节奏感强，情绪高昂，典型派对音乐。",
    7: "新世纪、助眠、古典、氛围音乐。极低能量，几乎全是原声乐器且无人声，用于助眠、冥想、学习。"
}

# 特征定义知识库
FEATURE_DESCRIPTIONS = {
    'danceability': '可舞性 - 描述音乐适合跳舞的程度(0-1)',
    'energy': '能量 - 音乐的强度和活跃度(0-1)',
    'key': '调性 - 音乐的音调(0-11, 对应C到B)',
    'loudness': '响度 - 音乐的整体音量(-60到0 dB)',
    'mode': '调式 - 大调(1)或小调(0)',
    'speechiness': '语言性 - 音轨中语言成分的比例(0-1)',
    'acousticness': '原声性 - 是否为原声乐器演奏(0-1)',
    'instrumentalness': '器乐性 - 音乐中不含人声的程度(0-1)',
    'liveness': '现场感 - 音乐是否为现场录音(0-1)',
    'valence': '情感价 - 音乐的积极程度(0-1)',
    'tempo': '节奏 - 音乐的速度(BPM)',
    'time_signature': '节拍 - 每小节的拍数(通常3-7)'
}


def load_models():
    """加载聚类模型、双RandomForest预测模型和未来预测数据"""
    global clustering_model, clustering_scaler, prediction_artifacts, feature_names
    global future_predictions_df, DATASET_STATS
    global rf_model_music, rf_model_artist
    
    try:
        # 加载聚类模型(字典格式)
        clustering_artifacts = joblib.load('kproto_clustering_model.pkl')
        clustering_model = clustering_artifacts.get('model')
        clustering_scaler = clustering_artifacts.get('scaler')
        print("✅ 聚类模型加载成功")
        
        # 加载双RandomForest模型（新增）
        try:
            rf_model_music = joblib.load('rf_model_music.pkl')
            print("✅ 音乐特征RandomForest模型加载成功")
        except FileNotFoundError:
            print("⚠️  未找到rf_model_music.pkl，音乐特征预测功能不可用")
            rf_model_music = None
        
        try:
            rf_model_artist = joblib.load('rf_model_artist.pkl')
            print("✅ 艺术家特征RandomForest模型加载成功")
        except FileNotFoundError:
            print("⚠️  未找到rf_model_artist.pkl，艺术家分析功能不可用")
            rf_model_artist = None
        
        # 加载旧版预测模型及相关信息（兼容性保留）
        prediction_artifacts = joblib.load('music_prediction_engine_final.pkl')
        feature_names = prediction_artifacts.get('features', [])
        print(f"✅ 旧版预测模型加载成功 - 特征数: {len(feature_names)}")
        
        # 加载未来预测数据CSV
        try:
            future_predictions_df = pd.read_csv('future_predictions.csv')
            print(f"✅ 未来预测数据加载成功 - 年份范围: {future_predictions_df['year'].min()}-{future_predictions_df['year'].max()}")
            
            # 更新当前年份的统计值
            current_year = datetime.now().year
            update_stats_for_year(current_year)
        except FileNotFoundError:
            print("⚠️  未找到future_predictions.csv，使用默认统计值")
            future_predictions_df = None
        
        return True
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        return False


def update_stats_for_year(year: int):
    """根据年份更新DATASET_STATS"""
    global DATASET_STATS, future_predictions_df
    
    if future_predictions_df is None:
        return
    
    # 查找对应年份的数据
    year_data = future_predictions_df[future_predictions_df['year'] == year]
    
    if len(year_data) > 0:
        row = year_data.iloc[0]
        DATASET_STATS['duration_mean'] = row['predicted_duration_ms']
        DATASET_STATS['loudness_mean'] = row['predicted_loudness']
        DATASET_STATS['instrumentalness_mean'] = row['predicted_instrumentalness']
        DATASET_STATS['liveness_mean'] = row['predicted_liveness']
        print(f"✅ 已更新{year}年的统计值: duration={DATASET_STATS['duration_mean']:.2f}ms, "
              f"loudness={DATASET_STATS['loudness_mean']:.2f}dB")
    else:
        print(f"⚠️  未找到{year}年的预测数据，使用默认值")


# 自动加载模型(用于测试和直接导入)
if clustering_model is None:
    load_models()


class MusicGeneticAlgorithm:
    """遗传算法优化音乐特征"""
    
    def __init__(self, target_cluster: int, max_time: float = 5.0, locked_features: Dict = None):
        """
        初始化遗传算法
        
        Args:
            target_cluster: 目标音乐风格类别(0-7)
            max_time: 最大运行时间(秒)
            locked_features: 锁定的特征字典 {feature_name: value}
        """
        self.target_cluster = target_cluster
        self.max_time = max_time
        self.locked_features = locked_features or {}  # 用户锁定的特征
        
        # GA参数(后端固定，优化后的参数)
        self.population_size = 50  # 减少种群大小提高速度
        self.elite_size = 5
        self.mutation_rate = 0.2  # 提高变异率增加探索
        self.crossover_rate = 0.8
        
        # 缓存机制：避免重复计算
        self._fitness_cache = {}
        self._cluster_cache = {}
        
        # 特征约束范围（只包含GA优化的音频特征）
        self.feature_bounds = {
            'danceability': (0.0, 1.0),
            'energy': (0.0, 1.0),
            'key': (0, 11),
            'loudness': (-60.0, 0.0),
            'mode': (0, 1),
            'speechiness': (0.0, 1.0),
            'acousticness': (0.0, 1.0),
            'instrumentalness': (0.0, 1.0),
            'liveness': (0.0, 1.0),
            'valence': (0.0, 1.0),
            'tempo': (50.0, 200.0),
            'time_signature': (3, 7),
            'duration_min': (1.0, 5.0)  # GA搜索范围：1-5分钟
        }
        
        # 辅助特征（不参与GA优化，从locked_features获取或使用默认值）
        self.auxiliary_features = {
            'artist_popularity': 0,
            'artist_followers': 0,
            'track_name_length': 20,
            'album_total_tracks': 1,
            'track_number': 1
        }
        
    def create_individual(self) -> Dict:
        """创建一个随机个体（考虑锁定特征）"""
        individual = {}
        
        # 1. 处理音频特征（GA优化的特征）
        for feature, (low, high) in self.feature_bounds.items():
            # 如果该特征被锁定，使用锁定的值（不受GA范围限制）
            if feature in self.locked_features:
                individual[feature] = self.locked_features[feature]
            else:
                # 否则在GA范围内随机生成
                if feature in ['key', 'mode', 'time_signature']:
                    individual[feature] = random.randint(int(low), int(high))
                else:
                    individual[feature] = random.uniform(low, high)
        
        # 2. 添加辅助特征（从locked_features获取或使用默认值）
        for feature, default_value in self.auxiliary_features.items():
            individual[feature] = self.locked_features.get(feature, default_value)
        
        return individual
    
    def create_population(self) -> List[Dict]:
        """创建初始种群,快速生成符合目标风格的个体"""
        population = []
        max_attempts = self.population_size * 5  # 减少最大尝试次数
        attempts = 0
        
        # 先尝试生成符合目标风格的个体
        while len(population) < self.population_size * 0.8 and attempts < max_attempts:
            individual = self.create_individual()
            cluster = self.predict_cluster(individual)
            
            # 如果符合目标风格,加入种群
            if cluster == self.target_cluster:
                population.append(individual)
            
            attempts += 1
        
        # 如果还不够,直接随机补充(提高多样性,不再检查风格)
        while len(population) < self.population_size:
            population.append(self.create_individual())
        
        return population
    
    def _get_individual_key(self, individual: Dict) -> tuple:
        """生成个体的唯一标识用于缓存"""
        # 只用音频特征作为key（这些决定了聚类）
        return tuple(round(individual[k], 4) for k in [
            'danceability', 'energy', 'loudness', 'speechiness',
            'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo',
            'key', 'mode', 'time_signature'
        ])
    
    def calculate_fitness(self, individual: Dict) -> float:
        """
        计算个体适应度（带缓存优化）
        
        适应度 = 预测流行度 - 风格偏离惩罚
        """
        # 使用缓存
        ind_key = self._get_individual_key(individual)
        if ind_key in self._fitness_cache:
            return self._fitness_cache[ind_key]
        
        # 检查是否属于目标风格(优先检查)
        cluster = self.predict_cluster(individual)
        
        # 如果不属于目标风格,给予巨大惩罚
        if cluster != self.target_cluster:
            fitness = -1000
            self._fitness_cache[ind_key] = fitness
            return fitness
        
        # 只有属于目标风格的个体才计算流行度
        features = self.prepare_features(individual)
        popularity = prediction_artifacts['model'].predict([features])[0]
        
        self._fitness_cache[ind_key] = popularity
        return popularity
    
    def prepare_features(self, individual: Dict) -> List:
        """准备模型输入特征向量"""
        # 获取当前时间
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # 计算release_month的sin和cos
        release_month_sin = math.sin(2 * math.pi * current_month / 12)
        release_month_cos = math.cos(2 * math.pi * current_month / 12)
        
        # 从individual中获取用户指定的值，如果没有则使用默认值
        duration_min = individual.get('duration_min', 3.5)
        artist_popularity = individual.get('artist_popularity', 0)
        artist_followers = individual.get('artist_followers', 0)
        track_name_length = individual.get('track_name_length', 20)
        album_total_tracks = individual.get('album_total_tracks', 1)
        track_number = individual.get('track_number', 1)
        
        # 计算delta特征（与数据集统计值的差异）
        duration_ms = duration_min * 60000  # 转换为毫秒
        delta_duration = abs(duration_ms - DATASET_STATS['duration_mean'])
        delta_loudness = abs(individual['loudness'] - DATASET_STATS['loudness_mean'])
        delta_instrumentalness = abs(individual['instrumentalness'] - DATASET_STATS['instrumentalness_mean'])
        delta_liveness = abs(individual['liveness'] - DATASET_STATS['liveness_mean'])
        delta_key = abs(individual['key'] - DATASET_STATS['key_mode'])
        delta_mode = abs(individual['mode'] - DATASET_STATS['mode_mode'])
        
        # 基础特征
        features_dict = {
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
            'time_signature': individual['time_signature'],
            
            # 用户可指定的特征（或使用默认值）
            'track_duration_min': duration_min,
            'release_year': current_year,
            'release_month_sin': release_month_sin,
            'release_month_cos': release_month_cos,
            'track_name_length': track_name_length,
            'artist_popularity': artist_popularity,
            'artist_followers': artist_followers,
            'album_total_tracks': album_total_tracks,
            'track_number': track_number,
            'cluster_label': self.target_cluster,
            
            # Delta特征（计算得出）
            'delta_duration': delta_duration,
            'delta_loudness': delta_loudness,
            'delta_instrumentalness': delta_instrumentalness,
            'delta_liveness': delta_liveness,
            'delta_key': delta_key,
            'delta_mode': delta_mode
        }
        
        # 按照训练时的特征顺序排列
        feature_vector = [features_dict.get(f, 0) for f in feature_names]
        return feature_vector
    
    def predict_cluster(self, individual: Dict) -> int:
        """预测个体所属风格类别(需要对数值特征标准化，带缓存)"""
        # 使用缓存
        ind_key = self._get_individual_key(individual)
        if ind_key in self._cluster_cache:
            return self._cluster_cache[ind_key]
        
        # 准备聚类特征(只需要基础音频特征)
        num_features = np.array([[
            individual['danceability'],
            individual['energy'],
            individual['loudness'],
            individual['speechiness'],
            individual['acousticness'],
            individual['instrumentalness'],
            individual['liveness'],
            individual['valence'],
            individual['tempo']
        ]])
        
        cat_features = np.array([[
            individual['key'],
            individual['mode'],
            individual['time_signature']
        ]])
        
        # 对数值特征进行标准化(关键!)
        if clustering_scaler is not None:
            num_features = clustering_scaler.transform(num_features)
        
        # K-Prototypes需要合并特征
        X = np.hstack([num_features, cat_features])
        cluster = clustering_model.predict(X, categorical=[9, 10, 11])[0]
        
        # 缓存结果
        self._cluster_cache[ind_key] = cluster
        return cluster
    
    def selection(self, population: List[Dict], fitness_scores: List[float]) -> List[Dict]:
        """锦标赛选择（优化版）"""
        selected = []
        tournament_size = 3  # 减小锦标赛规模，提高速度
        
        # 预先创建索引列表，避免重复采样
        pop_indices = list(range(len(population)))
        
        for _ in range(len(population)):
            # 随机选择索引
            tournament_indices = random.sample(pop_indices, tournament_size)
            # 找到最佳个体的索引
            best_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
            selected.append(population[best_idx].copy())
        
        return selected
    
    def crossover(self, parent1: Dict, parent2: Dict) -> Tuple[Dict, Dict]:
        """单点交叉（跳过锁定特征）"""
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        child1, child2 = {}, {}
        features = list(self.feature_bounds.keys())
        crossover_point = random.randint(1, len(features) - 1)
        
        # 交叉音频特征
        for i, feature in enumerate(features):
            # 锁定的特征保持不变
            if feature in self.locked_features:
                child1[feature] = self.locked_features[feature]
                child2[feature] = self.locked_features[feature]
            else:
                if i < crossover_point:
                    child1[feature] = parent1[feature]
                    child2[feature] = parent2[feature]
                else:
                    child1[feature] = parent2[feature]
                    child2[feature] = parent1[feature]
        
        # 复制辅助特征（保持不变）
        for feature in self.auxiliary_features.keys():
            child1[feature] = parent1.get(feature, self.auxiliary_features[feature])
            child2[feature] = parent2.get(feature, self.auxiliary_features[feature])
        
        return child1, child2
    
    def mutate(self, individual: Dict) -> Dict:
        """高斯变异(简化版，提高速度，跳过锁定特征)"""
        mutated = individual.copy()
        
        # 只对未锁定的特征进行变异
        unlocked_features = [f for f in self.feature_bounds.keys() if f not in self.locked_features]
        
        if not unlocked_features:
            return mutated  # 如果所有特征都被锁定，直接返回
        
        # 只对部分特征进行变异，减少计算
        num_mutations = max(1, int(len(unlocked_features) * self.mutation_rate))
        features_to_mutate = random.sample(unlocked_features, min(num_mutations, len(unlocked_features)))
        
        for feature in features_to_mutate:
            low, high = self.feature_bounds[feature]
            
            if feature in ['key', 'mode', 'time_signature']:
                mutated[feature] = random.randint(int(low), int(high))
            else:
                # 高斯扰动
                sigma = (high - low) * 0.15  # 稍微增大扰动范围
                mutated[feature] = np.clip(
                    mutated[feature] + random.gauss(0, sigma),
                    low, high
                )
        
        return mutated
    
    def evolve(self) -> Dict:
        """执行遗传算法优化"""
        population = self.create_population()
        start_time = time.time()
        generation = 0
        best_individual = None
        best_fitness = -float('inf')
        
        while time.time() - start_time < self.max_time:
            # 计算适应度
            fitness_scores = [self.calculate_fitness(ind) for ind in population]
            
            # 更新最优解
            max_idx = np.argmax(fitness_scores)
            if fitness_scores[max_idx] > best_fitness:
                best_fitness = fitness_scores[max_idx]
                best_individual = population[max_idx].copy()
            
            # 精英保留
            elite_indices = np.argsort(fitness_scores)[-self.elite_size:]
            elites = [population[i].copy() for i in elite_indices]
            
            # 选择
            selected = self.selection(population, fitness_scores)
            
            # 交叉和变异
            next_generation = elites.copy()
            while len(next_generation) < self.population_size:
                parent1, parent2 = random.sample(selected, 2)
                child1, child2 = self.crossover(parent1, parent2)
                next_generation.append(self.mutate(child1))
                if len(next_generation) < self.population_size:
                    next_generation.append(self.mutate(child2))
            
            population = next_generation
            generation += 1
        
        elapsed_time = time.time() - start_time
        predicted_popularity = self.calculate_fitness(best_individual) + \
                             (30 if self.predict_cluster(best_individual) != self.target_cluster else 0)
        
        return {
            'features': best_individual,
            'predicted_popularity': float(predicted_popularity),
            'cluster': int(self.predict_cluster(best_individual)),
            'cluster_name': CLUSTER_NAMES[self.predict_cluster(best_individual)],
            'generations': generation,
            'elapsed_time': round(elapsed_time, 2)
        }


def generate_ai_prompt(features: Dict, cluster_name: str) -> Dict:
    """
    根据音乐特征生成结构化数据供AI API使用
    只包含13个音乐特征模型使用的纯音乐属性
    
    Args:
        features: 音乐特征字典
        cluster_name: 音乐风格名称
    
    Returns:
        包含音乐特征数值的字典
    """
    # 调性映射
    key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    key_name = key_names[int(features['key'])] if 0 <= features['key'] < 12 else 'Unknown'
    
    # 构建结构化数据 - 只包含13个音乐特征
    # 注意：GA优化器返回的是duration_min，需要转换为duration_ms
    duration_min = features.get('duration_min', 3.5)
    duration_ms = int(duration_min * 60000)
    
    prompt_data = {
        # 基本信息
        'style': cluster_name,
        
        # 音频特征（0-1范围）
        'danceability': round(features['danceability'], 3),  # 可舞性
        'energy': round(features['energy'], 3),  # 能量
        'speechiness': round(features['speechiness'], 3),  # 语言性
        'acousticness': round(features['acousticness'], 3),  # 原声性
        'instrumentalness': round(features['instrumentalness'], 3),  # 器乐性
        'liveness': round(features['liveness'], 3),  # 现场感
        'valence': round(features['valence'], 3),  # 情感价
        
        # 音乐参数
        'tempo': round(features['tempo'], 1),  # BPM
        'key': key_name,  # 调性名称
        'key_number': int(features['key']),  # 调性编号
        'mode': 'Major' if features['mode'] == 1 else 'Minor',  # 调式
        'loudness': round(features['loudness'], 2),  # 响度 (dB)
        'time_signature': int(features['time_signature']),  # 节拍
        
        # 歌曲时长
        'duration_ms': duration_ms,  # 时长（毫秒）
        'duration_min': round(duration_min, 2)  # 时长（分钟）
    }
    
    return prompt_data


def call_deepseek_api(api_key: str, music_features: Dict) -> Dict:
    """
    调用DeepSeek API生成音乐提示词
    
    Args:
        api_key: DeepSeek API密钥
        music_features: 音乐特征数据
    
    Returns:
        包含AI生成提示词的字典
    """
    if not api_key or api_key.strip() == '':
        return {
            'success': False,
            'error': 'API密钥为空',
            'prompt': None
        }
    
    # DeepSeek API配置
    api_url = "https://api.deepseek.com/v1/chat/completions"
    
    # 构建系统提示词 - 包含完整的特征定义和类别说明
    system_prompt = """你是一个专业的音乐描述专家。下面是音乐特征的完整定义：

## 音乐特征定义
1. **danceability (舞动感/舞曲性)**: 描述了一首曲目适合跳舞的程度，基于包括节奏、节奏稳定性、节拍强度和整体规律性在内的多种音乐元素组合。0.0 的值最不适合跳舞，而 1.0 的值最适合跳舞。

2. **energy (能量)**: 是一个从 0.0 到 1.0 的度量，表示对强度和活动的主观感知。通常，充满活力的曲目感觉快速、响亮且嘈杂。例如，死亡金属具有高能量，而巴赫前奏曲在该量表上的得分较低。

3. **key (调性)**: 轨道的估计总体调性。整数使用标准音名记号映射到音高。例如，0 = C，1 = C♯/D♭，2 = D，以此类推。如果没有检测到调性，值为 -1。

4. **loudness (响度)**: 轨道的整体响度，单位为分贝（dB）。响度值在整个轨道中取平均值，可用于比较轨道的相对响度。典型值范围在 -60 到 0 dB 之间。

5. **mode (模式/调式)**: 表示歌曲的调式（大调或小调），即其旋律内容所依据的音阶类型。大调用 1 表示，小调用 0 表示。

6. **speechiness (语音感/语言感)**: 检测歌曲中是否存在人声。录音越像纯人声（例如脱口秀、有声书、诗歌），该属性的值就越接近 1.0。值高于 0.66 描述的可能是完全由人声组成的歌曲；值在 0.33 到 0.66 之间描述的歌曲可能同时包含音乐和人声（可分段或叠加，如说唱音乐）；值低于 0.33 最可能代表音乐和其他非人声类歌曲。

7. **acousticness (声学特征/原声度)**: 一个从 0.0 到 1.0 的置信度度量，表示该曲目是否为原声。1.0 表示高度置信该曲目是原声。

8. **instrumentalness (器乐性)**: 预测曲目是否不包含人声。"Ooh"和"aah"类声音在此语境下视为器乐，说唱或朗诵类曲目则明确为"人声"。该值越接近 1.0，曲目无演唱内容的可能性越大；值高于 0.5 通常代表器乐曲目，且数值越趋近 1.0，判定置信度越高。

9. **liveness (现场感)**: 检测录音中是否存在观众。该值越高，曲目为现场演出的概率越大，当值高于 0.8 时，可判定曲目大概率为现场版本。

10. **valence (效价/情绪值)**: 一个从 0.0 到 1.0 的度量，描述曲目所传达的音乐积极性。高效价曲目听起来更积极（如快乐、愉快、兴奋），低效价曲目则更消极（如悲伤、沮丧、愤怒）。

11. **tempo (速度)**: 曲目整体的估计速度，单位为每分钟节拍数（BPM）。在音乐术语中，速度指作品的快慢，直接由平均节拍持续时间推导而来。

12. **duration_min (歌曲时长)**: 歌曲的时长，单位为分钟。

## 音乐风格类别参考
- **经典原声人声**: 爵士、民谣、柔和、强调人声演唱，适合咖啡馆或夜晚放松
- **喜剧与有声内容**: 脱口秀、相声、有声书等非音乐内容
- **高能器乐与硬核**: 极简科技、黑金属、无歌词、高能量
- **重型摇滚与EDM**: 响度大、金属核、Dubstep、适合健身和音乐节
- **热情现场与拉美**: 桑巴、雷鬼、现场录音、节日庆典氛围
- **极速激昂**: 超快BPM、硬派舞曲、朋克，适合跑步和极限运动
- **快乐律动舞曲**: 雷鬼顿、迪斯科、放克，最适合派对和跳舞
- **静谧氛围轻音乐**: 古典、新世纪、助眠音乐，用于冥想和深度工作

## 你的任务目标
请根据上述定义，根据下面的特征数值，生成用于生成AI音乐的提示词。提示词应当：
1. 用自然、生动、富有感染力的语言描述音乐的风格、情绪、节奏和氛围
2. 结合特征值的具体含义进行准确描述
3. 让AI音乐生成系统能够理解并创作出符合这些特征的音乐
4. 控制在50-250字之间
5. 提示词为英文，要有对应的中文翻译版本

注意：用户只能看到你生成的音乐描述文本，看不到特征定义等背景信息。直接输出音乐描述即可，不要有任何前缀或解释。"""

    # 构建用户消息
    user_message = f"""请根据以下音乐特征生成一段自然流畅的音乐描述：

【基础信息】
- 风格分类：{music_features.get('style', '未知风格')}
- 歌曲时长：{music_features.get('duration_min', 0):.2f} 分钟
- 速度 (BPM)：{music_features.get('tempo', 0):.1f}
- 调性 (key)：{music_features.get('key', 0)}
- 调式 (mode)：{'大调' if music_features.get('mode', 0) == 1 else '小调'}

【核心音乐特征】(范围0.0-1.0)
- 舞动感 (danceability)：{music_features.get('danceability', 0):.3f}
- 能量 (energy)：{music_features.get('energy', 0):.3f}
- 情绪值 (valence)：{music_features.get('valence', 0):.3f}
- 原声度 (acousticness)：{music_features.get('acousticness', 0):.3f}
- 器乐性 (instrumentalness)：{music_features.get('instrumentalness', 0):.3f}
- 现场感 (liveness)：{music_features.get('liveness', 0):.3f}
- 语音感 (speechiness)：{music_features.get('speechiness', 0):.3f}

【音量信息】
- 响度 (loudness)：{music_features.get('loudness', 0):.2f} dB

请直接输出音乐描述文本，不要有任何前缀。"""

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        ai_prompt = result['choices'][0]['message']['content'].strip()
        
        return {
            'success': True,
            'prompt': ai_prompt,
            'error': None
        }
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'API请求超时，请重试',
            'prompt': None
        }
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                error_msg = error_detail.get('error', {}).get('message', error_msg)
            except:
                pass
        return {
            'success': False,
            'error': f'API调用失败: {error_msg}',
            'prompt': None
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'未知错误: {str(e)}',
            'prompt': None
        }


# ==================== API 路由 ====================

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')


@app.route('/api/styles', methods=['GET'])
def get_styles():
    """获取所有音乐风格"""
    styles = [
        {
            'id': k, 
            'name': v,
            'description': CLUSTER_DESCRIPTIONS.get(k, '')
        } 
        for k, v in CLUSTER_NAMES.items()
    ]
    return jsonify(styles)


@app.route('/api/predict/music', methods=['POST'])
def predict_music_popularity():
    """
    使用音乐特征预测流行度 (RandomForest模型)
    
    请求体:
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
    """
    try:
        if rf_model_music is None:
            return jsonify({
                'success': False,
                'error': '音乐特征预测模型未加载'
            }), 503
        
        data = request.json
        
        # 13个音频特征（按训练时的顺序）
        features_order = [
            'danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
            'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo',
            'duration_ms', 'time_signature'
        ]
        
        # 构建特征向量
        X = []
        for feat in features_order:
            value = data.get(feat, 0)
            X.append(value)
        
        # 预测
        X_array = np.array([X])
        predicted_popularity = rf_model_music.predict(X_array)[0]
        
        # 限制在0-100范围
        predicted_popularity = max(0, min(100, predicted_popularity))
        
        return jsonify({
            'success': True,
            'predicted_popularity': round(float(predicted_popularity), 2),
            'model': 'RandomForest_Music',
            'features_used': features_order
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'预测失败: {str(e)}'
        }), 500


@app.route('/api/predict/artist', methods=['POST'])
def predict_artist_popularity():
    """
    使用艺术家/专辑特征预测流行度 (RandomForest模型)
    
    请求体:
    {
        "release_year": 2025,
        "release_month": 6,
        "artist_popularity": 75,
        "artist_followers": 1000000,
        "album_total_tracks": 12,
        "track_number": 5
    }
    """
    try:
        if rf_model_artist is None:
            return jsonify({
                'success': False,
                'error': '艺术家特征预测模型未加载'
            }), 503
        
        data = request.json
        
        # 提取特征
        release_year = data.get('release_year', datetime.now().year)
        release_month = data.get('release_month', 1)
        
        # 计算正弦/余弦月份特征
        release_month_sin = np.sin(2 * np.pi * release_month / 12)
        release_month_cos = np.cos(2 * np.pi * release_month / 12)
        
        artist_popularity = data.get('artist_popularity', 0)
        artist_followers = data.get('artist_followers', 0)
        album_total_tracks = data.get('album_total_tracks', 1)
        track_number = data.get('track_number', 1)
        
        # 7个特征（按训练时的顺序）
        X = np.array([[
            release_year,
            release_month_sin,
            release_month_cos,
            artist_popularity,
            artist_followers,
            album_total_tracks,
            track_number
        ]])
        
        # 预测
        predicted_popularity = rf_model_artist.predict(X)[0]
        
        # 限制在0-100范围
        predicted_popularity = max(0, min(100, predicted_popularity))
        
        return jsonify({
            'success': True,
            'predicted_popularity': round(float(predicted_popularity), 2),
            'model': 'RandomForest_Artist',
            'features_used': [
                'release_year', 'release_month_sin', 'release_month_cos',
                'artist_popularity', 'artist_followers', 'album_total_tracks', 'track_number'
            ],
            'input_month': release_month
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'预测失败: {str(e)}'
        }), 500


@app.route('/api/predict/dual', methods=['POST'])
def predict_dual_models():
    """
    同时使用两个模型预测流行度并对比
    
    请求体: 包含所有特征的完整数据
    """
    try:
        data = request.json
        
        # 调用音乐特征预测
        music_result = None
        if rf_model_music is not None:
            music_features = {
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
                'duration_ms': data.get('duration_ms', 0),
                'time_signature': data.get('time_signature', 4)
            }
            
            features_order = list(music_features.keys())
            X_music = np.array([[music_features[f] for f in features_order]])
            music_pred = rf_model_music.predict(X_music)[0]
            music_result = {
                'predicted_popularity': round(float(max(0, min(100, music_pred))), 2),
                'model': 'RandomForest_Music'
            }
        
        # 调用艺术家特征预测
        artist_result = None
        if rf_model_artist is not None:
            release_month = data.get('release_month', datetime.now().month)
            release_month_sin = np.sin(2 * np.pi * release_month / 12)
            release_month_cos = np.cos(2 * np.pi * release_month / 12)
            
            X_artist = np.array([[
                data.get('release_year', datetime.now().year),
                release_month_sin,
                release_month_cos,
                data.get('artist_popularity', 0),
                data.get('artist_followers', 0),
                data.get('album_total_tracks', 1),
                data.get('track_number', 1)
            ]])
            
            artist_pred = rf_model_artist.predict(X_artist)[0]
            artist_result = {
                'predicted_popularity': round(float(max(0, min(100, artist_pred))), 2),
                'model': 'RandomForest_Artist'
            }
        
        # 计算差异和综合预测
        difference = None
        weighted_avg = None
        
        if music_result and artist_result:
            difference = abs(music_result['predicted_popularity'] - artist_result['predicted_popularity'])
            # 加权平均（音乐特征权重更高，因为更相关）
            weighted_avg = round(music_result['predicted_popularity'] * 0.7 + artist_result['predicted_popularity'] * 0.3, 2)
        
        return jsonify({
            'success': True,
            'music_model': music_result,
            'artist_model': artist_result,
            'difference': round(difference, 2) if difference else None,
            'weighted_average': weighted_avg,
            'recommendation': generate_recommendation(music_result, artist_result, difference)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'双模型预测失败: {str(e)}'
        }), 500


def generate_recommendation(music_result, artist_result, difference):
    """根据双模型预测结果生成建议"""
    if not music_result or not artist_result:
        return "数据不足，无法生成建议"
    
    music_pop = music_result['predicted_popularity']
    artist_pop = artist_result['predicted_popularity']
    
    if difference < 5:
        return f"✅ 两个模型预测一致（差异 {difference:.1f}），预测较为可靠"
    elif difference < 15:
        return f"⚠️ 两个模型预测存在一定差异（差异 {difference:.1f}），建议综合参考"
    else:
        if music_pop > artist_pop:
            return f"📊 音乐特征模型预测更高（+{difference:.1f}），歌曲本身质量可能优于艺术家影响力"
        else:
            return f"👤 艺术家模型预测更高（+{difference:.1f}），艺术家影响力可能大于歌曲本身质量"


@app.route('/api/generate', methods=['POST'])
def generate_music():
    """
    生成音乐特征组合
    
    请求体:
    {
        "style_id": 6,           # 目标风格ID (0-7)
        "runtime": 5,            # GA运行时间 (2-10秒)
        "locked_features": {}    # 锁定的特征 {feature_name: value}
    }
    """
    try:
        data = request.json
        style_id = data.get('style_id', 0)
        runtime = max(2, min(10, data.get('runtime', 5)))  # 限制在2-10秒
        locked_features = data.get('locked_features', {})
        
        # 验证风格ID
        if style_id not in CLUSTER_NAMES:
            return jsonify({'error': '无效的风格ID'}), 400
        
        # 验证锁定特征的合法性
        valid_features = ['danceability', 'energy', 'key', 'loudness', 'mode', 
                         'speechiness', 'acousticness', 'instrumentalness', 
                         'liveness', 'valence', 'tempo', 'time_signature',
                         'duration_min', 'artist_popularity', 'artist_followers',
                         'track_name_length', 'album_total_tracks', 'track_number']
        
        validated_locked = {}
        for feature, value in locked_features.items():
            if feature in valid_features:
                try:
                    validated_locked[feature] = float(value)
                except (ValueError, TypeError):
                    return jsonify({'error': f'特征 {feature} 的值无效'}), 400
        
        # 调试信息
        print(f"\n🔍 收到的锁定特征: {locked_features}")
        print(f"✅ 验证后的锁定特征: {validated_locked}")
        
        # 运行遗传算法
        ga = MusicGeneticAlgorithm(
            target_cluster=style_id, 
            max_time=runtime,
            locked_features=validated_locked
        )
        result = ga.evolve()
        
        # 调试: 检查结果
        print(f"📊 GA结果中的特征:")
        for feature, value in result['features'].items():
            if feature in validated_locked:
                expected = validated_locked[feature]
                if value != expected:
                    print(f"  ⚠️  {feature}: 期望={expected}, 实际={value}")
                else:
                    print(f"  ✅ {feature}: {value}")
        
        # 生成AI提示词
        ai_prompt = generate_ai_prompt(result['features'], result['cluster_name'])
        result['ai_prompt'] = ai_prompt
        result['locked_features'] = validated_locked  # 返回锁定的特征信息
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict_popularity():
    """
    预测给定特征的流行度
    
    请求体:
    {
        "features": {
            "danceability": 0.8,
            "energy": 0.7,
            ...
        }
    }
    """
    try:
        data = request.json
        features = data.get('features', {})
        
        # 创建临时GA实例用于特征处理
        ga = MusicGeneticAlgorithm(target_cluster=0)
        
        # 预测流行度和风格
        popularity = ga.calculate_fitness(features)
        cluster = ga.predict_cluster(features)
        
        return jsonify({
            'success': True,
            'predicted_popularity': float(popularity),
            'cluster': int(cluster),
            'cluster_name': CLUSTER_NAMES[cluster]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/feature-info', methods=['GET'])
def get_feature_info():
    """获取特征定义知识库"""
    return jsonify(FEATURE_DESCRIPTIONS)


@app.route('/api/generate-ai-prompt', methods=['POST'])
def generate_ai_prompt_endpoint():
    """
    使用DeepSeek API生成音乐提示词
    
    请求体:
    {
        "api_key": "your-deepseek-api-key",
        "music_features": {
            "style": "...",
            "danceability": 0.7,
            ...
        }
    }
    """
    try:
        data = request.json
        api_key = data.get('api_key', '').strip()
        music_features = data.get('music_features', {})
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': '请提供DeepSeek API密钥'
            }), 400
        
        if not music_features:
            return jsonify({
                'success': False,
                'error': '缺少音乐特征数据'
            }), 400
        
        # 调用DeepSeek API
        result = call_deepseek_api(api_key, music_features)
        
        if result['success']:
            return jsonify({
                'success': True,
                'ai_prompt': result['prompt']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'服务器错误: {str(e)}'
        }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("🎵 音乐生成系统启动中...")
    print("=" * 60)
    
    if load_models():
        print(f"\n🌐 服务运行在: http://localhost:5000")
        print("=" * 60)
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("\n❌ 模型加载失败,请检查模型文件是否存在")
