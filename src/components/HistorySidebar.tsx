/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { History as HistoryIcon, Clock } from 'lucide-react';
import { SchedulingResult } from '../types';
import { format } from 'date-fns';
import { UI_STRINGS } from '../constants';

interface HistorySidebarProps {
  history: SchedulingResult[];
  onSelect: (result: SchedulingResult) => void;
}

export const HistorySidebar = ({ history, onSelect }: HistorySidebarProps) => {
  return (
    <div className="glass-panel rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/30">
        <HistoryIcon size={18} className="text-indigo-400" />
        <h2 className="text-base font-semibold text-white">{UI_STRINGS.HISTORY}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-12 text-zinc-700">
            <Clock size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs italic font-mono">{UI_STRINGS.NO_HISTORY}</p>
          </div>
        ) : (
          history.map((item, index) => (
            <button
              key={item.timestamp}
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 rounded-xl border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {item.algorithm}
                </span>
                <span className="text-[9px] text-zinc-600 font-mono">
                  {format(item.timestamp, 'HH:mm:ss')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter mb-1">{UI_STRINGS.AVG_TAT_SHORT}</p>
                  <p className="text-xs font-bold text-zinc-300 font-mono">{item.averageTurnaroundTime.toFixed(1)}</p>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900">
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter mb-1">{UI_STRINGS.AVG_WT_SHORT}</p>
                  <p className="text-xs font-bold text-zinc-300 font-mono">{item.averageWaitingTime.toFixed(1)}</p>
                </div>
              </div>
            </button>
          )).reverse()
        )}
      </div>
    </div>
  );
};
