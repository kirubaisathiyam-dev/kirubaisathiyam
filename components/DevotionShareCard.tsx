"use client";

import Image from "next/image";
import logoDark from "@/app/logo-dark.svg";

type DevotionShareCardProps = {
  reference: string;
  verseText: string;
  verseClassName: string;
};

export default function DevotionShareCard({
  reference,
  verseText,
  verseClassName,
}: DevotionShareCardProps) {
  return (
    <div
      data-share-only="true"
      className="absolute inset-0 z-10 hidden items-center justify-center px-5 sm:px-8 lg:px-10"
    >
      <div className="relative mx-auto flex h-full w-full max-w-[420px] items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <h2
            className="text-2xl leading-tight text-white"
            style={{ textWrap: "balance" }}
          >
            {reference}
          </h2>
          {verseText ? (
            <div className="space-y-3">
              <blockquote className={verseClassName} style={{ color: "#ffffff" }}>
                {verseText}
              </blockquote>
            </div>
          ) : null}
        </div>
        <div
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center justify-center gap-3 text-sm font-semibold tracking-tight"
          style={{ color: "#ededed" }}
        >
          <Image
            src={logoDark}
            alt="Kirubai Sathiyam logo"
            width={20}
            height={20}
          />
          <div>
            கிருபை <span style={{ color: "#e9c36a" }}>சத்தியம்</span>
          </div>
        </div>
      </div>
    </div>
  );
}
