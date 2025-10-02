/**
 * Message Reliability Helper
 * Provides utilities for reliable message handling and deduplication
 */

export class MessageReliabilityHelper {
  constructor() {
    this.messageQueue = new Map(); // Queue for messages pending send
    this.messageTimeouts = new Map(); // Track message timeouts
    this.retryAttempts = new Map(); // Track retry attempts per message
    this.maxRetries = 3;
    this.messageTimeout = 30000; // 30 seconds
  }

  /**
   * Generate a unique temporary message ID
   */
  generateTempId() {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize message ID to string
   */
  normalizeMessageId(id) {
    if (!id) return null;
    
    if (typeof id === 'string') {
      return id;
    }
    
    // Handle MongoDB ObjectId
    if (typeof id === 'object' && id.timestamp) {
      if (id.timestamp !== undefined && id.machine !== undefined && id.pid !== undefined && id.increment !== undefined) {
        return `${id.timestamp.toString(16).padStart(8, '0')}${id.machine.toString(16).padStart(6, '0')}${(id.pid & 0xFFFF).toString(16).padStart(4, '0')}${id.increment.toString(16).padStart(6, '0')}`;
      }
    }
    
    return String(id);
  }

  /**
   * Normalize message object
   */
  normalizeMessage(message) {
    if (!message || typeof message !== 'object') {
      return message;
    }
    
    return {
      ...message,
      id: this.normalizeMessageId(message.messageId || message.id),
      senderId: this.normalizeMessageId(message.senderId),
      receiverId: this.normalizeMessageId(message.receiverId),
      content: message.message || message.content,
      timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
      status: message.status || 'delivered'
    };
  }

  /**
   * Add message to queue with timeout
   */
  queueMessage(tempId, messageData, onTimeout) {
    this.messageQueue.set(tempId, messageData);
    
    const timeoutId = setTimeout(() => {
      this.messageQueue.delete(tempId);
      this.messageTimeouts.delete(tempId);
      if (onTimeout) onTimeout(tempId);
    }, this.messageTimeout);
    
    this.messageTimeouts.set(tempId, timeoutId);
  }

  /**
   * Complete message send (remove from queue)
   */
  completeMessage(tempId) {
    this.messageQueue.delete(tempId);
    this.retryAttempts.delete(tempId);
    
    const timeoutId = this.messageTimeouts.get(tempId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.messageTimeouts.delete(tempId);
    }
  }

  /**
   * Check if message can be retried
   */
  canRetryMessage(tempId) {
    const attempts = this.retryAttempts.get(tempId) || 0;
    return attempts < this.maxRetries;
  }

  /**
   * Increment retry attempt
   */
  incrementRetryAttempt(tempId) {
    const attempts = this.retryAttempts.get(tempId) || 0;
    this.retryAttempts.set(tempId, attempts + 1);
  }

  /**
   * Clean up expired messages and timeouts
   */
  cleanup() {
    // This is called periodically to clean up any stale data
    const now = Date.now();
    for (const [tempId, messageData] of this.messageQueue.entries()) {
      const messageAge = now - new Date(messageData.timestamp).getTime();
      if (messageAge > this.messageTimeout * 2) { // Double timeout for cleanup
        this.completeMessage(tempId);
      }
    }
  }
}

export default new MessageReliabilityHelper();