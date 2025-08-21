/**
 * 本地存储工具
 */

export interface StorageOptions {
  prefix?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

/**
 * 存储管理器
 */
export class Storage {
  private prefix: string;
  private serialize: (value: any) => string;
  private deserialize: (value: string) => any;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || '';
    this.serialize = options.serialize || JSON.stringify;
    this.deserialize = options.deserialize || JSON.parse;
  }

  /**
   * 获取完整的键名
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  /**
   * 设置值
   */
  set(key: string, value: any): void {
    try {
      const serializedValue = this.serialize(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  /**
   * 获取值
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }
      return this.deserialize(item);
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 删除值
   */
  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  /**
   * 清空所有带前缀的存储
   */
  clear(): void {
    if (!this.prefix) {
      localStorage.clear();
      return;
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${this.prefix}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    const keys: string[] = [];
    const prefixLength = this.prefix ? this.prefix.length + 1 : 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (this.prefix) {
          if (key.startsWith(`${this.prefix}:`)) {
            keys.push(key.substring(prefixLength));
          }
        } else {
          keys.push(key);
        }
      }
    }

    return keys;
  }
}

/**
 * 默认存储实例
 */
export const storage = new Storage();