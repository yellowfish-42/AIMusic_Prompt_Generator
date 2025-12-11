"""
双模型系统测试脚本
用于验证API端点和模型加载
"""

import requests
import json

BASE_URL = "http://localhost:5000"

print("=" * 80)
print("🧪 AI音乐生成系统 - 双模型测试")
print("=" * 80)

# 测试1: 获取音乐风格列表
print("\n[测试1] 获取音乐风格列表...")
try:
    response = requests.get(f"{BASE_URL}/api/styles")
    if response.status_code == 200:
        styles = response.json()
        print(f"✅ 成功! 共{len(styles)}种风格:")
        for style in styles[:3]:
            print(f"   - {style['name']}")
    else:
        print(f"❌ 失败: {response.status_code}")
except Exception as e:
    print(f"❌ 连接失败: {e}")
    print("   请确保服务器正在运行: python app.py")
    exit(1)

# 测试2: 音乐特征预测
print("\n[测试2] 音乐特征模型预测...")
music_data = {
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

try:
    response = requests.post(
        f"{BASE_URL}/api/predict/music",
        json=music_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ 成功! 预测流行度: {result['predicted_popularity']:.2f}")
            print(f"   模型: {result['model']}")
        else:
            print(f"❌ 失败: {result.get('error')}")
    else:
        print(f"❌ HTTP错误: {response.status_code}")
        print(f"   响应: {response.text}")
except Exception as e:
    print(f"❌ 请求失败: {e}")

# 测试3: 艺术家特征预测
print("\n[测试3] 艺术家特征模型预测...")
artist_data = {
    "release_year": 2025,
    "release_month": 6,
    "artist_popularity": 75,
    "artist_followers": 1000000,
    "album_total_tracks": 12,
    "track_number": 5
}

try:
    response = requests.post(
        f"{BASE_URL}/api/predict/artist",
        json=artist_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ 成功! 预测流行度: {result['predicted_popularity']:.2f}")
            print(f"   模型: {result['model']}")
        else:
            print(f"❌ 失败: {result.get('error')}")
    else:
        print(f"❌ HTTP错误: {response.status_code}")
        print(f"   响应: {response.text}")
except Exception as e:
    print(f"❌ 请求失败: {e}")

# 测试4: 双模型对比预测
print("\n[测试4] 双模型对比预测...")
dual_data = {**music_data, **artist_data}

try:
    response = requests.post(
        f"{BASE_URL}/api/predict/dual",
        json=dual_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ 成功!")
            if result.get('music_model'):
                print(f"   音乐模型: {result['music_model']['predicted_popularity']:.2f}")
            if result.get('artist_model'):
                print(f"   艺术家模型: {result['artist_model']['predicted_popularity']:.2f}")
            if result.get('difference') is not None:
                print(f"   差异: {result['difference']:.2f}")
            if result.get('weighted_average'):
                print(f"   加权平均: {result['weighted_average']:.2f}")
            if result.get('recommendation'):
                print(f"   建议: {result['recommendation']}")
        else:
            print(f"❌ 失败: {result.get('error')}")
    else:
        print(f"❌ HTTP错误: {response.status_code}")
except Exception as e:
    print(f"❌ 请求失败: {e}")

# 测试5: 完整生成流程
print("\n[测试5] 完整音乐生成流程...")
generate_data = {
    "cluster_id": 6,  # 快乐律动舞曲
    "runtime": 3,
    "locked_features": {}
}

try:
    response = requests.post(
        f"{BASE_URL}/api/optimize",
        json=generate_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ 成功!")
            print(f"   流行度: {result.get('popularity', 'N/A')}")
            print(f"   风格: {result.get('cluster_name', 'N/A')}")
            print(f"   迭代代数: {result.get('generations', 'N/A')}")
            print(f"   特征数: {len(result.get('features', {}))}")
        else:
            print(f"❌ 失败: {result.get('error')}")
    else:
        print(f"❌ HTTP错误: {response.status_code}")
except Exception as e:
    print(f"❌ 请求失败: {e}")

print("\n" + "=" * 80)
print("🎉 测试完成!")
print("=" * 80)
print("\n提示:")
print("- 如果某个测试失败，可能是相应的模型文件未加载")
print("- 查看服务器日志了解详细错误信息")
print("- 确保模型文件已放置在项目根目录")
print("\n访问 http://localhost:5000 查看完整界面")
print("=" * 80)
