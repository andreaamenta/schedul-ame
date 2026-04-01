/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlgorithmType, GanttItem, Process, ProcessResult, SchedulingResult, SimulationStep } from '../types';

export const solveScheduling = (
  processes: Process[],
  algorithm: AlgorithmType,
  quantum: number = 2
): SchedulingResult => {
  let ganttChart: GanttItem[] = [];
  let processResults: ProcessResult[] = [];
  let steps: SimulationStep[] = [];
  
  const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  
  switch (algorithm) {
    case 'FCFS':
      ({ ganttChart, processResults, steps } = solveFCFS(sortedProcesses));
      break;
    case 'SJF':
      ({ ganttChart, processResults, steps } = solveSJF(sortedProcesses));
      break;
    case 'SRTF':
      ({ ganttChart, processResults, steps } = solveSRTF(sortedProcesses));
      break;
    case 'RR':
      ({ ganttChart, processResults, steps } = solveRR(sortedProcesses, quantum));
      break;
    case 'Priority':
      ({ ganttChart, processResults, steps } = solvePriority(sortedProcesses));
      break;
    case 'PriorityPreemptive':
      ({ ganttChart, processResults, steps } = solvePriorityPreemptive(sortedProcesses));
      break;
  }

  const averageTurnaroundTime = processResults.reduce((acc, r) => acc + r.turnaroundTime, 0) / processes.length || 0;
  const averageWaitingTime = processResults.reduce((acc, r) => acc + r.waitingTime, 0) / processes.length || 0;

  return {
    ganttChart,
    processResults,
    averageTurnaroundTime,
    averageWaitingTime,
    algorithm,
    timestamp: Date.now(),
    steps,
  };
};

const solveFCFS = (processes: Process[]): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;

  processes.forEach((p) => {
    if (currentTime < p.arrivalTime) {
      // Idle time
      while (currentTime < p.arrivalTime) {
        steps.push({
          time: currentTime,
          runningProcessId: null,
          readyQueue: [],
          completed: processResults.map(r => r.id),
        });
        currentTime++;
      }
    }

    const startTime = currentTime;
    for (let t = 0; t < p.burstTime; t++) {
      steps.push({
        time: currentTime,
        runningProcessId: p.id,
        readyQueue: [],
        completed: processResults.map(r => r.id),
      });
      currentTime++;
    }
    const endTime = currentTime;

    ganttChart.push({
      processId: p.id,
      processName: p.name,
      startTime,
      endTime,
      color: p.color,
    });

    const turnaroundTime = endTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;

    processResults.push({
      ...p,
      finishTime: endTime,
      turnaroundTime,
      waitingTime,
    });
  });

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: processResults.map(r => r.id),
  });

  return { ganttChart, processResults, steps };
};

const solveSJF = (processes: Process[]): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;
  const remainingProcesses = [...processes];
  const completed: string[] = [];

  while (completed.length < processes.length) {
    const available = remainingProcesses.filter(
      (p) => p.arrivalTime <= currentTime && !completed.includes(p.id)
    );

    if (available.length === 0) {
      steps.push({
        time: currentTime,
        runningProcessId: null,
        readyQueue: [],
        completed: [...completed],
      });
      currentTime++;
      continue;
    }

    const next = available.sort((a, b) => a.burstTime - b.burstTime)[0];
    const startTime = currentTime;
    
    for (let t = 0; t < next.burstTime; t++) {
      steps.push({
        time: currentTime,
        runningProcessId: next.id,
        readyQueue: available.filter(p => p.id !== next.id).map(p => p.id),
        completed: [...completed],
      });
      currentTime++;
    }
    const endTime = currentTime;

    ganttChart.push({
      processId: next.id,
      processName: next.name,
      startTime,
      endTime,
      color: next.color,
    });

    const turnaroundTime = endTime - next.arrivalTime;
    const waitingTime = turnaroundTime - next.burstTime;

    processResults.push({
      ...next,
      finishTime: endTime,
      turnaroundTime,
      waitingTime,
    });

    completed.push(next.id);
  }

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: [...completed],
  });

  return { ganttChart, processResults, steps };
};

const solveSRTF = (processes: Process[]): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;
  const remainingTime = new Map(processes.map((p) => [p.id, p.burstTime]));
  const completed: string[] = [];
  let lastProcessId: string | null = null;

  while (completed.length < processes.length) {
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && !completed.includes(p.id)
    );

    if (available.length === 0) {
      steps.push({
        time: currentTime,
        runningProcessId: null,
        readyQueue: [],
        completed: [...completed],
      });
      currentTime++;
      continue;
    }

    const next = available.sort((a, b) => (remainingTime.get(a.id) || 0) - (remainingTime.get(b.id) || 0))[0];
    
    steps.push({
      time: currentTime,
      runningProcessId: next.id,
      readyQueue: available.filter(p => p.id !== next.id).map(p => p.id),
      completed: [...completed],
    });

    if (lastProcessId !== next.id) {
      ganttChart.push({
        processId: next.id,
        processName: next.name,
        startTime: currentTime,
        endTime: currentTime + 1,
        color: next.color,
      });
    } else {
      ganttChart[ganttChart.length - 1].endTime = currentTime + 1;
    }

    remainingTime.set(next.id, (remainingTime.get(next.id) || 0) - 1);
    currentTime++;
    lastProcessId = next.id;

    if (remainingTime.get(next.id) === 0) {
      completed.push(next.id);
      const turnaroundTime = currentTime - next.arrivalTime;
      const waitingTime = turnaroundTime - next.burstTime;
      processResults.push({
        ...next,
        finishTime: currentTime,
        turnaroundTime,
        waitingTime,
      });
    }
  }

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: [...completed],
  });

  return { ganttChart, processResults, steps };
};

const solveRR = (processes: Process[], quantum: number): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;
  const remainingTime = new Map(processes.map((p) => [p.id, p.burstTime]));
  const queue: Process[] = [];
  const completed: string[] = [];
  const addedToQueue = new Set<string>();

  const updateQueue = () => {
    processes.forEach((p) => {
      if (p.arrivalTime <= currentTime && !completed.includes(p.id) && !addedToQueue.has(p.id)) {
        queue.push(p);
        addedToQueue.add(p.id);
      }
    });
  };

  updateQueue();
  
  while (queue.length > 0 || completed.length < processes.length) {
    if (queue.length === 0) {
      steps.push({
        time: currentTime,
        runningProcessId: null,
        readyQueue: [],
        completed: [...completed],
      });
      currentTime++;
      updateQueue();
      continue;
    }

    const next = queue.shift()!;
    const timeToRun = Math.min(remainingTime.get(next.id) || 0, quantum);
    
    const startTime = currentTime;
    for (let t = 0; t < timeToRun; t++) {
      steps.push({
        time: currentTime,
        runningProcessId: next.id,
        readyQueue: queue.map(p => p.id),
        completed: [...completed],
      });
      currentTime++;
      updateQueue();
    }
    const endTime = currentTime;

    ganttChart.push({
      processId: next.id,
      processName: next.name,
      startTime,
      endTime,
      color: next.color,
    });

    remainingTime.set(next.id, (remainingTime.get(next.id) || 0) - timeToRun);
    
    if (remainingTime.get(next.id) === 0) {
      completed.push(next.id);
      const turnaroundTime = currentTime - next.arrivalTime;
      const waitingTime = turnaroundTime - next.burstTime;
      processResults.push({
        ...next,
        finishTime: currentTime,
        turnaroundTime,
        waitingTime,
      });
    } else {
      queue.push(next);
    }
  }

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: [...completed],
  });

  return { ganttChart, processResults, steps };
};

const solvePriority = (processes: Process[]): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;
  const completed: string[] = [];

  while (completed.length < processes.length) {
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && !completed.includes(p.id)
    );

    if (available.length === 0) {
      steps.push({
        time: currentTime,
        runningProcessId: null,
        readyQueue: [],
        completed: [...completed],
      });
      currentTime++;
      continue;
    }

    const next = available.sort((a, b) => (a.priority || 0) - (b.priority || 0))[0];
    const startTime = currentTime;
    
    for (let t = 0; t < next.burstTime; t++) {
      steps.push({
        time: currentTime,
        runningProcessId: next.id,
        readyQueue: available.filter(p => p.id !== next.id).map(p => p.id),
        completed: [...completed],
      });
      currentTime++;
    }
    const endTime = currentTime;

    ganttChart.push({
      processId: next.id,
      processName: next.name,
      startTime,
      endTime,
      color: next.color,
    });

    const turnaroundTime = endTime - next.arrivalTime;
    const waitingTime = turnaroundTime - next.burstTime;

    processResults.push({
      ...next,
      finishTime: endTime,
      turnaroundTime,
      waitingTime,
    });

    completed.push(next.id);
  }

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: [...completed],
  });

  return { ganttChart, processResults, steps };
};

const solvePriorityPreemptive = (processes: Process[]): { ganttChart: GanttItem[]; processResults: ProcessResult[]; steps: SimulationStep[] } => {
  const ganttChart: GanttItem[] = [];
  const processResults: ProcessResult[] = [];
  const steps: SimulationStep[] = [];
  let currentTime = 0;
  const remainingTime = new Map(processes.map((p) => [p.id, p.burstTime]));
  const completed: string[] = [];
  let lastProcessId: string | null = null;

  while (completed.length < processes.length) {
    const available = processes.filter(
      (p) => p.arrivalTime <= currentTime && !completed.includes(p.id)
    );

    if (available.length === 0) {
      steps.push({
        time: currentTime,
        runningProcessId: null,
        readyQueue: [],
        completed: [...completed],
      });
      currentTime++;
      continue;
    }

    const next = available.sort((a, b) => (a.priority || 0) - (b.priority || 0))[0];
    
    steps.push({
      time: currentTime,
      runningProcessId: next.id,
      readyQueue: available.filter(p => p.id !== next.id).map(p => p.id),
      completed: [...completed],
    });

    if (lastProcessId !== next.id) {
      ganttChart.push({
        processId: next.id,
        processName: next.name,
        startTime: currentTime,
        endTime: currentTime + 1,
        color: next.color,
      });
    } else {
      ganttChart[ganttChart.length - 1].endTime = currentTime + 1;
    }

    remainingTime.set(next.id, (remainingTime.get(next.id) || 0) - 1);
    currentTime++;
    lastProcessId = next.id;

    if (remainingTime.get(next.id) === 0) {
      completed.push(next.id);
      const turnaroundTime = currentTime - next.arrivalTime;
      const waitingTime = turnaroundTime - next.burstTime;
      processResults.push({
        ...next,
        finishTime: currentTime,
        turnaroundTime,
        waitingTime,
      });
    }
  }

  // Final step
  steps.push({
    time: currentTime,
    runningProcessId: null,
    readyQueue: [],
    completed: [...completed],
  });

  return { ganttChart, processResults, steps };
};
