import type { SourceBox } from '@/data/sampleAnalysis';

export type Size = {
  width: number;
  height: number;
};

export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type RectPadding = {
  horizontal: number;
  vertical: number;
};

export function containRect(container: Size, image: Size): Rect {
  if (container.width <= 0 || container.height <= 0 || image.width <= 0 || image.height <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    left: (container.width - width) / 2,
    top: (container.height - height) / 2,
    width,
    height,
  };
}

export function sourceBoxToRect(box: SourceBox, renderedImage: Rect): Rect {
  return {
    left: renderedImage.left + box.x * renderedImage.width,
    top: renderedImage.top + box.y * renderedImage.height,
    width: box.width * renderedImage.width,
    height: box.height * renderedImage.height,
  };
}

export function expandRect(rect: Rect, bounds: Rect, padding: RectPadding): Rect {
  const left = Math.max(bounds.left, rect.left - padding.horizontal);
  const top = Math.max(bounds.top, rect.top - padding.vertical);
  const right = Math.min(bounds.left + bounds.width, rect.left + rect.width + padding.horizontal);
  const bottom = Math.min(bounds.top + bounds.height, rect.top + rect.height + padding.vertical);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}
