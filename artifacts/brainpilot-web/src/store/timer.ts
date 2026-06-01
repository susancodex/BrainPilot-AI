import { create } from 'zustand';

export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  secondsLeft: number;
  subject: string;
  description: string;
  pomodorosCompleted: number;
  sessionId: string | null;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;

  setSubject: (subject: string) => void;
  setDescription: (desc: string) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => boolean;
  setMode: (mode: TimerMode) => void;
  setSessionId: (id: string | null) => void;
  incrementPomodoros: () => void;
  setDurations: (focus: number, shortBreak: number, longBreak: number) => void;
  getProgressPercent: () => number;
  getTotalSeconds: () => number;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'focus',
  status: 'idle',
  secondsLeft: 25 * 60,
  subject: '',
  description: '',
  pomodorosCompleted: 0,
  sessionId: null,
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,

  setSubject: (subject) => set({ subject }),
  setDescription: (description) => set({ description }),
  start: () => set({ status: 'running' }),
  pause: () => set({ status: 'paused' }),

  reset: () => {
    const { mode, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const mins = mode === 'focus' ? focusMinutes : mode === 'short_break' ? shortBreakMinutes : longBreakMinutes;
    set({ status: 'idle', secondsLeft: mins * 60 });
  },

  tick: () => {
    const { secondsLeft } = get();
    if (secondsLeft <= 1) {
      set({ secondsLeft: 0, status: 'idle' });
      return true;
    }
    set({ secondsLeft: secondsLeft - 1 });
    return false;
  },

  setMode: (mode) => {
    const { focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const mins = mode === 'focus' ? focusMinutes : mode === 'short_break' ? shortBreakMinutes : longBreakMinutes;
    set({ mode, secondsLeft: mins * 60, status: 'idle' });
  },

  setSessionId: (sessionId) => set({ sessionId }),
  incrementPomodoros: () => set((s) => ({ pomodorosCompleted: s.pomodorosCompleted + 1 })),

  setDurations: (focus, shortBreak, longBreak) => {
    const { mode } = get();
    const mins = mode === 'focus' ? focus : mode === 'short_break' ? shortBreak : longBreak;
    set({ focusMinutes: focus, shortBreakMinutes: shortBreak, longBreakMinutes: longBreak, secondsLeft: mins * 60 });
  },

  getProgressPercent: () => {
    const { mode, secondsLeft, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const totalMins = mode === 'focus' ? focusMinutes : mode === 'short_break' ? shortBreakMinutes : longBreakMinutes;
    const total = totalMins * 60;
    return total > 0 ? ((total - secondsLeft) / total) * 100 : 0;
  },

  getTotalSeconds: () => {
    const { mode, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const mins = mode === 'focus' ? focusMinutes : mode === 'short_break' ? shortBreakMinutes : longBreakMinutes;
    return mins * 60;
  },
}));
