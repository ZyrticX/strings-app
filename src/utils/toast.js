/**
 * Toast utility functions for STRINGS app
 * Provides consistent toast notifications across the application
 */

/**
 * Safe toast function that works even if window.showToast is not available
 * @param {string} type - Type of toast: 'success', 'error', 'warn', 'info'
 * @param {string} title - Main message
 * @param {string} description - Optional description
 */
export const showToast = (type, title, description = '') => {
  // First try the global window.showToast function
  if (typeof window !== 'undefined' && window.showToast && typeof window.showToast === 'function') {
    try {
      window.showToast(type, title, description);
      return;
    } catch (error) {
      console.error('Error calling window.showToast:', error);
    }
  }

  // Fallback: Log to console with nice formatting
  const emoji = {
    success: '✅',
    error: '❌',
    warn: '⚠️',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const logFunction = type === 'error' ? console.error : console.log;
  logFunction(`${emoji[type] || 'ℹ️'} ${title}${description ? `: ${description}` : ''}`);

  // Try to import and use toast directly as additional fallback
  if (typeof window !== 'undefined') {
    import('@/components/ui/sonner').then(({ toast }) => {
      const toastOptions = description ? { description } : {};
      
      switch (type) {
        case 'success':
          toast.success(title, toastOptions);
          break;
        case 'error':
          toast.error(title, toastOptions);
          break;
        case 'warn':
        case 'warning':
          toast.warning(title, toastOptions);
          break;
        case 'info':
          toast.info(title, toastOptions);
          break;
        default:
          toast(title, toastOptions);
      }
    }).catch(() => {
      // Silent fail - console logging already happened above
    });
  }
};

/**
 * Convenience functions for different toast types
 */
export const showSuccess = (title, description) => showToast('success', title, description);
export const showError = (title, description) => showToast('error', title, description);
export const showWarning = (title, description) => showToast('warn', title, description);
export const showInfo = (title, description) => showToast('info', title, description);

/**
 * Toast for API operations
 */
export const showApiError = (operation, error) => {
  const message = error?.message || 'שגיאה לא ידועה';
  showError(`שגיאה ב${operation}`, message);
};

export const showApiSuccess = (operation, details) => {
  showSuccess(`${operation} הושלם בהצלחה`, details);
};

/**
 * Initialize toast system - call this early in the app lifecycle
 */
export const initToastSystem = () => {
  if (typeof window !== 'undefined' && !window.showToast) {
    // If window.showToast is not defined, create it
    window.showToast = showToast;
    console.log('🍞 Toast system initialized with fallback');
  }
};
