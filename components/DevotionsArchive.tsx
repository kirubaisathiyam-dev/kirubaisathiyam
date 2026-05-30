"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import { getDevotionSlug, type DailyDevotionRecord } from "@/lib/daily-devotion";

type DevotionsArchiveProps = {
  records: DailyDevotionRecord[];
};

function groupByMonth(records: DailyDevotionRecord[]) {
  const groups = new Map<string, DailyDevotionRecord[]>();

  for (const record of records) {
    if (!record.date) {
      continue;
    }

    const [, month = ""] = record.date.split(" ");
    const list = groups.get(month) || [];
    list.push(record);
    groups.set(month, list);
  }

  return Array.from(groups.entries());
}

export default function DevotionsArchive({ records }: DevotionsArchiveProps) {
  const groupedRecords = useMemo(() => groupByMonth(records), [records]);
  const [expandedMonth, setExpandedMonth] = useState(groupedRecords[0]?.[0] || "");

  return (
    <div className="space-y-3">
      {groupedRecords.map(([month, monthRecords]) => {
        const isOpen = expandedMonth === month;

        return (
          <section
            key={month}
            className="overflow-hidden border"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--muted-background)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setExpandedMonth((current) => (current === month ? "" : month))
              }
              className="flex w-full items-center justify-between gap-4 p-3 text-left transition hover:opacity-80"
              aria-expanded={isOpen}
            >
              <span className="font-medium">{month}</span>
              <span
                className={`inline-flex transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
                aria-hidden="true"
              >
                <ArrowRightIcon style={{ width: 18, height: 18 }} />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className="border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {monthRecords.map((record) => {
                    if (!record.date) {
                      return null;
                    }

                    return (
                      <div
                        key={record.date}
                        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <p className="text-sm font-semibold sm:text-base">
                          {record.date}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {record.am?.verse ? (
                            <Link
                              href={`/devotions/${getDevotionSlug(record.date, "am")}`}
                              className="rounded border px-3 py-2 text-sm font-semibold transition hover:opacity-80"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--background)",
                              }}
                            >
                              காலை
                            </Link>
                          ) : null}
                          {record.pm?.verse ? (
                            <Link
                              href={`/devotions/${getDevotionSlug(record.date, "pm")}`}
                              className="rounded border px-3 py-2 text-sm font-semibold transition hover:opacity-80"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--background)",
                              }}
                            >
                              மாலை
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
