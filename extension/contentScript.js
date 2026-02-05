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

    // Find associated send button
    const sendButton = findSendButton(element);
    if (sendButton && !sendButton.__hateCheckListener) {
      sendButton.addEventListener('click', (e) => handleSendButtonClick(e, element), true);
      sendButton.__hateCheckListener = true;
    }
  });
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

    if (!result.is_hate || result.confidence < 0.5) {
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
