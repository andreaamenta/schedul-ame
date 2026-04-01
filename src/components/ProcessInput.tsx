/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Trash2, Edit3 } from 'lucide-react';
import { Process } from '../types';
import { UI_STRINGS } from '../constants';

interface ProcessInputProps {
  processes: Process[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Process, value: any) => void;
  showPriority: boolean;
}

export const ProcessInput = ({ processes, onAdd, onRemove, onChange, showPriority }: ProcessInputProps) => {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <Edit3 size={18} className="text-zinc-500" />
          <h2 className="text-base font-semibold text-white">{UI_STRINGS.PROCESSES}</h2>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all text-xs font-bold uppercase tracking-wider"
        >
          <Plus size={16} />
          {UI_STRINGS.ADD_PROCESS}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
              <th className="px-6 py-4">{UI_STRINGS.NAME}</th>
              <th className="px-6 py-4">{UI_STRINGS.ARRIVAL}</th>
              <th className="px-6 py-4">{UI_STRINGS.BURST}</th>
              {showPriority && <th className="px-6 py-4">{UI_STRINGS.PRIORITY}</th>}
              <th className="px-6 py-4 w-20 text-center">{UI_STRINGS.COLOR}</th>
              <th className="px-6 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {processes.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => onChange(p.id, 'name', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-white font-mono"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="0"
                    value={p.arrivalTime}
                    onChange={(e) => onChange(p.id, 'arrivalTime', parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent border-none focus:ring-0 text-sm text-zinc-400 font-mono"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="1"
                    value={p.burstTime}
                    onChange={(e) => onChange(p.id, 'burstTime', parseInt(e.target.value) || 1)}
                    className="w-20 bg-transparent border-none focus:ring-0 text-sm text-zinc-400 font-mono"
                  />
                </td>
                {showPriority && (
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      value={p.priority || 0}
                      onChange={(e) => onChange(p.id, 'priority', parseInt(e.target.value) || 0)}
                      className="w-20 bg-transparent border-none focus:ring-0 text-sm text-zinc-400 font-mono"
                    />
                  </td>
                )}
                <td className="px-6 py-4 text-center">
                  <div className="relative inline-block">
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => onChange(p.id, 'color', e.target.value)}
                      className="w-6 h-6 rounded-full border border-zinc-800 cursor-pointer p-0 overflow-hidden appearance-none bg-transparent"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
