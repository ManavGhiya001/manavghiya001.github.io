/**
 * UI Utilities Module
 * Helper functions for UI operations
 */

/**
 * Format a timestamp into a readable date/time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Create a badge element with the specified text and class
 * @param {string} text - Badge text
 * @param {string} className - Additional class name
 * @returns {HTMLElement} - Badge element
 */
function createBadge(text, className = '') {
  const badge = document.createElement('span');
  badge.classList.add('badge', className);
  badge.textContent = text;
  return badge;
}

/**
 * Create a tooltip element
 * @param {string} content - Tooltip content
 * @returns {HTMLElement} - Tooltip element
 */
function createTooltip(content) {
  const tooltip = document.createElement('span');
  tooltip.setAttribute('data-bs-toggle', 'tooltip');
  tooltip.setAttribute('data-bs-placement', 'top');
  tooltip.setAttribute('title', content);
  return tooltip;
}

/**
 * Initialize tooltips on the page
 */
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
  // Map types to Bootstrap classes
  const typeClasses = {
    success: 'bg-success',
    error: 'bg-danger',
    info: 'bg-info',
    warning: 'bg-warning'
  };
  
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastElement = document.createElement('div');
  toastElement.className = `toast ${typeClasses[type] || 'bg-secondary'} text-white`;
  toastElement.setAttribute('role', 'alert');
  toastElement.setAttribute('aria-live', 'assertive');
  toastElement.setAttribute('aria-atomic', 'true');
  
  toastElement.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">Pokemon IV Finder</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toastElement);
  
  // Initialize and show toast
  const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
  toast.show();
  
  // Remove from DOM after hiding
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

/**
 * Format IV values into a percentage
 * @param {number} attack - Attack IV
 * @param {number} defense - Defense IV
 * @param {number} stamina - Stamina IV
 * @returns {string} - Formatted IV percentage
 */
function formatIVPercentage(attack, defense, stamina) {
  if (attack === -1 || defense === -1 || stamina === -1) {
    return 'Unknown';
  }
  
  const percentage = ((attack + defense + stamina) / 45) * 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - Whether element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll to an element smoothly
 * @param {HTMLElement} element - Element to scroll to
 */
function scrollToElement(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}