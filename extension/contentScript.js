// Content script for DOM interaction and hate speech detection
console.log('🚀 [HATE-DETECT] Content script file loaded!');
console.log('🚀 [HATE-DETECT] Current URL:', window.location.href);

// Settings
let settings = {
  feature1Enabled: true,
  feature2Enabled: true,
  sensitivityLevel: 'medium',
  filterAction: 'blur',
  platformsEnabled: {
    facebook: true,
    instagram: true,
    twitter: true
  }
};

const HATE_BADGE_TEXT = 'HS';

function injectIndicatorStyles() {
  if (document.getElementById('hateDetectStyles')) return;

  const style = document.createElement('style');
  style.id = 'hateDetectStyles';
  style.textContent = `
    .hate-detect-input-wrapper {
      position: relative !important;
      display: inline-block !important;
      width: 100%;
    }

    .hate-detect-ready {
      padding-right: 35px !important;
    }

    .hate-detect-active {
      outline: 2px solid rgba(231, 76, 60, 0.3);
      outline-offset: 2px;
    }
  `;

  document.head.appendChild(style);
}

// Load settings from storage
chrome.storage.sync.get(null, (data) => {
  if (data && Object.keys(data).length > 0) {
    settings = { ...settings, ...data };
  }
  console.log('📦 [HATE-DETECT] Settings loaded:', settings);
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    console.log('⏳ [HATE-DETECT] DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ [HATE-DETECT] DOM loaded, initializing...');
      initializeExtension();
    });
  } else {
    console.log('✅ [HATE-DETECT] DOM already loaded, initializing immediately...');
    initializeExtension();
  }
});

/**
 * Initialize the extension
 */
function initializeExtension() {
  console.log('🚀 [HATE-DETECT] Extension loaded and initializing...');
  console.log('🚀 [HATE-DETECT] Settings:', settings);
  
  if (settings.feature1Enabled) {
    console.log('✅ [HATE-DETECT] Feature 1 (Pre-Send Detection) enabled');
    setupPreSendDetection();
  } else {
    console.log('❌ [HATE-DETECT] Feature 1 disabled');
  }
  
  if (settings.feature2Enabled) {
    console.log('✅ [HATE-DETECT] Feature 2 (Incoming Filtering) enabled');
    setupIncomingFiltering();
  } else {
    console.log('❌ [HATE-DETECT] Feature 2 disabled');
  }
  
  console.log('✅ [HATE-DETECT] Initialization complete');
}

/**
 * FEATURE 1: Pre-Send Hate Detection
 */
function setupPreSendDetection() {
  console.log('🔧 [HATE-DETECT] Setting up pre-send detection...');
  console.log('🌐 [HATE-DETECT] Current site:', window.location.hostname);
  
  injectIndicatorStyles();
  console.log('✅ [HATE-DETECT] Styles injected');

  document.addEventListener('focusin', handleDocumentFocusIn, true);
  console.log('✅ [HATE-DETECT] Focus listener added');

  // Monitor for editable elements with more aggressive observation for dynamic sites
  const observer = new MutationObserver((mutations) => {
    console.log(`👀 [HATE-DETECT] DOM mutation detected (${mutations.length} changes), re-scanning for inputs`);
    attachSendListeners();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true, // Watch for attribute changes too
    attributeFilter: ['contenteditable', 'role', 'aria-label', 'placeholder'] // Instagram changes these
  });
  console.log('✅ [HATE-DETECT] Mutation observer started (watching attributes)');

  // Initial setup
  console.log('🔍 [HATE-DETECT] Scanning page for initial editable elements...');
  attachSendListeners();
  
  // For dynamic sites like Instagram, re-scan after delays
  const isInstagram = window.location.hostname.includes('instagram');
  if (isInstagram) {
    console.log('📸 [HATE-DETECT] Instagram detected - using delayed scanning');
    setTimeout(() => {
      console.log('🔍 [HATE-DETECT] Instagram: Re-scanning after 2s...');
      attachSendListeners();
    }, 2000);
    setTimeout(() => {
      console.log('🔍 [HATE-DETECT] Instagram: Re-scanning after 5s...');
      attachSendListeners();
    }, 5000);
  }
}

/**
 * Attach listeners to send buttons and editable elements
 */
function attachSendListeners() {
  const editables = getEditableElements();
  const hostname = window.location.hostname;
  console.log(`📝 [HATE-DETECT] Found ${editables.length} editable elements on ${hostname}:`);
  
  if (editables.length === 0) {
    console.warn('⚠️ [HATE-DETECT] No editable elements found on page');
    console.log('🔍 [HATE-DETECT] Trying manual detection for Instagram...');
    
    // Manual detection for Instagram
    if (hostname.includes('instagram')) {
      const manualSelectors = [
        'textarea',
        '[contenteditable="true"]',
        '[role="textbox"]',
        'div[contenteditable]',
        'form textarea',
        'form [contenteditable]'
      ];
      
      manualSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`  - ${selector}: found ${elements.length}`);
        elements.forEach((el, idx) => {
          console.log(`    Element ${idx}:`, {
            tag: el.tagName,
            contenteditable: el.getAttribute('contenteditable'),
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            placeholder: el.getAttribute('placeholder'),
            visible: el.offsetHeight > 0
          });
        });
      });
    }
  }
  
  editables.forEach((element, index) => {
    if (element.__hateCheckListener) {
      console.log(`⏭️ [HATE-DETECT] Element ${index} already has listener, skipping`);
      return; // Already attached
    }
    
    console.log(`✅ [HATE-DETECT] Attaching listeners to element ${index}:`, {
      tag: element.tagName,
      contenteditable: element.getAttribute('contenteditable'),
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label'),
      placeholder: element.getAttribute('placeholder')
    });
    
    // Attach keyboard listener for Enter/Ctrl+Enter
    element.addEventListener('keydown', handleKeyboardSend, true);
    element.__hateCheckListener = true;

    markEditableForDetection(element);

    // Find associated send button
    const sendButton = findSendButton(element);
    if (sendButton && !sendButton.__hateCheckListener) {
      console.log(`🔘 [HATE-DETECT] Found send button for element ${index}`);
      sendButton.addEventListener('click', (e) => handleSendButtonClick(e, element), true);
      sendButton.__hateCheckListener = true;
    }
  });
}

function markEditableForDetection(element) {
  if (!element) {
    console.warn('⚠️ [HATE-DETECT] markEditableForDetection called with null element');
    return;
  }
  
  if (element.__hateDetectMarked) {
    console.log('⏭️ [HATE-DETECT] Element already marked for detection');
    return;
  }

  console.log('🎯 [HATE-DETECT] Marking element for detection (listeners only, no icon yet):', element);
  element.classList.add('hate-detect-ready');

  // Don't inject icon yet - only on focus
  // Icon will be injected in handleEditableFocus

  element.addEventListener('focus', handleEditableFocus, true);
  element.addEventListener('blur', handleEditableBlur, true);
  element.addEventListener('input', () => scheduleScoreUpdate(element));
  element.__hateDetectMarked = true;
  
  console.log('✅ [HATE-DETECT] Element marked successfully (ready for focus)');
}

// Track currently focused element to manage single icon
let currentFocusedElement = null;
let isClickingIcon = false; // Flag to prevent blur-based removal during icon clicks

function handleDocumentFocusIn(event) {
  console.log('👁️ [HATE-DETECT] Focus event detected on:', event.target);
  const editable = getEditableFromEventTarget(event.target);
  if (editable) {
    console.log('✅ [HATE-DETECT] Editable element focused:', editable);
    markEditableForDetection(editable);
    
    // Remove icon from previously focused element
    if (currentFocusedElement && currentFocusedElement !== editable) {
      console.log('🔄 [HATE-DETECT] Removing icon from previous element');
      removeIconFromElement(currentFocusedElement);
      currentFocusedElement.classList.remove('hate-detect-active');
    }
    
    currentFocusedElement = editable;
    editable.classList.add('hate-detect-active');
    
    // Inject icon only for focused element
    if (!editable.__hateDetectIcon) {
      console.log('🎨 [HATE-DETECT] Injecting icon for focused element...');
      injectIconIntoInput(editable);
    }
    
    scheduleScoreUpdate(editable);
  } else {
    console.log('⏭️ [HATE-DETECT] Focused element is not editable');
  }
}

function handleEditableFocus(event) {
  console.log('🎯 [HATE-DETECT] Element focus event:', event.target);
  const element = getEditableFromEventTarget(event.target) || event.target;
  
  // Remove icon from previously focused element
  if (currentFocusedElement && currentFocusedElement !== element) {
    console.log('🔄 [HATE-DETECT] Removing icon from previous element');
    removeIconFromElement(currentFocusedElement);
    currentFocusedElement.classList.remove('hate-detect-active');
  }
  
  currentFocusedElement = element;
  element.classList.add('hate-detect-active');
  
  // Inject icon only for focused element
  if (!element.__hateDetectIcon) {
    console.log('🎨 [HATE-DETECT] Injecting icon for newly focused element...');
    injectIconIntoInput(element);
  }
  
  console.log('✅ [HATE-DETECT] Added active class and icon to element');
}

function handleEditableBlur(event) {
  console.log('👋 [HATE-DETECT] Element blur event:', event.target);
  
  // Don't remove icon if we're clicking on it
  if (isClickingIcon) {
    console.log('🎯 [HATE-DETECT] User is clicking icon, keeping it visible');
    return;
  }
  
  const element = getEditableFromEventTarget(event.target) || event.target;
  
  // Small delay to allow icon clicks to complete
  setTimeout(() => {
    // Check again if user is still interacting with icon
    if (isClickingIcon) {
      console.log('🎯 [HATE-DETECT] Still interacting with icon, keeping visible');
      return;
    }
    
    element.classList.remove('hate-detect-active');
    
    // Remove icon when input loses focus (keeps UI clean)
    console.log('🧹 [HATE-DETECT] Removing icon from blurred element');
    removeIconFromElement(element);
    
    if (currentFocusedElement === element) {
      currentFocusedElement = null;
    }
    
    console.log('✅ [HATE-DETECT] Removed active class and icon from element');
  }, 150); // 150ms delay allows click events to register
}

function getEditableFromEventTarget(target) {
  if (!target) return null;
  if (target.closest) {
    const editable = target.closest('[contenteditable="true"], [contenteditable="plaintext-only"], textarea, input[type="text"], [role="textbox"]');
    if (editable) return editable;
  }
  return null;
}

/**
 * Inject a Grammarly-style icon into an input field
 */
function injectIconIntoInput(element) {
  if (!element) {
    console.error('❌ [HATE-DETECT] Cannot inject icon: element is null');
    return;
  }
  
  if (element.__hateDetectIcon) {
    console.log('⏭️ [HATE-DETECT] Icon already exists for element');
    return;
  }
  
  console.log('🔨 [HATE-DETECT] Creating icon for element:', element);

  const icon = document.createElement('div');
  icon.className = 'hate-detect-icon';
  icon.__hateDetectElement = element;
  
  // Create shadow DOM for the icon
  const shadow = icon.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: absolute;
      bottom: 8px;
      right: 8px;
      z-index: 999999;
      cursor: pointer;
      pointer-events: auto;
    }
    
    .icon-button {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
      transition: all 0.2s ease;
      border: 2px solid rgba(255, 255, 255, 0.9);
    }
    
    .icon-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.5);
    }
    
    .icon-button:active {
      transform: scale(0.95);
    }
    
    .icon-text {
      color: white;
      font-size: 11px;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      user-select: none;
    }
    
    .score-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #f39c12;
      color: white;
      font-size: 9px;
      font-weight: bold;
      padding: 2px 4px;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
      border: 1px solid white;
      display: none;
    }
    
    .score-badge.show {
      display: block;
    }
    
    .score-badge.high {
      background: #e74c3c;
    }
    
    .score-badge.medium {
      background: #f39c12;
    }
    
    .score-badge.low {
      background: #27ae60;
    }
  `;
  shadow.appendChild(style);
  
  const button = document.createElement('div');
  button.className = 'icon-button';
  button.innerHTML = '<span class="icon-text">HS</span>';
  
  const scoreBadge = document.createElement('div');
  scoreBadge.className = 'score-badge';
  scoreBadge.textContent = '0';
  button.appendChild(scoreBadge);
  
  shadow.appendChild(button);
  
  // Position the icon
  icon.style.cssText = `
    position: absolute !important;
    pointer-events: auto !important;
    z-index: 999999 !important;
  `;
  
  // Prevent icon clicks from blurring the input
  icon.addEventListener('mousedown', (e) => {
    console.log('🖱️ [HATE-DETECT] Icon mousedown - preventing input blur');
    e.preventDefault(); // Prevents input from losing focus
    e.stopPropagation();
    isClickingIcon = true;
  });
  
  icon.addEventListener('mouseup', (e) => {
    console.log('🖱️ [HATE-DETECT] Icon mouseup');
    // Reset flag after a short delay
    setTimeout(() => {
      isClickingIcon = false;
    }, 200);
  });
  
  // Click handler on the button inside shadow DOM
  button.addEventListener('click', (e) => {
    console.log('👆 [HATE-DETECT] Icon button clicked');
    e.preventDefault();
    e.stopPropagation();
    isClickingIcon = true;
    handleIconClick(element, shadow);
    // Reset flag after handler completes
    setTimeout(() => {
      isClickingIcon = false;
    }, 300);
  });
  
  // Also handle clicks on the shadow root container
  icon.addEventListener('click', (e) => {
    console.log('👆 [HATE-DETECT] Icon container clicked');
    e.preventDefault();
    e.stopPropagation();
  });
  
  // Position and append icon
  console.log('📍 [HATE-DETECT] Positioning and appending icon to body...');
  
  if (!document.body) {
    console.error('❌ [HATE-DETECT] document.body is not available yet!');
    // Retry after a short delay
    setTimeout(() => injectIconIntoInput(element), 100);
    return;
  }
  
  positionIcon(icon, element);
  document.body.appendChild(icon);
  console.log('✅ [HATE-DETECT] Icon appended to DOM');
  
  element.__hateDetectIcon = icon;
  icon.__hateDetectShadow = shadow;
  
  // Update position on scroll/resize
  const updatePosition = () => positionIcon(icon, element);
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition, true);
  icon.__hateDetectPositionUpdate = updatePosition;
  
  console.log('🎉 [HATE-DETECT] Icon injection complete and visible!');
}

/**
 * Remove icon from an element
 */
function removeIconFromElement(element) {
  if (!element) {
    console.warn('⚠️ [HATE-DETECT] Cannot remove icon: element is null');
    return;
  }
  
  if (!element.__hateDetectIcon) {
    console.log('⏭️ [HATE-DETECT] No icon to remove from element');
    return;
  }
  
  console.log('🗑️ [HATE-DETECT] Removing icon from element:', element);
  
  const icon = element.__hateDetectIcon;
  
  // Remove event listeners
  if (icon.__hateDetectPositionUpdate) {
    window.removeEventListener('scroll', icon.__hateDetectPositionUpdate, true);
    window.removeEventListener('resize', icon.__hateDetectPositionUpdate, true);
    delete icon.__hateDetectPositionUpdate;
  }
  
  // Remove from DOM
  if (icon.parentNode) {
    icon.parentNode.removeChild(icon);
  }
  
  // Clear references
  delete element.__hateDetectIcon;
  delete icon.__hateDetectShadow;
  
  // Clear any pending score update timers
  if (scoreUpdateTimers.has(element)) {
    clearTimeout(scoreUpdateTimers.get(element));
    scoreUpdateTimers.delete(element);
    console.log('⏰ [HATE-DETECT] Cleared pending score update timer');
  }
  
  console.log('✅ [HATE-DETECT] Icon removed and cleaned up');
}

/**
 * Position icon relative to input field
 */
function positionIcon(icon, element) {
  if (!element || !icon) {
    console.warn('⚠️ [HATE-DETECT] Cannot position icon: missing element or icon');
    return;
  }
  
  const rect = element.getBoundingClientRect();
  console.log('📐 [HATE-DETECT] Element rect:', rect);
  
  if (rect.width === 0 && rect.height === 0) {
    console.log('⚠️ [HATE-DETECT] Element has no size, hiding icon');
    icon.style.display = 'none';
    return;
  }
  
  const top = rect.bottom - 32;
  const left = rect.right - 32;
  
  console.log(`📍 [HATE-DETECT] Positioning icon at top: ${top}px, left: ${left}px`);
  
  icon.style.display = 'block';
  icon.style.position = 'fixed';
  icon.style.top = `${top}px`;
  icon.style.left = `${left}px`;
  
  console.log('✅ [HATE-DETECT] Icon positioned');
}

/**
 * Handle icon click - show hate score and suggestions
 */
let currentScoreData = {};

async function handleIconClick(element, shadow) {
  console.log('👆 [HATE-DETECT] Icon clicked!', element);
  
  // Make sure we keep the icon visible
  isClickingIcon = true;
  
  const text = getEditableText(element);
  console.log('📄 [HATE-DETECT] Extracted text:', text);
  
  if (!text || text.trim().length === 0) {
    console.log('⚠️ [HATE-DETECT] No text to analyze');
    showTooltip(shadow, 'No text to analyze', 'info');
    return;
  }
  
  // Show loading state
  console.log('⏳ [HATE-DETECT] Analyzing text...');
  showTooltip(shadow, 'Analyzing text...', 'loading');
  
  try {
    const result = await apiClient.detectHateSpeech(text);
    console.log('✅ [HATE-DETECT] Analysis complete:', result);
    const hateScore = Math.round((result.confidence || 0) * 100);
    console.log('📊 [HATE-DETECT] Hate score:', hateScore);
    
    // Store score data
    currentScoreData[element] = result;
    
    // Update score badge
    updateScoreBadge(shadow, hateScore, result.is_hate);
    
    // Show detailed tooltip
    const suggestions = generateSuggestions(result);
    showDetailedScore(shadow, hateScore, result.is_hate, suggestions);
    
    // Reset clicking flag after tooltip is shown
    setTimeout(() => {
      isClickingIcon = false;
    }, 500);
    
  } catch (error) {
    console.error('❌ [HATE-DETECT] Error analyzing text:', error);
    console.error('❌ [HATE-DETECT] Error stack:', error.stack);
    showTooltip(shadow, 'Error analyzing text', 'error');
    // Reset clicking flag on error too
    setTimeout(() => {
      isClickingIcon = false;
    }, 500);
  }
}

/**
 * Update the score badge on the icon
 */
function updateScoreBadge(shadow, score, isHate) {
  const badge = shadow.querySelector('.score-badge');
  if (!badge) return;
  
  badge.textContent = score;
  badge.classList.add('show');
  
  // Remove old classes
  badge.classList.remove('high', 'medium', 'low');
  
  // Add appropriate class based on score
  if (score >= 70) {
    badge.classList.add('high');
  } else if (score >= 40) {
    badge.classList.add('medium');
  } else {
    badge.classList.add('low');
  }
}

/**
 * Generate suggestions based on hate speech detection result
 */
function generateSuggestions(result) {
  const suggestions = [];
  
  if (result.is_hate) {
    suggestions.push('Consider rephrasing your message to be more respectful');
    suggestions.push('Avoid using offensive or discriminatory language');
    suggestions.push('Focus on the issue rather than personal attacks');
  } else {
    suggestions.push('Your message looks good!');
    suggestions.push('Keep maintaining a respectful tone');
  }
  
  return suggestions;
}

/**
 * Show detailed score tooltip
 */
function showDetailedScore(shadow, score, isHate, suggestions) {
  // Remove existing tooltip
  const existingTooltip = shadow.querySelector('.score-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  const tooltip = document.createElement('div');
  tooltip.className = 'score-tooltip';
  
  const tooltipStyle = document.createElement('style');
  tooltipStyle.textContent = `
    .score-tooltip {
      position: absolute;
      bottom: 35px;
      right: 0;
      width: 280px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      z-index: 999999;
      animation: slideIn 0.2s ease;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .tooltip-title {
      font-size: 14px;
      font-weight: bold;
      color: #2c3e50;
    }
    
    .close-btn {
      cursor: pointer;
      font-size: 18px;
      color: #7f8c8d;
      line-height: 1;
      padding: 0 4px;
    }
    
    .close-btn:hover {
      color: #2c3e50;
    }
    
    .score-display {
      text-align: center;
      margin-bottom: 12px;
    }
    
    .score-number {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .score-number.high { color: #e74c3c; }
    .score-number.medium { color: #f39c12; }
    .score-number.low { color: #27ae60; }
    
    .score-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .suggestions {
      margin-top: 12px;
    }
    
    .suggestions-title {
      font-size: 12px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
    }
    
    .suggestion-item {
      font-size: 11px;
      color: #555;
      padding: 6px 8px;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 6px;
      line-height: 1.4;
    }
  `;
  shadow.appendChild(tooltipStyle);
  
  const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const status = isHate ? 'Warning' : 'Safe';
  
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <div class="tooltip-title">Hate Speech Score</div>
      <div class="close-btn">×</div>
    </div>
    <div class="score-display">
      <div class="score-number ${scoreClass}">${score}</div>
      <div class="score-label">${status}</div>
    </div>
    <div class="suggestions">
      <div class="suggestions-title">Suggestions:</div>
      ${suggestions.map(s => `<div class="suggestion-item">• ${s}</div>`).join('')}
    </div>
  `;
  
  shadow.appendChild(tooltip);
  
  // Prevent tooltip clicks from blurring the input
  tooltip.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevents input from losing focus
    isClickingIcon = true;
  });
  
  // Close button handler
  const closeBtn = tooltip.querySelector('.close-btn');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    tooltip.remove();
    // Keep the icon visible after closing tooltip
    isClickingIcon = false;
  });
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.remove();
    }
  }, 10000);
}

/**
 * Show simple tooltip
 */
function showTooltip(shadow, message, type = 'info') {
  const existingTooltip = shadow.querySelector('.simple-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  const tooltip = document.createElement('div');
  tooltip.className = 'simple-tooltip';
  
  const tooltipStyle = document.createElement('style');
  tooltipStyle.textContent = `
    .simple-tooltip {
      position: absolute;
      bottom: 35px;
      right: 0;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      animation: fadeIn 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  shadow.appendChild(tooltipStyle);
  
  tooltip.textContent = message;
  shadow.appendChild(tooltip);
  
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.remove();
    }
  }, 2000);
}

/**
 * Schedule automatic score update as user types
 */
let scoreUpdateTimers = new Map();

async function scheduleScoreUpdate(element) {
  if (!element) {
    console.warn('⚠️ [HATE-DETECT] scheduleScoreUpdate called with null element');
    return;
  }
  
  if (!element.__hateDetectIcon) {
    console.warn('⚠️ [HATE-DETECT] Element has no icon yet, skipping score update');
    return;
  }
  
  console.log('⏰ [HATE-DETECT] Scheduling score update...');
  
  // Clear existing timer for this element
  if (scoreUpdateTimers.has(element)) {
    clearTimeout(scoreUpdateTimers.get(element));
    console.log('🔄 [HATE-DETECT] Cleared previous timer');
  }
  
  // Set new timer (debounce)
  const timer = setTimeout(async () => {
    console.log('🔍 [HATE-DETECT] Timer fired, updating score...');
    const text = getEditableText(element);
    console.log('📝 [HATE-DETECT] Current text:', text);
    
    if (!text || text.trim().length === 0) {
      console.log('⏭️ [HATE-DETECT] No text, hiding badge');
      // Reset badge if no text
      const icon = element.__hateDetectIcon;
      if (icon && icon.__hateDetectShadow) {
        const badge = icon.__hateDetectShadow.querySelector('.score-badge');
        if (badge) {
          badge.classList.remove('show');
        }
      }
      return;
    }
    
    try {
      console.log('📡 [HATE-DETECT] Calling API for score update...');
      const result = await apiClient.detectHateSpeech(text);
      console.log('✅ [HATE-DETECT] API response:', result);
      const hateScore = Math.round((result.confidence || 0) * 100);
      console.log('📊 [HATE-DETECT] Calculated score:', hateScore);
      
      // Update the badge
      const icon = element.__hateDetectIcon;
      if (icon && icon.__hateDetectShadow) {
        console.log('🎨 [HATE-DETECT] Updating badge...');
        updateScoreBadge(icon.__hateDetectShadow, hateScore, result.is_hate);
        currentScoreData[element] = result;
        console.log('✅ [HATE-DETECT] Badge updated successfully');
      } else {
        console.warn('⚠️ [HATE-DETECT] Icon or shadow not found for badge update');
      }
    } catch (error) {
      console.error('❌ [HATE-DETECT] Error updating score:', error);
      console.error('❌ [HATE-DETECT] Error stack:', error.stack);
    }
  }, 1000); // Wait 1 second after user stops typing
  
  scoreUpdateTimers.set(element, timer);
  console.log('⏰ [HATE-DETECT] Timer set for 1 second');
}

/**
 * Handle keyboard send (Enter or Ctrl+Enter)
 */
function handleKeyboardSend(event) {
  const isEnter = event.key === 'Enter';
  const isCtrlEnter = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
  
  if (!isEnter && !isCtrlEnter) return;
  
  // Check if we need Ctrl for this platform
  const needsCtrl = isPlatform('twitter') || isPlatform('facebook');
  if (isEnter && needsCtrl && !event.ctrlKey && !event.metaKey) {
    // This might just be a line break
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;
  const text = getEditableText(element);

  processTextForSending(text, element);
}

/**
 * Handle send button click
 */
function handleSendButtonClick(event, editableElement) {
  const text = getEditableText(editableElement);
  
  if (text.trim().length === 0) return;

  event.preventDefault();
  event.stopPropagation();

  processTextForSending(text, editableElement);
}

/**
 * Process text and check for hate speech before sending
 */
async function processTextForSending(text, editableElement) {
  if (text.trim().length === 0) return;

  // Show loading indicator
  showLoadingIndicator(editableElement);

  try {
    const result = await apiClient.detectHateSpeech(text);

    const threshold = getSensitivityThreshold();
    if (!result.is_hate || result.confidence < threshold) {
      // Safe to send
      hideLoadingIndicator(editableElement);
      actuallyAllowSend(editableElement);
    } else {
      // Hate detected - show modal
      hideLoadingIndicator(editableElement);
      showHateDetectionModal(text, editableElement, result);
    }
  } catch (error) {
    console.error('Error processing text:', error);
    hideLoadingIndicator(editableElement);
    actuallyAllowSend(editableElement); // Fail open
  }
}

/**
 * Show hate detection modal
 */
function showHateDetectionModal(originalText, editableElement, detectionResult) {
  // Remove any existing modals
  const existing = document.getElementById('hateDetectionModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'hateDetectionModal';
  modal.innerHTML = `
    <div class="hate-modal-overlay"></div>
    <div class="hate-modal-container">
      <div class="hate-modal-header">
        <h2>⚠️ Potentially Harmful Message</h2>
        <button class="hate-modal-close" aria-label="Close">✕</button>
      </div>
      <div class="hate-modal-content">
        <p class="hate-modal-message">
          This message may be interpreted as ${detectionResult.category || 'hateful'}.
        </p>
        <div class="hate-modal-confidence">
          <span class="confidence-label">Confidence:</span>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${detectionResult.confidence * 100}%"></div>
          </div>
          <span class="confidence-value">${Math.round(detectionResult.confidence * 100)}%</span>
        </div>
        <div class="hate-modal-preview">
          <p class="hate-preview-label">Your message:</p>
          <p class="hate-preview-text">"${originalText}"</p>
        </div>
      </div>
      <div class="hate-modal-actions">
        <button class="hate-btn hate-btn-cancel" data-action="cancel">Cancel</button>
        <button class="hate-btn hate-btn-rewrite" data-action="rewrite">Rewrite Respectfully</button>
        <button class="hate-btn hate-btn-send" data-action="send-anyway">Send Anyway</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Attach event listeners
  const closeBtn = modal.querySelector('.hate-modal-close');
  const cancelBtn = modal.querySelector('[data-action="cancel"]');
  const rewriteBtn = modal.querySelector('[data-action="rewrite"]');
  const sendBtn = modal.querySelector('[data-action="send-anyway"]');
  const overlay = modal.querySelector('.hate-modal-overlay');

  const closeModal = () => {
    modal.remove();
    editableElement.focus();
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  rewriteBtn.addEventListener('click', async () => {
    await handleRewriteRequest(originalText, editableElement, modal);
  });

  sendBtn.addEventListener('click', () => {
    modal.remove();
    actuallyAllowSend(editableElement);
  });
}

/**
 * Handle rewrite request
 */
async function handleRewriteRequest(originalText, editableElement, oldModal) {
  oldModal.remove();

  // Show loading
  const modal = document.createElement('div');
  modal.id = 'hateRewriteModal';
  modal.innerHTML = `
    <div class="hate-modal-overlay"></div>
    <div class="hate-modal-container">
      <div class="hate-modal-header">
        <h2>✏️ Rewrite Your Message</h2>
      </div>
      <div class="hate-modal-content hate-loading">
        <p>Rewriting your message respectfully...</p>
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  try {
    const rewrittenText = await apiClient.rewriteText(originalText);

    // Replace modal content
    modal.querySelector('.hate-modal-content').innerHTML = `
      <div class="hate-modal-comparison">
        <div class="comparison-item">
          <p class="comparison-label">Original:</p>
          <p class="comparison-text original">"${originalText}"</p>
        </div>
        <div class="comparison-arrow">→</div>
        <div class="comparison-item">
          <p class="comparison-label">Rewritten:</p>
          <textarea class="hate-rewrite-textarea" id="hateRewriteTextarea">${rewrittenText}</textarea>
        </div>
      </div>
    `;

    // Update actions
    modal.querySelector('.hate-modal-actions').innerHTML = `
      <button class="hate-btn hate-btn-cancel" data-action="cancel">Cancel</button>
      <button class="hate-btn hate-btn-edit" data-action="edit">Edit More</button>
      <button class="hate-btn hate-btn-accept" data-action="accept">Accept & Send</button>
    `;

    // Attach new listeners
    const closeBtn = modal.querySelector('[data-action="cancel"]');
    const editBtn = modal.querySelector('[data-action="edit"]');
    const acceptBtn = modal.querySelector('[data-action="accept"]');

    const closeModal = () => {
      modal.remove();
      editableElement.focus();
    };

    closeBtn.addEventListener('click', closeModal);
    editBtn.addEventListener('click', () => {
      const textarea = document.getElementById('hateRewriteTextarea');
      textarea.focus();
      textarea.select();
    });

    acceptBtn.addEventListener('click', () => {
      const textarea = document.getElementById('hateRewriteTextarea');
      const finalText = textarea.value;
      modal.remove();
      setEditableText(editableElement, finalText);
      actuallyAllowSend(editableElement);
    });
  } catch (error) {
    console.error('Rewrite error:', error);
    modal.remove();
  }
}

/**
 * Actually allow the message to be sent (bypass interception)
 */
function actuallyAllowSend(editableElement) {
  const sendButton = findSendButton(editableElement);
  
  if (sendButton) {
    // Temporarily disable our listener
    sendButton.__allowSend = true;
    sendButton.click();
    delete sendButton.__allowSend;
  } else {
    // Try keyboard
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      ctrlKey: true
    });
    editableElement.dispatchEvent(event);
  }
}

/**
 * FEATURE 2: Incoming Hate Filtering
 */
function setupIncomingFiltering() {
  const observer = new MutationObserver(() => {
    filterHateContent();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false
  });

  // Initial scan
  filterHateContent();
}

/**
 * Find and filter hateful messages in the DOM
 */
async function filterHateContent() {
  // Get all text nodes and elements that might contain messages
  const messageElements = getMessageElements();

  for (const element of messageElements) {
    if (element.__hateFiltered) continue; // Already filtered

    const text = element.textContent;
    if (!text || text.trim().length === 0) continue;

    // Skip very long texts to avoid performance issues
    if (text.length > 10000) continue;

    try {
      const result = await apiClient.detectHateSpeech(text);

      if (result.is_hate && result.confidence > getSensitivityThreshold()) {
        applyFilterAction(element, result);
        element.__hateFiltered = true;
      }
    } catch (error) {
      console.error('Filter error:', error);
    }
  }
}

/**
 * Get all potential message elements
 */
function getMessageElements() {
  const elements = [];
  const selectors = [
    '[data-testid="tweet"]',
    '[data-testid="primaryColumn"] [role="article"]',
    '.fb-comment-text',
    '.commentText',
    '[role="article"]',
    '.x1hx0egp', // Twitter-specific
    '.comment-block', // Instagram-specific
    '[data-pagelet="FeedUnit"]' // Facebook-specific
  ];

  selectors.forEach(selector => {
    try {
      const found = document.querySelectorAll(selector);
      elements.push(...Array.from(found));
    } catch (e) {
      // Invalid selector
    }
  });

  return Array.from(new Set(elements));
}

/**
 * Apply filter action to hateful content
 */
function applyFilterAction(element, detectionResult) {
  const action = settings.filterAction;

  if (action === 'blur') {
    element.classList.add('hate-blurred');
    element.setAttribute('data-hate-category', detectionResult.category || 'hateful');
    
    // Add click to reveal
    if (!element.__blurClickListener) {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        element.classList.toggle('hate-blurred-revealed');
      });
      element.__blurClickListener = true;
    }
  } else if (action === 'hide') {
    element.style.display = 'none';
    
    // Replace with warning
    const warning = document.createElement('div');
    warning.className = 'hate-content-warning';
    warning.innerHTML = `
      <p>⚠️ This content was hidden due to harmful language</p>
      <button class="hate-reveal-btn">Show anyway</button>
    `;
    
    warning.querySelector('.hate-reveal-btn').addEventListener('click', () => {
      element.style.display = '';
      warning.remove();
    });
    
    element.parentNode.insertBefore(warning, element);
  } else if (action === 'warn') {
    const warning = document.createElement('div');
    warning.className = 'hate-content-alert';
    warning.innerHTML = `
      ⚠️ This message contains ${detectionResult.category || 'potentially harmful'} language
    `;
    element.parentNode.insertBefore(warning, element);
  }
}

/**
 * Get sensitivity threshold (0-1)
 */
function getSensitivityThreshold() {
  const mapping = {
    'low': 0.8,
    'medium': 0.6,
    'high': 0.4
  };
  return mapping[settings.sensitivityLevel] || 0.6;
}

/**
 * Check if current platform is enabled
 */
function isPlatform(name) {
  const url = window.location.href;
  if (name === 'facebook') return url.includes('facebook.com');
  if (name === 'instagram') return url.includes('instagram.com');
  if (name === 'twitter') return url.includes('twitter.com') || url.includes('x.com');
  return false;
}

/**
 * Loading indicator helpers
 */
function showLoadingIndicator(element) {
  const indicator = document.createElement('div');
  indicator.className = 'hate-loading-indicator';
  indicator.innerHTML = '<span class="loading-dot"></span> Checking...';
  indicator.style.position = 'absolute';
  indicator.style.bottom = '-30px';
  
  const parent = element.parentElement;
  parent.style.position = 'relative';
  parent.appendChild(indicator);
  
  element.__loadingIndicator = indicator;
}

function hideLoadingIndicator(element) {
  if (element.__loadingIndicator) {
    element.__loadingIndicator.remove();
    delete element.__loadingIndicator;
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    for (const key in changes) {
      settings[key] = changes[key].newValue;
    }
    console.log('Settings updated:', settings);
  }
});

// Global debug helper for troubleshooting
window.hateDetectDebug = function() {
  console.log('\\n=== HATE DETECT DEBUG INFO ===');
  console.log('Site:', window.location.hostname);
  console.log('URL:', window.location.href);
  
  // Check all possible selectors
  const selectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
    '[role="textbox"]',
    'div[contenteditable]',
    'form textarea',
    'form [contenteditable]',
    '[aria-label*="comment" i]',
    '[placeholder*="comment" i]'
  ];
  
  console.log('\\nElements found by selector:');
  let totalFound = 0;
  selectors.forEach(sel => {
    try {
      const elements = document.querySelectorAll(sel);
      if (elements.length > 0) {
        totalFound += elements.length;
        console.log(`  ✓ ${sel}: ${elements.length} found`);
        elements.forEach((el, i) => {
          const isVisible = el.offsetHeight > 0 && el.offsetWidth > 0;
          console.log(`    [${i}] ${isVisible ? '👁️' : '🚫'}:`, {
            tag: el.tagName,
            contenteditable: el.getAttribute('contenteditable'),
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            placeholder: el.getAttribute('placeholder'),
            visible: isVisible,
            hasIcon: !!el.__hateDetectIcon,
            marked: !!el.__hateDetectMarked,
            hasListener: !!el.__hateCheckListener
          });
        });
      }
    } catch (e) {
      console.log(`  ✗ ${sel}: error - ${e.message}`);
    }
  });
  
  if (totalFound === 0) {
    console.warn('⚠️ NO EDITABLE ELEMENTS FOUND! Extension cannot work.');
    console.log('💡 This might be because:');
    console.log('  1. Page hasn\'t loaded yet - try scrolling or clicking around');
    console.log('  2. Site uses iframe - check inside iframes');
    console.log('  3. Site uses Shadow DOM - elements are hidden');
    console.log('  4. Different selectors needed - inspect the input element');
  }
  
  console.log('\\nExtension state:');
  console.log('  Extension loaded:', typeof getEditableElements === 'function');
  console.log('  Content script loaded:', typeof attachSendListeners === 'function');
  console.log('  API available:', typeof apiClient === 'object');
  console.log('  Focused element:', currentFocusedElement);
  console.log('  Icons in DOM:', document.querySelectorAll('.hate-detect-icon').length);
  console.log('  Marked elements:', document.querySelectorAll('.hate-detect-ready').length);
  console.log('  Active elements:', document.querySelectorAll('.hate-detect-active').length);
  
  console.log('\\n📋 Quick actions:');
  console.log('  Force re-scan: hateDetectFunctions.attachSendListeners()');
  console.log('  Get editables: getEditableElements()');
  console.log('  Manual attach: hateDetectFunctions.markEditableForDetection(element)');
  console.log('  Click on comment box, then run hateDetectDebug() again!');
  console.log('\\nℹ️ If no elements are marked, the extension may have loaded before');
  console.log('   the page content. Try running: hateDetectFunctions.attachSendListeners()\\n');
};

console.log('💡 [HATE-DETECT] Debug helper loaded! Run hateDetectDebug() in console for troubleshooting.');

// Make key functions globally accessible for debugging
window.attachSendListeners = attachSendListeners;
window.markEditableForDetection = markEditableForDetection;
window.injectIconIntoInput = injectIconIntoInput;
window.currentFocusedElement = currentFocusedElement;

window.hateDetectFunctions = {
  attachSendListeners,
  getEditableElements,
  markEditableForDetection,
  injectIconIntoInput
};

