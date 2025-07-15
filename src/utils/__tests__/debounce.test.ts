import { debounce, throttle } from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should only execute function once after multiple calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('call1');
    debouncedFn('call2');
    debouncedFn('call3');

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });

  it('should reset timer on subsequent calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    jest.advanceTimersByTime(50);
    
    debouncedFn('second');
    jest.advanceTimersByTime(50);
    
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('second');
  });

  it('should handle functions with multiple parameters', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2', 'arg3');
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should handle functions with no parameters', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(100);
    
    expect(mockFn).toHaveBeenCalledWith();
  });

  it('should handle zero delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn('test');
    jest.advanceTimersByTime(0);
    
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute function immediately on first call', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should ignore subsequent calls within limit', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('call1');
    throttledFn('call2');
    throttledFn('call3');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');
  });

  it('should allow execution after limit period', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('call1');
    expect(mockFn).toHaveBeenCalledWith('call1');

    jest.advanceTimersByTime(100);
    throttledFn('call2');
    expect(mockFn).toHaveBeenCalledWith('call2');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle functions with multiple parameters', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1', 'arg2', 'arg3');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should handle zero limit', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 0);

    throttledFn('call1');
    expect(mockFn).toHaveBeenCalledWith('call1');

    jest.advanceTimersByTime(0);
    throttledFn('call2');
    expect(mockFn).toHaveBeenCalledWith('call2');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should maintain separate throttle states for different instances', () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();
    const throttledFn1 = throttle(mockFn1, 100);
    const throttledFn2 = throttle(mockFn2, 100);

    throttledFn1('fn1');
    throttledFn2('fn2');

    expect(mockFn1).toHaveBeenCalledWith('fn1');
    expect(mockFn2).toHaveBeenCalledWith('fn2');
  });
}); 