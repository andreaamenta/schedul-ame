/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Cpu, Play, Share2, RefreshCw, Info, CheckCircle2, BarChart3, Eye, Edit3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { io, Socket } from 'socket.io-client';
import { Process, AlgorithmType, SchedulingResult, SimulationStep } from './types';
import { solveScheduling } from './lib/algorithms';
import { ALGORITHMS, UI_STRINGS } from './constants';
import { ProcessInput } from './components/ProcessInput';
import { GanttChart } from './components/GanttChart';
import { ResultsTable } from './components/ResultsTable';
import { HistorySidebar } from './components/HistorySidebar';

const DEFAULT_PROCESSES: Process[] = [
  { id: '1', name: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, color: '#6366f1' },
  { id: '2', name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10b981' },
  { id: '3', name: 'P3', arrivalTime: 2, burstTime: 8, priority: 3, color: '#f59e0b' },
];

export default function App() {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('FCFS');
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState<SchedulingResult | null>(null);
  const [history, setHistory] = useState<SchedulingResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewOnly = params.get('viewOnly') === 'true';
    if (viewOnly) setIsReadOnly(true);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scheduling_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('scheduling_history', JSON.stringify(history.slice(-10)));
    }
  }, [history]);

  const handleAddProcess = () => {
    if (isReadOnly) return;
    const newId = (Math.max(...processes.map(p => parseInt(p.id) || 0), 0) + 1).toString();
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    setProcesses([...processes, {
      id: newId,
      name: `P${newId}`,
      arrivalTime: 0,
      burstTime: 5,
      priority: 1,
      color: randomColor
    }]);
  };

  const handleRemoveProcess = (id: string) => {
    if (isReadOnly) return;
    if (processes.length > 1) {
      setProcesses(processes.filter(p => p.id !== id));
    }
  };

  const handleProcessChange = (id: string, field: keyof Process, value: any) => {
    if (isReadOnly) return;
    setProcesses(processes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    const params = new URLSearchParams(window.location.search);
    let sid = params.get('session');
    
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 10);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', sid);
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    setSessionId(sid);
    socket.emit('join-session', sid);

    socket.on('session-update', (data) => {
      if (data.processes) setProcesses(data.processes);
      if (data.algorithm) setAlgorithm(data.algorithm);
      if (data.quantum) setQuantum(data.quantum);
    });

    socket.on('simulation-started', ({ algorithm: algo, processes: procs, quantum: q }) => {
      runSimulation(procs, algo, q);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync state to server
  useEffect(() => {
    if (sessionId && socketRef.current && !isReadOnly && !isRunning) {
      socketRef.current.emit('update-session', {
        sessionId,
        data: { processes, algorithm, quantum }
      });
    }
  }, [processes, algorithm, quantum, sessionId, isReadOnly, isRunning]);

  const runSimulation = (procs: Process[], algo: AlgorithmType, q: number) => {
    setIsRunning(true);
    setIsSimulating(true);
    setResult(null);
    setSimulationProgress(0);
    setCurrentStep(null);
    
    const newResult = solveScheduling(procs, algo, q);
    const totalSteps = newResult.steps.length;
    let stepIndex = 0;

    const interval = 200;
    const timer = setInterval(() => {
      if (stepIndex < totalSteps) {
        const step = newResult.steps[stepIndex];
        setCurrentStep(step);
        setSimulationProgress(((stepIndex + 1) / totalSteps) * 100);
        stepIndex++;
      } else {
        clearInterval(timer);
        setResult(newResult);
        setHistory(prev => {
          const updated = [...prev, newResult];
          return updated.slice(-10);
        });
        setIsRunning(false);
        setIsSimulating(false);
      }
    }, interval);
  };

  const handleSolve = () => {
    if (sessionId && socketRef.current) {
      socketRef.current.emit('start-simulation', {
        sessionId,
        algorithm,
        processes,
        quantum
      });
    } else {
      runSimulation(processes, algorithm, quantum);
    }
  };

  const handleReset = () => {
    if (isReadOnly) {
      setIsReadOnly(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('viewOnly');
      window.history.replaceState({}, '', url.toString());
    }
    setProcesses(DEFAULT_PROCESSES);
    setResult(null);
    setAlgorithm('FCFS');
    setQuantum(2);
  };

  const handleShare = (viewOnly: boolean = false) => {
    const url = new URL(window.location.href);
    if (viewOnly) {
      url.searchParams.set('viewOnly', 'true');
    } else {
      url.searchParams.delete('viewOnly');
    }
    // Session is already in the URL
    navigator.clipboard.writeText(url.toString());
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const selectedAlgoInfo = useMemo(() => 
    ALGORITHMS.find(a => a.type === algorithm), 
    [algorithm]
  );

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.processResults.map(r => ({
      name: r.name,
      'Turnaround Time': r.turnaroundTime,
      'Waiting Time': r.waitingTime,
    }));
  }, [result]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800">
              <Cpu className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{UI_STRINGS.APP_TITLE}</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none">{UI_STRINGS.SUBTITLE}</p>
                {isReadOnly && (
                  <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-500/20">{UI_STRINGS.VIEWER_BADGE}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-900 mr-2">
              <Users size={14} className="text-zinc-600" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">{UI_STRINGS.SESSION_LABEL}: {sessionId}</span>
            </div>
            {!isReadOnly && (
              <button 
                onClick={() => handleShare(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all text-xs font-semibold"
                title={UI_STRINGS.SHARE_VIEW}
              >
                <Eye size={16} />
                <span className="hidden sm:inline">{UI_STRINGS.SHARE_VIEW}</span>
              </button>
            )}
            <button 
              onClick={() => handleShare(false)}
              className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
              title={UI_STRINGS.SHARE_SESSION}
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={handleReset}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              title={isReadOnly ? UI_STRINGS.EXIT_VIEWER : UI_STRINGS.RESET_ALL}
            >
              {isReadOnly ? <Edit3 size={20} /> : <RefreshCw size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Share Toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-zinc-800">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">{UI_STRINGS.COPIED_TOAST}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Input */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Algorithm Selection */}
            <section className={`glass-panel p-6 rounded-2xl ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-6">
                <Info size={18} className="text-indigo-400" />
                <h2 className="text-base font-semibold text-white">{UI_STRINGS.ALGO_CONFIG}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{UI_STRINGS.SELECT_ALGO}</label>
                  <select 
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
                    className="input-field w-full appearance-none"
                  >
                    {ALGORITHMS.map(a => (
                      <option key={a.type} value={a.type}>{a.name}</option>
                    ))}
                  </select>
                </div>
                
                {algorithm === 'RR' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{UI_STRINGS.TIME_QUANTUM}</label>
                    <input 
                      type="number"
                      min="1"
                      value={quantum}
                      onChange={(e) => setQuantum(parseInt(e.target.value) || 1)}
                      className="input-field w-full"
                    />
                  </motion.div>
                )}
              </div>

              <div className="mt-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="font-bold text-indigo-400 uppercase tracking-tighter mr-2">{selectedAlgoInfo?.name}:</span> {selectedAlgoInfo?.description}
                </p>
              </div>
            </section>

            {/* Process Input */}
            <div className={isReadOnly ? 'opacity-75 pointer-events-none' : ''}>
              <ProcessInput 
                processes={processes}
                onAdd={handleAddProcess}
                onRemove={handleRemoveProcess}
                onChange={handleProcessChange}
                showPriority={algorithm === 'Priority' || algorithm === 'PriorityPreemptive'}
              />
            </div>

            {/* Run Button */}
            {!isReadOnly && (
              <div className="flex justify-center">
                <button
                  onClick={handleSolve}
                  disabled={isRunning}
                  className={`
                    relative group flex items-center gap-3 px-12 py-4 rounded-2xl text-white font-bold text-lg transition-all
                    ${isRunning ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200 hover:-translate-y-1 active:translate-y-0'}
                  `}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="animate-spin" size={24} />
                      {UI_STRINGS.SIMULATING} {Math.round(simulationProgress)}%
                    </>
                  ) : (
                    <>
                      <Play size={24} fill="currentColor" />
                      {UI_STRINGS.SOLVE}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Simulation Progress Bar */}
            {isRunning && (
              <div className="space-y-4">
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${simulationProgress}%` }}
                  />
                </div>
                
                {currentStep && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-2xl shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{UI_STRINGS.LIVE_EXECUTION}</h3>
                      <span className="text-[10px] font-mono bg-white/10 text-white px-2 py-1 rounded border border-white/10">{UI_STRINGS.TIME}: {currentStep.time}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-2">{UI_STRINGS.RUNNING}</p>
                        <p className="text-xl font-bold text-white font-mono">
                          {currentStep.runningProcessId ? processes.find(p => p.id === currentStep.runningProcessId)?.name : UI_STRINGS.IDLE}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900">
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-2">{UI_STRINGS.READY_QUEUE}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentStep.readyQueue.length > 0 ? (
                            currentStep.readyQueue.map(id => (
                              <span key={id} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono font-bold text-amber-400">
                                {processes.find(p => p.id === id)?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-700 italic font-mono">{UI_STRINGS.EMPTY}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{UI_STRINGS.COMPLETED}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentStep.completed.length > 0 ? (
                            currentStep.completed.map(id => (
                              <span key={id} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono font-bold text-zinc-500">
                                {processes.find(p => p.id === id)?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-800 italic font-mono">{UI_STRINGS.NONE}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {result && !isRunning && (
                <motion.div
                  key={result.timestamp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <GanttChart items={result.ganttChart} />
                  
                  {/* Statistics Chart */}
                  <div className="glass-panel p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 size={18} className="text-indigo-400" />
                      <h2 className="text-base font-semibold text-white">{UI_STRINGS.PERFORMANCE_METRICS}</h2>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontFamily: 'JetBrains Mono' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontFamily: 'JetBrains Mono' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ fontSize: '12px' }}
                            cursor={{ fill: '#18181b', opacity: 0.4 }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }} />
                          <Bar dataKey="Turnaround Time" name={UI_STRINGS.TURNAROUND} fill="#6366f1" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="Waiting Time" name={UI_STRINGS.WAITING} fill="#10b981" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <ResultsTable 
                    results={result.processResults}
                    avgTurnaround={result.averageTurnaroundTime}
                    avgWaiting={result.averageWaitingTime}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!result && !isRunning && (
              <div className="py-24 text-center border border-dashed border-zinc-900 rounded-3xl">
                <Cpu size={40} className="mx-auto mb-4 text-zinc-900" />
                <h3 className="text-sm font-medium text-zinc-700 uppercase tracking-widest">
                  {isReadOnly ? UI_STRINGS.VIEWING_SHARED : UI_STRINGS.READY_FOR_SIM}
                </h3>
              </div>
            )}
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <HistorySidebar 
                history={history}
                onSelect={(item) => setResult(item)}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-zinc-900 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-zinc-700 uppercase font-bold tracking-[0.3em]">
            {UI_STRINGS.FOOTER_TEXT}
          </p>
        </div>
      </footer>
    </div>
  );
}
