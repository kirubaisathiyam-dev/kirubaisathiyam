type DevotionAudioScrollInput = {
  contentTop: number;
  contentHeight: number;
  viewportHeight: number;
  currentTime: number;
  duration: number;
  topOffset?: number;
};

export function getDevotionAudioScrollTop({
  contentTop,
  contentHeight,
  viewportHeight,
  currentTime,
  duration,
  topOffset = 24,
}: DevotionAudioScrollInput) {
  if (
    !Number.isFinite(contentTop) ||
    !Number.isFinite(contentHeight) ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(currentTime) ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return null;
  }

  const startTop = Math.max(contentTop - topOffset, 0);
  const readableViewportHeight = Math.max(viewportHeight * 0.72, 1);
  const maxScrollableDistance = Math.max(contentHeight - readableViewportHeight, 0);
  const pageCount =
    maxScrollableDistance > 0
      ? Math.ceil(maxScrollableDistance / readableViewportHeight) + 1
      : 1;
  const progress = Math.min(Math.max(currentTime / duration, 0), 1);
  const pageIndex = Math.min(
    Math.floor(progress * pageCount),
    Math.max(pageCount - 1, 0),
  );

  return startTop + pageIndex * readableViewportHeight;
}
