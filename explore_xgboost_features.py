"""
探索XGBoost预处理器中的特征
提取所有genre特征名称
"""

import joblib
import pandas as pd

print("=" * 80)
print("🔍 XGBoost预处理器特征探索")
print("=" * 80)

try:
    # 加载预处理器
    preprocessor = joblib.load('spotify_preprocessor.pkl')
    print("✅ 预处理器加载成功")
    
    # 获取特征名称
    if hasattr(preprocessor, 'get_feature_names_out'):
        feature_names = preprocessor.get_feature_names_out()
        print(f"\n📊 总特征数: {len(feature_names)}")
        
        # 提取genre相关的特征
        genre_features = [f for f in feature_names if 'genre' in f.lower() or 'track_genre' in f.lower()]
        
        if genre_features:
            print(f"\n🎵 Genre特征数量: {len(genre_features)}")
            print("\n" + "=" * 80)
            print("所有Genre特征列表:")
            print("=" * 80)
            
            for i, genre_feat in enumerate(sorted(genre_features), 1):
                # 提取genre名称（去掉前缀）
                genre_name = genre_feat.replace('track_genre_', '').replace('genre_', '')
                print(f"{i:3d}. {genre_feat:50s} -> {genre_name}")
            
            # 保存到文件
            with open('genre_features_list.txt', 'w', encoding='utf-8') as f:
                f.write("XGBoost模型中的所有音乐流派特征\n")
                f.write("=" * 80 + "\n\n")
                for i, genre_feat in enumerate(sorted(genre_features), 1):
                    genre_name = genre_feat.replace('track_genre_', '').replace('genre_', '')
                    f.write(f"{i:3d}. {genre_feat:50s} -> {genre_name}\n")
            
            print(f"\n✅ 特征列表已保存到: genre_features_list.txt")
        else:
            print("\n⚠️  未找到genre相关的特征")
        
        # 显示所有特征的前20个
        print("\n" + "=" * 80)
        print("所有特征前20个预览:")
        print("=" * 80)
        for i, feat in enumerate(feature_names[:20], 1):
            print(f"{i:3d}. {feat}")
        
        print(f"\n... (共{len(feature_names)}个特征)")
        
    else:
        print("\n⚠️  预处理器不支持get_feature_names_out方法")
        print("尝试其他方法...")
        
        # 尝试获取transformers信息
        if hasattr(preprocessor, 'transformers_'):
            print("\n预处理器包含的transformers:")
            for name, transformer, columns in preprocessor.transformers_:
                print(f"\n  {name}:")
                print(f"    类型: {type(transformer).__name__}")
                print(f"    列: {columns}")
    
    print("\n" + "=" * 80)
    print("🧪 测试：创建包含所有特征的DataFrame")
    print("=" * 80)
    
    # 创建测试数据
    test_data = {
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
        'explicit': 0,
        'track_genre': 'pop'  # 测试用
    }
    
    df = pd.DataFrame([test_data])
    print(f"\n输入DataFrame shape: {df.shape}")
    print(f"输入列: {list(df.columns)}")
    
    # 转换
    transformed = preprocessor.transform(df)
    print(f"\n转换后shape: {transformed.shape}")
    print(f"转换后特征数: {transformed.shape[1]}")
    
    if hasattr(preprocessor, 'get_feature_names_out'):
        output_features = preprocessor.get_feature_names_out()
        print(f"\n输出特征名称数量: {len(output_features)}")
        
        # 找到非零的特征
        if hasattr(transformed, 'toarray'):
            transformed_array = transformed.toarray()[0]
        else:
            transformed_array = transformed[0]
        
        non_zero_indices = [i for i, v in enumerate(transformed_array) if v != 0]
        print(f"\n非零特征数量: {len(non_zero_indices)}")
        print("\n非零特征（前20个）:")
        for idx in non_zero_indices[:20]:
            print(f"  {output_features[idx]:50s} = {transformed_array[idx]:.4f}")

except FileNotFoundError:
    print("❌ 未找到 spotify_preprocessor.pkl")
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()
