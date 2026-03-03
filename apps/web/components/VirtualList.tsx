"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualList<T>({
  items,
  estimateSize = 52,
  height = 460,
  render,
}: {
  items: T[];
  estimateSize?: number;
  height?: number;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  });

  return (
    <div ref={parentRef} style={{ height, overflow: "auto" }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((row) => (
          (() => {
            const item = items[row.index];
            if (item === undefined) {
              return null;
            }
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${row.start}px)`,
                }}
              >
                {render(item, row.index)}
              </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}
