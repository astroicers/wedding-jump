import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTimerOptions {
  initialSeconds?: number;
  onTick?: (seconds: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTimer(options: UseTimerOptions = {}) {
  const {
    initialSeconds = 30,
    autoStart = false,
  } = options;

  const [seconds, setSeconds] = useState(initialSeconds);
  const [maxSeconds, setMaxSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use refs for callbacks to avoid re-triggering the interval effect
  const onTickRef = useRef(options.onTick);
  const onCompleteRef = useRef(options.onComplete);
  onTickRef.current = options.onTick;
  onCompleteRef.current = options.onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((newSeconds?: number) => {
    clearTimer();
    if (newSeconds !== undefined) {
      setSeconds(newSeconds);
      setMaxSeconds(newSeconds);
    }
    setCompleted(false);
    setIsRunning(true);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    clearTimer();
    const targetSeconds = newSeconds ?? initialSeconds;
    setSeconds(targetSeconds);
    setMaxSeconds(targetSeconds);
    setIsRunning(false);
    setCompleted(false);
  }, [initialSeconds, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setSeconds(0);
    setIsRunning(false);
  }, [clearTimer]);

  // Single interval effect — only depends on isRunning
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);

        if (next <= 0) {
          setIsRunning(false);
          setCompleted(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Fire onComplete in a separate effect when timer completes
  useEffect(() => {
    if (completed) {
      onCompleteRef.current?.();
      setCompleted(false);
    }
  }, [completed]);

  return {
    seconds,
    maxSeconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    stop,
    progress: maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0,
  };
}
