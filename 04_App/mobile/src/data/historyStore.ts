import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import type { AnalysisResult } from '@/data/sampleAnalysis';

const KEY = '@contract-helper/history';
const ROOT = 'history'; // documentDirectory 하위 폴더

export type HistoryRecord = {
  id: string;            // createdAt 문자열
  createdAt: number;     // epoch ms
  result: AnalysisResult;
  imageFiles: string[];  // 기록 폴더 내 파일명 (예: ['page-1.jpg'])
  isSample?: boolean;
};

async function readAll(): Promise<HistoryRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: HistoryRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(records));
}

// 기록의 페이지 이미지를 현재 기기 기준 절대 uri 로 복원
export function pageUris(record: HistoryRecord): string[] {
  return record.imageFiles.map((name) => new File(Paths.document, ROOT, record.id, name).uri);
}

export async function save(
  result: AnalysisResult,
  imageUris: string[],
  opts: { isSample?: boolean } = {},
): Promise<HistoryRecord> {
  const createdAt = Date.now();
  const id = String(createdAt);
  const imageFiles: string[] = [];
  if (imageUris.length > 0) {
    const dir = new Directory(Paths.document, ROOT, id);
    dir.create({ intermediates: true });
    try {
      imageUris.forEach((uri, i) => {
        const name = `page-${i + 1}.jpg`;
        new File(uri).copySync(new File(dir, name));
        imageFiles.push(name);
      });
    } catch (err) {
      try { dir.delete(); } catch { /* best-effort cleanup */ }
      throw err;
    }
  }
  const record: HistoryRecord = { id, createdAt, result, imageFiles, isSample: opts.isSample };
  const all = await readAll();
  await writeAll([record, ...all]);
  return record;
}

export async function list(): Promise<HistoryRecord[]> {
  const all = await readAll();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function get(id: string): Promise<HistoryRecord | null> {
  const all = await readAll();
  return all.find((r) => r.id === id) ?? null;
}

export async function remove(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((r) => r.id !== id));
  try { new Directory(Paths.document, ROOT, id).delete(); } catch { /* 없으면 무시 */ }
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  try { new Directory(Paths.document, ROOT).delete(); } catch { /* 무시 */ }
}
