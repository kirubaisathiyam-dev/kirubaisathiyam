"use client";

import ShareButton from "@/components/ShareButton";
import {
  captureShareImage,
  default as VerseOfTheDayShareButton,
} from "@/components/VerseOfTheDayShareButton";

type DevotionShareActionsProps = {
  title: string;
  text: string;
  url: string;
  targetId: string;
  exportWidth?: number;
  exportHeight?: number;
  fileName?: string;
  buttonStyle?: React.CSSProperties;
};

export default function DevotionShareActions({
  title,
  text,
  url,
  targetId,
  exportWidth,
  exportHeight,
  fileName = "daily-devotion.png",
  buttonStyle,
}: DevotionShareActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <VerseOfTheDayShareButton
        title={title}
        text={text}
        url={url}
        targetId={targetId}
        exportWidth={exportWidth}
        exportHeight={exportHeight}
        fileName={fileName}
        action="download"
        buttonStyle={buttonStyle}
      />
      <ShareButton
        title={title}
        text={text}
        url={url}
        onShare={() =>
          captureShareImage({
            title,
            text,
            url,
            targetId,
            exportWidth,
            exportHeight,
            fileName,
            action: "share",
          })
        }
        buttonStyle={buttonStyle}
      />
    </div>
  );
}
