/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AlgorithmType = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'Priority' | 'PriorityPreemptive';

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
  color: string;
}

export interface GanttItem {
  processId: string;
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
}

export interface ProcessResult {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  finishTime: number;
  turnaroundTime: number;
  waitingTime: number;
  priority?: number;
}

export interface SimulationStep {
  time: number;
  runningProcessId: string | null;
  readyQueue: string[];
  completed: string[];
}

export interface SchedulingResult {
  ganttChart: GanttItem[];
  processResults: ProcessResult[];
  averageTurnaroundTime: number;
  averageWaitingTime: number;
  algorithm: AlgorithmType;
  timestamp: number;
  steps: SimulationStep[];
}

export interface SessionState {
  processes: Process[];
  algorithm: AlgorithmType;
  quantum: number;
  history: SchedulingResult[];
}
