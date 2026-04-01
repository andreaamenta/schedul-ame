/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcessResult } from '../types';
import { UI_STRINGS } from '../constants';

interface ResultsTableProps {
  results: ProcessResult[];
  avgTurnaround: number;
  avgWaiting: number;
}

export const ResultsTable = ({ results, avgTurnaround, avgWaiting }: ResultsTableProps) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{UI_STRINGS.AVG_TURNAROUND}</p>
          <p className="text-4xl font-bold text-white font-mono tracking-tighter">{avgTurnaround.toFixed(2)}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{UI_STRINGS.AVG_WAITING}</p>
          <p className="text-4xl font-bold text-white font-mono tracking-tighter">{avgWaiting.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/30">
          <h2 className="text-base font-semibold text-white">{UI_STRINGS.DETAILED_RESULTS}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-6 py-4">{UI_STRINGS.PROCESS}</th>
                <th className="px-6 py-4">{UI_STRINGS.ARRIVAL}</th>
                <th className="px-6 py-4">{UI_STRINGS.BURST}</th>
                <th className="px-6 py-4">{UI_STRINGS.FINISH}</th>
                <th className="px-6 py-4">{UI_STRINGS.TURNAROUND}</th>
                <th className="px-6 py-4 text-right">{UI_STRINGS.WAITING}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors font-mono text-sm">
                  <td className="px-6 py-4 font-bold text-white">{r.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{r.arrivalTime}</td>
                  <td className="px-6 py-4 text-zinc-500">{r.burstTime}</td>
                  <td className="px-6 py-4 text-zinc-500">{r.finishTime}</td>
                  <td className="px-6 py-4 text-indigo-400 font-bold">{r.turnaroundTime}</td>
                  <td className="px-6 py-4 text-emerald-400 font-bold text-right">{r.waitingTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
