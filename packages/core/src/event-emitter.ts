/**
 * 事件发射器
 */

type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Record<string, EventListener[]> = {};

  /**
   * 监听事件
   */
  on(event: string, listener: EventListener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * 监听事件（只触发一次）
   */
  once(event: string, listener: EventListener): this {
    const onceListener = (...args: any[]) => {
      this.off(event, onceListener);
      listener(...args);
    };
    return this.on(event, onceListener);
  }

  /**
   * 移除事件监听
   */
  off(event: string, listener?: EventListener): this {
    if (!this.events[event]) {
      return this;
    }

    if (!listener) {
      delete this.events[event];
      return this;
    }

    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }

    if (this.events[event].length === 0) {
      delete this.events[event];
    }

    return this;
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }

    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });

    return true;
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    return this.events[event] ? this.events[event].length : 0;
  }

  /**
   * 移除所有事件监听
   */
  removeAllListeners(): this {
    this.events = {};
    return this;
  }
}