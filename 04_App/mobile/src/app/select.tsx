import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { session } from '@/data/session';

export default function SelectScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '계약서 이미지를 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const startAnalysis = () => {
    if (!imageUri) return;
    session.setImage(imageUri);
    router.push('/loading');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.guide}>계약서 사진을 선택한 뒤 아래 ‘분석하기’를 누르세요.</Text>

      <Pressable style={styles.pickBox} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🖼️</Text>
            <Text style={styles.placeholderText}>갤러리에서 이미지 선택</Text>
          </View>
        )}
      </Pressable>

      <Pressable
        style={[styles.analyzeButton, !imageUri && styles.analyzeButtonDisabled]}
        disabled={!imageUri}
        onPress={startAnalysis}>
        <Text style={styles.analyzeText}>분석하기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#F9FAFB',
  },
  guide: {
    fontSize: 14,
    color: '#475467',
    lineHeight: 20,
  },
  pickBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: '#667085',
    fontWeight: '500',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  analyzeButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#C3DBF6',
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
