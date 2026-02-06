// Content script for DOM interaction and hate speech detection

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
const HATE_SCORE_UNAVAILABLE = 'No text to score';
const HATE_SCORE_PENDING = 'Analyzing...';
const HATE_SCORE_ERROR = 'Score unavailable';

function injectIndicatorStyles() {
  if (document.getElementById('hateDetectStyles')) return;

  const style = document.createElement('style');
  style.id = 'hateDetectStyles';
  style.textContent = `
    .hate-detect-ready {
      outline: 1px solid rgba(231, 76, 60, 0.35);
      outline-offset: 2px;
    }

    .hate-detect-active {
      outline: 2px solid rgba(231, 76, 60, 0.8);
      outline-offset: 2px;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
    }

    .hate-detect-badge {
      position: absolute;
      top: -10px;
      right: -10px;
      background: #e74c3c;
      color: #ffffff;
      font-size: 10px;
      line-height: 1;
      padding: 4px 6px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }

    .hate-detect-badge.clickable {
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
    }

    .hate-detect-tooltip {
      position: absolute;
      top: 20px;
      right: 0;
      background: #ffffff;
      color: #2c3e50;
      border: 1px solid rgba(231, 76, 60, 0.25);
      border-radius: 8px;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
      padding: 8px 10px;
      font-size: 11px;
      min-width: 140px;
      max-width: 200px;
      z-index: 2147483647;
    }

    .hate-detect-tooltip .score-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .hate-detect-tooltip .score-title {
      font-weight: 600;
      color: #e74c3c;
      margin-bottom: 4px;
    }
  `;

  document.head.appendChild(style);
}

// Load settings from storage
chrome.storage.sync.get(null, (data) => {
  if (data && Object.keys(data).length > 0) {
    settings = { ...settings, ...data };
  }
  initializeExtension();
});

/**
 * Initialize the extension
 */
function initializeExtension() {
  console.log('Hate Speech Prevention Extension loaded');
  
  if (settings.feature1Enabled) {
    setupPreSendDetection();
  }
  
  if (settings.feature2Enabled) {
    setupIncomingFiltering();
  }
}

/**
 * FEATURE 1: Pre-Send Hate Detection
 */
function setupPreSendDetection() {
  injectIndicatorStyles();

  // Monitor for editable elements
  const observer = new MutationObserver(() => {
    attachSendListeners();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial setup
  attachSendListeners();
}

/**
 * Attach listeners to send buttons and editable elements
 */
function attachSendListeners() {
  const editables = getEditableElements();
  
  editables.forEach(element => {
    if (element.__hateCheckListener) return; // Already attached
    
    // Attach keyboard listener for Enter/Ctrl+Enter
    element.addEventListener('keydown', handleKeyboardSend, true);
    element.__hateCheckListener = true;

    markEditableForDetection(element);

    // Find associated send button
    const sendButton = findSendButton(element);
    if (sendButton && !sendButton.__hateCheckListener) {
      sendButton.addEventListener('click', (e) => handleSendButtonClick(e, element), true);
      sendButton.__hateCheckListener = true;
    }
  });
}

function markEditableForDetection(element) {
  if (!element || element.__hateDetectMarked) return;

  element.classList.add('hate-detect-ready');

  element.addEventListener('focus', handleEditableFocus, true);
  element.addEventListener('blur', handleEditableBlur, true);
  element.addEventListener('input', handleEditableInput, true);
  element.__hateDetectMarked = true;
}

function handleEditableFocus(event) {
  const element = event.target;
  element.classList.add('hate-detect-active');
  showDetectionBadge(element);
  scheduleScoreUpdate(element);
}

function handleEditableBlur(event) {
  const element = event.target;
  element.classList.remove('hate-detect-active');
  removeDetectionBadge(element);
  clearScoreTimer(element);
}

function handleEditableInput(event) {
  scheduleScoreUpdate(event.target);
}

function showDetectionBadge(element) {
  if (!element || element.__hateDetectBadge) return;

  const parent = element.parentElement;
  if (!parent) return;

  const computed = window.getComputedStyle(parent);
  if (computed.position === 'static') {
    parent.__hatePrevPosition = parent.style.position || '';
    parent.style.position = 'relative';
  }

  const badge = document.createElement('span');
  badge.className = 'hate-detect-badge clickable';
  badge.textContent = HATE_BADGE_TEXT;
  badge.setAttribute('title', 'Hate Speech Score');
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleScoreTooltip(element);
  });
  parent.appendChild(badge);
  element.__hateDetectBadge = badge;
}

function removeDetectionBadge(element) {
  if (!element || !element.__hateDetectBadge) return;

  const badge = element.__hateDetectBadge;
  if (element.__hateDetectTooltip) {
    element.__hateDetectTooltip.remove();
    delete element.__hateDetectTooltip;
  }
  const parent = badge.parentElement;
  badge.remove();
  delete element.__hateDetectBadge;

  if (parent && parent.__hatePrevPosition !== undefined) {
    parent.style.position = parent.__hatePrevPosition;
    delete parent.__hatePrevPosition;
  }
}

function toggleScoreTooltip(element) {
  if (!element.__hateDetectBadge) return;

  if (element.__hateDetectTooltip) {
    element.__hateDetectTooltip.remove();
    delete element.__hateDetectTooltip;
    return;
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'hate-detect-tooltip';
  tooltip.innerHTML = renderScoreTooltip(element.__hateDetectScore);
  element.__hateDetectBadge.appendChild(tooltip);
  element.__hateDetectTooltip = tooltip;

  if (!element.__hateDetectScore) {
    updateScoreForElement(element);
  }
}

function renderScoreTooltip(score) {
  if (!score) {
    return `
      <div class="score-title">Detection</div>
      <div>${HATE_SCORE_UNAVAILABLE}</div>
    `;
  }

  if (score.status === 'pending') {
    return `
      <div class="score-title">Detection</div>
      <div>${HATE_SCORE_PENDING}</div>
    `;
  }

  if (score.status === 'error') {
    return `
      <div class="score-title">Detection</div>
      <div>${HATE_SCORE_ERROR}</div>
    `;
  }

  const percent = Math.round((score.confidence || 0) * 100);
  const category = score.category || 'neutral';
  return `
    <div class="score-title">Detection</div>
    <div class="score-line"><span>Score</span><strong>${percent}%</strong></div>
    <div class="score-line"><span>Category</span><strong>${category}</strong></div>
  `;
}

function scheduleScoreUpdate(element) {
  if (!element) return;
  clearScoreTimer(element);
  element.__hateDetectScoreTimer = setTimeout(() => {
    updateScoreForElement(element);
  }, 400);
}

function clearScoreTimer(element) {
  if (element && element.__hateDetectScoreTimer) {
    clearTimeout(element.__hateDetectScoreTimer);
    delete element.__hateDetectScoreTimer;
  }
}

async function updateScoreForElement(element) {
  if (!element) return;
  const text = getEditableText(element);

  if (!text || text.trim().length === 0) {
    element.__hateDetectScore = null;
    updateTooltipContent(element);
    return;
  }

  element.__hateDetectScore = { status: 'pending' };
  updateTooltipContent(element);

  try {
    const result = await apiClient.detectHateSpeech(text);
    element.__hateDetectScore = {
      status: 'ok',
      confidence: result.confidence,
      category: result.category,
      isHate: result.is_hate
    };
  } catch (error) {
    element.__hateDetectScore = { status: 'error' };
  }

  updateTooltipContent(element);
}

function updateTooltipContent(element) {
  if (!element || !element.__hateDetectTooltip) return;
  element.__hateDetectTooltip.innerHTML = renderScoreTooltip(element.__hateDetectScore);
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
