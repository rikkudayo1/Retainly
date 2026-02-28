"use client";

import { useMemo } from "react";

interface ActivityHeatmapProps {
  /** Record of "YYYY-MM-DD" -> activity count */
  data: Record<string, number>;
}

const DAYS_IN_YEAR = 365;
const COLS = 53; // weeks
const CELL = 11; // px per cell
const GAP = 3;   // px gap

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_LABEL = ["Mon", "Wed", "Fri"];
const DAYS_LABEL_INDEX = [1, 3, 5]; // which row indices get a label

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
  const { grid, monthLabels, totalDays, totalActiveDays, longestStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 364 days ago, aligned to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - DAYS_IN_YEAR + 1);
    // Rewind to nearest Sunday
    start.setDate(start.getDate() - start.getDay());

    const max = Math.max(1, ...Object.values(data));

    // Build a 7-row × 53-col grid
    type Cell = { date: string; count: number; intensity: 0 | 1 | 2 | 3 | 4 } | null;
    const grid: Cell[][] = Array.from({ length: COLS }, () => Array(7).fill(null));

    const cursor = new Date(start);
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < 7; row++) {
        const key = toKey(cursor);
        const count = data[key] ?? 0;
        grid[col][row] = {
          date: key,
          count,
          intensity: getIntensity(count, max),
        };
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    // Month label positions — find the first col where the month changes
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < COLS; col++) {
      const cell = grid[col][0];
      if (!cell) continue;
      const month = new Date(cell.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ col, label: MONTHS[month] });
        lastMonth = month;
      }
    }

    // Stats
    const allDays = Object.entries(data).filter(([key]) => {
      const d = new Date(key);
      return d >= start && d <= today;
    });
    const totalActiveDays = allDays.filter(([, v]) => v > 0).length;

    // Longest streak
    let longest = 0, current = 0;
    const sorted = Object.keys(data).sort();
    for (let i = 0; i < sorted.length; i++) {
      if (data[sorted[i]] > 0) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    return { grid, monthLabels, totalDays: DAYS_IN_YEAR, totalActiveDays, longestStreak: longest };
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
          Activity
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
      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: totalWidth + 32 }}>
          {/* Month labels */}
          <div
            className="flex mb-1 pl-8"
            style={{ gap: GAP }}
          >
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
                    if (!cell) {
                      return (
                        <div
                          key={row}
                          style={{ width: CELL, height: CELL }}
                        />
                      );
                    }
                    return (
                      <div
                        key={row}
                        title={`${cell.date}: ${cell.count} activities`}
                        className="rounded-[2px] cursor-default transition-transform hover:scale-125"
                        style={{
                          width: CELL,
                          height: CELL,
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