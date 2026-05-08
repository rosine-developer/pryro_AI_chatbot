import { logger } from './logger';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = {
      failureThreshold: options?.failureThreshold || 5,
      resetTimeout: options?.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options?.monitoringPeriod || 10000, // 10 seconds
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure > this.options.resetTimeout) {
        logger.info('Circuit breaker transitioning to half-open', {
          name: this.name,
        });
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is open for ${this.name}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;

      // After 3 successful calls in half-open, close the circuit
      if (this.successCount >= 3) {
        logger.info('Circuit breaker closing after successful recovery', {
          name: this.name,
        });
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn('Circuit breaker failure recorded', {
      name: this.name,
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
    });

    if (this.state === 'half-open') {
      // If we fail in half-open state, go back to open
      logger.warn('Circuit breaker opening after half-open failure', {
        name: this.name,
      });
      this.state = 'open';
      this.successCount = 0;
    } else if (this.failureCount >= this.options.failureThreshold) {
      // If we exceed threshold in closed state, open the circuit
      logger.error('Circuit breaker opening due to failure threshold', {
        name: this.name,
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold,
      });
      this.state = 'open';
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;

    logger.info('Circuit breaker reset', { name: this.name });
  }

  /**
   * Force open (for testing/maintenance)
   */
  forceOpen(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();

    logger.warn('Circuit breaker forced open', { name: this.name });
  }

  /**
   * Force close (for testing/maintenance)
   */
  forceClose(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;

    logger.info('Circuit breaker forced closed', { name: this.name });
  }
}

// Create circuit breakers for external services
export const groqAPICircuitBreaker = new CircuitBreaker('groq-api', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
});

export const databaseCircuitBreaker = new CircuitBreaker('database', {
  failureThreshold: 10,
  resetTimeout: 30000, // 30 seconds
});

export const redisCircuitBreaker = new CircuitBreaker('redis', {
  failureThreshold: 10,
  resetTimeout: 30000, // 30 seconds
});
