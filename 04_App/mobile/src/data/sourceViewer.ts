import type { CautionItem, SourceBox } from '@/data/sampleAnalysis';

export type PageSourceItem = {
  item: CautionItem;
  boxes: SourceBox[];
  number: number;
  pageIndex: number;
};

function hasUsableSource(item: CautionItem): boolean {
  return !!item.source && item.source.confidence !== 'low' && item.source.boxes.length > 0;
}

export function collectPageSourceItems(items: CautionItem[], pageIndex: number): PageSourceItem[] {
  return collectSourceItems(items).filter((entry) => entry.pageIndex === pageIndex);
}

export function collectSourceItems(items: CautionItem[]): PageSourceItem[] {
  return items
    .filter(hasUsableSource)
    .map((item, index) => {
      const pageIndex = item.source!.pageIndex;
      return {
        item,
        boxes: item.source!.boxes.filter((box) => box.pageIndex === pageIndex),
        number: index + 1,
        pageIndex,
      };
    })
    .filter((entry) => entry.boxes.length > 0);
}

export function findDefaultSourceItem(items: CautionItem[], pageIndex: number): CautionItem | null {
  return collectPageSourceItems(items, pageIndex)[0]?.item ?? null;
}
