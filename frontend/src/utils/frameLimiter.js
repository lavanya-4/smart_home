/**
 * Frame Rate Limiting Utilities
 * 
 * Reusable utilities for implementing frame rate limiting
 * in video feed components to optimize performance.
 */

/**
 * Create a frame rate limiter function
 * 
 * @param {number} maxFps - Maximum frames per second
 * @returns {Function} shouldUpdate - Function that returns true if frame should be updated
 * 
 * @example
 * const shouldUpdate = createFrameLimiter(5);
 * if (shouldUpdate()) {
 *   updateFrame(newFrame);
 * }
 */
export function createFrameLimiter(maxFps = 5) {
  const minInterval = 1000 / maxFps;
  let lastUpdateTime = 0;
  
  return function shouldUpdate() {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    
    if (timeSinceLastUpdate > minInterval) {
      lastUpdateTime = now;
      return true;
    }
    
    return false;
  };
}

/**
 * Calculate time until next frame can be updated
 * 
 * @param {number} lastUpdateTime - Timestamp of last update
 * @param {number} maxFps - Maximum frames per second
 * @returns {number} milliseconds until next frame can be updated
 * 
 * @example
 * const waitTime = getTimeUntilNextFrame(lastFrameTime, 5);
 * setTimeout(updateFrame, waitTime);
 */
export function getTimeUntilNextFrame(lastUpdateTime, maxFps = 5) {
  const minInterval = 1000 / maxFps;
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;
  const timeUntilNext = Math.max(0, minInterval - timeSinceLastUpdate);
  
  return timeUntilNext;
}

/**
 * Calculate actual frame rate from timestamps
 * 
 * @param {number[]} timestamps - Array of frame timestamps
 * @returns {number} actual frames per second
 * 
 * @example
 * const fps = calculateActualFPS([1000, 1200, 1400, 1600]);
 * console.log(`Actual FPS: ${fps}`);
 */
export function calculateActualFPS(timestamps) {
  if (timestamps.length < 2) return 0;
  
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
  return Math.round(1000 / avgInterval);
}

/**
 * FrameLimiter class for managing frame rate limiting
 * 
 * @example
 * const limiter = new FrameLimiter(5);
 * 
 * function onNewFrame(frame) {
 *   if (limiter.shouldUpdate()) {
 *     displayFrame(frame);
 *   }
 * }
 */
export class FrameLimiter {
  constructor(maxFps = 5) {
    this.maxFps = maxFps;
    this.minInterval = 1000 / maxFps;
    this.lastUpdateTime = 0;
    this.frameCount = 0;
    this.droppedFrames = 0;
  }
  
  /**
   * Check if frame should be updated
   * @returns {boolean}
   */
  shouldUpdate() {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    this.frameCount++;
    
    if (timeSinceLastUpdate > this.minInterval) {
      this.lastUpdateTime = now;
      return true;
    }
    
    this.droppedFrames++;
    return false;
  }
  
  /**
   * Reset limiter state
   */
  reset() {
    this.lastUpdateTime = 0;
    this.frameCount = 0;
    this.droppedFrames = 0;
  }
  
  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      maxFps: this.maxFps,
      totalFrames: this.frameCount,
      droppedFrames: this.droppedFrames,
      displayedFrames: this.frameCount - this.droppedFrames,
      dropRate: this.frameCount > 0 
        ? ((this.droppedFrames / this.frameCount) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
  
  /**
   * Update max FPS
   * @param {number} newMaxFps
   */
  setMaxFps(newMaxFps) {
    this.maxFps = newMaxFps;
    this.minInterval = 1000 / newMaxFps;
  }
  
  /**
   * Get time until next frame
   * @returns {number}
   */
  getTimeUntilNext() {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    return Math.max(0, this.minInterval - timeSinceLastUpdate);
  }
}

/**
 * Adaptive frame rate limiter that adjusts based on performance
 * 
 * @example
 * const limiter = new AdaptiveFrameLimiter({ targetFps: 5, minFps: 2, maxFps: 10 });
 * 
 * function onNewFrame(frame) {
 *   const renderTime = performance.now();
 *   
 *   if (limiter.shouldUpdate()) {
 *     displayFrame(frame);
 *     const duration = performance.now() - renderTime;
 *     limiter.recordRenderTime(duration);
 *   }
 * }
 */
export class AdaptiveFrameLimiter extends FrameLimiter {
  constructor({ targetFps = 5, minFps = 2, maxFps = 10 } = {}) {
    super(targetFps);
    this.targetFps = targetFps;
    this.minFps = minFps;
    this.maxFps = maxFps;
    this.renderTimes = [];
    this.maxRenderTimeSamples = 10;
  }
  
  /**
   * Record render time to adjust frame rate
   * @param {number} renderTime - Time in milliseconds
   */
  recordRenderTime(renderTime) {
    this.renderTimes.push(renderTime);
    
    if (this.renderTimes.length > this.maxRenderTimeSamples) {
      this.renderTimes.shift();
    }
    
    this.adjustFrameRate();
  }
  
  /**
   * Automatically adjust frame rate based on performance
   */
  adjustFrameRate() {
    if (this.renderTimes.length < this.maxRenderTimeSamples) return;
    
    const avgRenderTime = this.renderTimes.reduce((a, b) => a + b) / this.renderTimes.length;
    const targetFrameTime = 1000 / this.targetFps;
    
    // If rendering takes longer than frame time, reduce FPS
    if (avgRenderTime > targetFrameTime * 0.8) {
      const newFps = Math.max(this.minFps, this.maxFps - 1);
      this.setMaxFps(newFps);
    }
    // If rendering is fast, increase FPS
    else if (avgRenderTime < targetFrameTime * 0.5) {
      const newFps = Math.min(this.maxFps, this.maxFps + 1);
      this.setMaxFps(newFps);
    }
  }
}

/**
 * Constants for common frame rates
 */
export const FRAME_RATES = {
  VERY_LOW: 1,     // 1 fps - static monitoring
  LOW: 2,          // 2 fps - background surveillance
  NORMAL: 5,       // 5 fps - standard monitoring (recommended)
  MEDIUM: 10,      // 10 fps - active monitoring
  HIGH: 15,        // 15 fps - video calls
  VERY_HIGH: 30,   // 30 fps - smooth video (not recommended for web)
  CINEMA: 24,      // 24 fps - cinematic
  BROADCAST: 30,   // 30 fps - TV broadcast
  GAMING: 60,      // 60 fps - gaming (not recommended for IoT)
};

/**
 * Get recommended frame rate based on use case
 * 
 * @param {string} useCase - Use case type
 * @returns {number} recommended FPS
 * 
 * @example
 * const fps = getRecommendedFPS('security');
 * console.log(`Recommended: ${fps} fps`);
 */
export function getRecommendedFPS(useCase) {
  const recommendations = {
    'static': FRAME_RATES.VERY_LOW,
    'surveillance': FRAME_RATES.LOW,
    'monitoring': FRAME_RATES.NORMAL,
    'security': FRAME_RATES.NORMAL,
    'video-call': FRAME_RATES.HIGH,
    'presentation': FRAME_RATES.MEDIUM,
    'demo': FRAME_RATES.MEDIUM,
    'streaming': FRAME_RATES.HIGH,
  };
  
  return recommendations[useCase] || FRAME_RATES.NORMAL;
}

/**
 * Calculate bandwidth savings from frame rate limiting
 * 
 * @param {number} originalFps - Original FPS without limiting
 * @param {number} limitedFps - Limited FPS
 * @param {number} frameSize - Average frame size in KB
 * @returns {Object} bandwidth statistics
 * 
 * @example
 * const savings = calculateBandwidthSavings(20, 5, 50);
 * console.log(`Saving ${savings.percentSaved}% bandwidth`);
 */
export function calculateBandwidthSavings(originalFps, limitedFps, frameSize) {
  const originalBandwidth = originalFps * frameSize; // KB/s
  const limitedBandwidth = limitedFps * frameSize;   // KB/s
  const saved = originalBandwidth - limitedBandwidth;
  const percentSaved = ((saved / originalBandwidth) * 100).toFixed(1);
  
  return {
    originalBandwidth: originalBandwidth.toFixed(2) + ' KB/s',
    limitedBandwidth: limitedBandwidth.toFixed(2) + ' KB/s',
    saved: saved.toFixed(2) + ' KB/s',
    percentSaved: percentSaved + '%',
    framesDropped: originalFps - limitedFps,
    efficiency: limitedFps / originalFps
  };
}

export default {
  createFrameLimiter,
  getTimeUntilNextFrame,
  calculateActualFPS,
  FrameLimiter,
  AdaptiveFrameLimiter,
  FRAME_RATES,
  getRecommendedFPS,
  calculateBandwidthSavings,
};
