"use client";

import { useMemo } from "react";

interface ActivityHeatmapProps {
  data: Record<string, number>;
}

const CELL = 11;
const GAP = 3;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LABEL = ["Mon", "Wed", "Fri"];
const DAYS_LABEL_INDEX = [1, 3, 5];

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getIntensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio < 0.15) return 1;
  if (ratio < 0.4)  return 2;
  if (ratio < 0.7)  return 3;
  return 4;
}

const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
  const { grid, monthLabels, totalActiveDays, longestStreak, COLS } = useMemo(() => {
    const year = new Date().getFullYear();
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);

    // Pad start to nearest Sunday before Jan 1
    const start = new Date(jan1);
    start.setDate(start.getDate() - start.getDay());

    // Pad end to nearest Saturday after Dec 31
    const end = new Date(dec31);
    end.setDate(end.getDate() + (6 - end.getDay()));

    // Total columns (weeks)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const COLS = Math.ceil(totalDays / 7);

    const max = Math.max(1, ...Object.values(data).map(Number));

    type Cell = { date: string; count: number; intensity: 0 | 1 | 2 | 3 | 4; inYear: boolean } | null;
    const grid: Cell[][] = Array.from({ length: COLS }, () => Array(7).fill(null));

    const cursor = new Date(start);
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < 7; row++) {
        const key = toKey(cursor);
        const inYear = cursor >= jan1 && cursor <= dec31;
        const count = inYear ? (Number(data[key]) || 0) : 0;
        grid[col][row] = {
          date: key,
          count,
          intensity: inYear ? getIntensity(count, max) : 0,
          inYear,
        };
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Month labels — first col where each month starts within the year
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < 7; row++) {
        const cell = grid[col][row];
        if (!cell || !cell.inYear) continue;
        const month = new Date(cell.date).getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ col, label: MONTHS[month] });
          lastMonth = month;
        }
        break;
      }
    }

    // Stats (only within this year)
    const yearData = Object.entries(data).filter(([key]) => key.startsWith(`${year}-`));
    const totalActiveDays = yearData.filter(([, v]) => Number(v) > 0).length;

    // Longest streak
    let longest = 0, current = 0;
    const sorted = Object.keys(data).sort();
    for (const key of sorted) {
      if (Number(data[key]) > 0) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return { grid, monthLabels, totalActiveDays, longestStreak: longest, COLS };
  }, [data]);

  const totalWidth = COLS * (CELL + GAP);

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        borderColor: `rgb(var(--theme-glow) / 0.15)`,
        backgroundColor: `rgb(var(--theme-glow) / 0.03)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--theme-badge-text)" }}
        >
          Activity {new Date().getFullYear()}
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-bold text-foreground">{totalActiveDays}</span> active days
          </span>
          <span>
            <span className="font-bold text-foreground">{longestStreak}</span> day streak
          </span>
        </div>
      </div>

      {/* Heatmap scroll wrapper */}
      <div
        className="overflow-x-auto"
        style={{
          paddingBottom: 6,
          scrollbarWidth: "thin",
          scrollbarColor: `rgb(var(--theme-glow) / 0.35) rgb(var(--theme-glow) / 0.08)`,
        } as React.CSSProperties}
      >
        <div style={{ minWidth: totalWidth + 32 }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-8" style={{ gap: GAP }}>
            {Array.from({ length: COLS }).map((_, col) => {
              const label = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  className="text-[9px] text-muted-foreground/60 shrink-0"
                  style={{ width: CELL }}
                >
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid rows + day labels */}
          <div className="flex gap-1">
            {/* Day-of-week labels */}
            <div
              className="flex flex-col shrink-0 justify-around"
              style={{ width: 24, gap: GAP }}
            >
              {Array.from({ length: 7 }).map((_, row) => (
                <div
                  key={row}
                  className="text-[9px] text-muted-foreground/50 text-right"
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                >
                  {DAYS_LABEL_INDEX.includes(row) ? DAYS_LABEL[DAYS_LABEL_INDEX.indexOf(row)] : ""}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap: GAP }}>
              {Array.from({ length: COLS }).map((_, col) => (
                <div key={col} className="flex flex-col" style={{ gap: GAP }}>
                  {Array.from({ length: 7 }).map((_, row) => {
                    const cell = grid[col]?.[row];
                    if (!cell) return <div key={row} style={{ width: CELL, height: CELL }} />;

                    return (
                      <div
                        key={row}
                        title={cell.inYear ? `${cell.date}: ${cell.count} activities` : ""}
                        className="rounded-[2px] cursor-default transition-transform hover:scale-125"
                        style={{
                          width: CELL,
                          height: CELL,
                          opacity: cell.inYear ? 1 : 0,
                          backgroundColor: cell.intensity === 0
                            ? `rgb(var(--theme-glow) / 0.08)`
                            : cell.intensity === 1
                            ? `rgb(var(--theme-glow) / 0.25)`
                            : cell.intensity === 2
                            ? `rgb(var(--theme-glow) / 0.45)`
                            : cell.intensity === 3
                            ? `rgb(var(--theme-glow) / 0.70)`
                            : `var(--theme-primary)`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-muted-foreground/50 mr-1">Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <div
            key={level}
            className="rounded-[2px]"
            style={{
              width: 10,
              height: 10,
              backgroundColor: level === 0
                ? `rgb(var(--theme-glow) / 0.08)`
                : level === 1
                ? `rgb(var(--theme-glow) / 0.25)`
                : level === 2
                ? `rgb(var(--theme-glow) / 0.45)`
                : level === 3
                ? `rgb(var(--theme-glow) / 0.70)`
                : `var(--theme-primary)`,
            }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground/50 ml-1">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;