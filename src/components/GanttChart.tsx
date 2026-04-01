/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { GanttItem } from '../types';
import { UI_STRINGS } from '../constants';

interface GanttChartProps {
  items: GanttItem[];
}

export const GanttChart = ({ items }: GanttChartProps) => {
  if (items.length === 0) return null;

  const totalTime = items[items.length - 1].endTime;
  const scale = 100 / totalTime;

  return (
    <div className="glass-panel p-8 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
        <h2 className="text-base font-semibold text-white">{UI_STRINGS.GANTT_CHART}</h2>
      </div>
      
      <div className="relative h-16 w-full bg-zinc-950 rounded-xl overflow-hidden flex border border-zinc-900">
        {items.map((item, index) => (
          <motion.div
            key={`${item.processId}-${index}`}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            style={{
              width: `${(item.endTime - item.startTime) * scale}%`,
              backgroundColor: item.color,
              transformOrigin: 'left',
            }}
            className="h-full flex items-center justify-center text-white text-[10px] font-bold relative group border-r border-black/20 last:border-r-0"
          >
            <span className="truncate px-1 drop-shadow-md">{item.processName}</span>
            
            {/* Time markers */}
            <div className="absolute -bottom-6 left-0 text-[9px] text-zinc-600 font-mono">
              {item.startTime}
            </div>
            {index === items.length - 1 && (
              <div className="absolute -bottom-6 right-0 text-[9px] text-zinc-600 font-mono">
                {item.endTime}
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-zinc-900 text-white text-[10px] py-1.5 px-3 rounded-lg border border-zinc-800 shadow-2xl whitespace-nowrap">
                <span className="font-bold text-indigo-400">{item.processName}</span>
                <span className="mx-2 text-zinc-600">|</span>
                <span className="font-mono">{item.startTime} → {item.endTime}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 flex justify-between text-[9px] text-zinc-700 font-mono uppercase tracking-[0.2em] font-bold">
        <span>{UI_STRINGS.START} (0)</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-[1px] bg-zinc-900" />
          <span>{UI_STRINGS.TIMELINE}</span>
          <div className="w-8 h-[1px] bg-zinc-900" />
        </div>
        <span>{UI_STRINGS.END} ({totalTime})</span>
      </div>
    </div>
  );
};
