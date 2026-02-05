// API client for communicating with hate detection and rewrite services

class APIClient {
  constructor() {
    this.cacheSize = 100;
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.apiBaseUrl = 'https://api.example.com'; // Replace with actual API
    this.apiKey = ''; // Will be set from settings
  }

  /**
   * Detect hate speech in text
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} Hate detection result
   */
  async detectHateSpeech(text) {
    if (!text || text.trim().length === 0) {
      return {
        is_hate: false,
        confidence: 0,
        category: null,
        cached: false
      };
    }

    // Check cache first
    const cacheKey = `hate:${text}`;
    if (this.cache.has(cacheKey)) {
      const result = this.cache.get(cacheKey);
      result.cached = true;
      return result;
    }

    try {
      // Use local mock detection for now
      // Replace with actual API call in production
      const result = await this._localHateDetection(text);
      
      // Cache the result
      this._cacheResult(cacheKey, result);
      result.cached = false;
      return result;
    } catch (error) {
      console.error('Hate detection error:', error);
      return {
        is_hate: false,
        confidence: 0,
        category: null,
        error: error.message
      };
    }
  }

  /**
   * Rewrite text to remove hate speech
   * @param {string} originalText - The original text
   * @returns {Promise<string>} Rewritten text
   */
  async rewriteText(originalText) {
    if (!originalText || originalText.trim().length === 0) {
      return originalText;
    }

    try {
      // Use local mock rewriting for now
      // Replace with actual API call in production
      return await this._localRewrite(originalText);
    } catch (error) {
      console.error('Rewrite error:', error);
      return originalText;
    }
  }

  /**
   * Local hate detection - mock implementation
   * @private
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} Result
   */
  async _localHateDetection(text) {
    return new Promise((resolve) => {
      // Simulate API latency
      setTimeout(() => {
        const lowerText = text.toLowerCase();
        
        // Mock hate speech patterns
        const hatePatterns = {
          slur: [
            /\b(hate|despise|loathe|detest)\s+(all|all\s+those|everyone)\b/gi,
            /\b(should\s+all\s+(die|burn|suffer)|genocide|exterminate)\b/gi
          ],
          harassment: [
            /you\s+are\s+(stupid|dumb|idiot|retard|moron)/gi,
            /go\s+(kill\s+yourself|kys|die)/gi
          ],
          threat: [
            /i('ll|'m)\s+(kill|hurt|find|beat|stab|shoot)/gi,
            /you\s+(deserve|should)\s+(die|suffer|burn)/gi
          ],
          insult: [
            /\b(ugly|fat|loser|pathetic|worthless)\b/gi
          ]
        };

        let highestConfidence = 0;
        let detectedCategory = null;

        for (const [category, patterns] of Object.entries(hatePatterns)) {
          for (const pattern of patterns) {
            if (pattern.test(lowerText)) {
              // More severe patterns get higher confidence
              const confidence = category === 'threat' ? 0.95 :
                               category === 'slur' ? 0.85 :
                               category === 'harassment' ? 0.75 :
                               0.65;
              
              if (confidence > highestConfidence) {
                highestConfidence = confidence;
                detectedCategory = category;
              }
            }
          }
        }

        resolve({
          is_hate: highestConfidence > 0.5,
          confidence: highestConfidence,
          category: detectedCategory,
          timestamp: Date.now()
        });
      }, 100);
    });
  }

  /**
   * Local text rewriting - mock implementation
   * @private
   * @param {string} text - The original text
   * @returns {Promise<string>} Rewritten text
   */
  async _localRewrite(text) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let rewritten = text;

        // Mock rewriting rules
        const rewrites = {
          'hate all': 'disagree with',
          'should all die': 'should reconsider',
          'you are stupid': 'I disagree with you',
          'go kill yourself': 'please take care of yourself',
          'you deserve to die': 'I hope you improve',
          'i will kill': 'I will stop',
          'you are ugly': 'I have different preferences',
          'you are fat': 'I have different views',
          'you are a loser': 'I think you\'re making mistakes',
          'you are pathetic': 'I disagree with your approach',
          'you are worthless': 'I don\'t see value in that',
        };

        for (const [hate, respectful] of Object.entries(rewrites)) {
          const regex = new RegExp(`\\b${hate}\\b`, 'gi');
          rewritten = rewritten.replace(regex, respectful);
        }

        // If no rewrites were made, add context
        if (rewritten === text) {
          rewritten = `I respectfully disagree. [Original context: ${text.substring(0, 50)}...]`;
        }

        resolve(rewritten);
      }, 150);
    });
  }

  /**
   * Cache a result
   * @private
   * @param {string} key - Cache key
   * @param {Object} value - Value to cache
   */
  _cacheResult(key, value) {
    if (this.cache.size >= this.cacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize
    };
  }
}

// Create global instance
const apiClient = new APIClient();
