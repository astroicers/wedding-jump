import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have correct default state', () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.seconds).toBe(30);
    expect(result.current.maxSeconds).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('should accept custom initialSeconds', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    expect(result.current.seconds).toBe(10);
    expect(result.current.maxSeconds).toBe(10);
    expect(result.current.progress).toBe(100);
  });

  it('should set isRunning to true when start is called', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it('should decrement seconds by 1 after 1 second passes', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(9);
  });

  it('should stop counting when pause is called', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.seconds).toBe(8);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(8);
  });

  it('should continue counting when resume is called', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.pause();
    });

    expect(result.current.seconds).toBe(8);

    act(() => {
      result.current.resume();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(7);
  });

  it('should reset to initialSeconds and stop running when reset is called', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.seconds).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.seconds).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('should set seconds to 0 and stop running when stop is called', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should override initialSeconds when start is called with newSeconds', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start(20);
    });

    expect(result.current.seconds).toBe(20);
    expect(result.current.maxSeconds).toBe(20);
    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(19);
  });

  it('should fire onTick callback each second with updated seconds value', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 5, onTick }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTick).toHaveBeenCalledWith(4);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTick).toHaveBeenCalledWith(3);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it('should fire onComplete callback when countdown reaches 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 3, onComplete }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should calculate progress correctly as timer counts down', () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 10 }));

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.progress).toBeCloseTo(50);
  });
});
