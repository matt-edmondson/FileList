export function debounce<T extends (..._args: any[]) => any>(
  func: T,
  wait: number
): (..._args: Parameters<T>) => void {
  let timeout: any;
  
  return (..._args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(..._args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (..._args: any[]) => any>(
  func: T,
  limit: number
): (..._args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (..._args: Parameters<T>) => {
    if (!inThrottle) {
      func(..._args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 