/**
 * 网络类型枚举
 */
export enum NetworkType {
  UNKNOWN = 'unknown',
  ETHERNET = 'ethernet',
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  CELLULAR_2G = '2g',
  CELLULAR_3G = '3g',
  CELLULAR_4G = '4g',
  CELLULAR_5G = '5g',
  OFFLINE = 'offline'
}

/**
 * 网络速度等级枚举
 */
export enum NetworkSpeed {
  UNKNOWN = 'unknown',
  SLOW = 'slow',        // < 0.5 Mbps
  MODERATE = 'moderate', // 0.5 - 2 Mbps
  GOOD = 'good',        // 2 - 10 Mbps
  EXCELLENT = 'excellent' // > 10 Mbps
}

/**
 * 网络信息接口
 */
export interface NetworkInfo {
  online: boolean;
  type: NetworkType;
  speed: NetworkSpeed;
  downlink?: number;     // Mbps
  rtt?: number;          // ms (Round Trip Time)
  effectiveType?: string; // 'slow-2g', '2g', '3g', or '4g'
  saveData?: boolean;    // 是否启用了数据节省模式
}

/**
 * 检测浏览器是否联网
 * @returns 当前网络连接状态
 */
export function isOnline(): boolean {
  // 确保代码在浏览器环境中运行
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  // 在非浏览器环境中默认返回true
  return true;
}

/**
 * 获取当前网络类型
 * @returns 网络类型
 */
export function getNetworkType(): NetworkType {
  if (!isOnline()) {
    return NetworkType.OFFLINE;
  }

  // 检查是否支持 Network Information API
  const connection = getNetworkConnection();
  if (!connection) {
    return NetworkType.UNKNOWN;
  }

  // 根据 effectiveType 判断网络类型
  if (connection.type) {
    switch (connection.type) {
      case 'ethernet':
        return NetworkType.ETHERNET;
      case 'wifi':
        return NetworkType.WIFI;
      case 'cellular':
        // 如果有 effectiveType，可以更精确地判断移动网络类型
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              return NetworkType.CELLULAR_2G;
            case '3g':
              return NetworkType.CELLULAR_3G;
            case '4g':
              return NetworkType.CELLULAR_4G;
            default:
              return NetworkType.CELLULAR;
          }
        }
        return NetworkType.CELLULAR;
      default:
        return NetworkType.UNKNOWN;
    }
  }

  // 如果没有 type 但有 effectiveType，根据 effectiveType 判断
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return NetworkType.CELLULAR_2G;
      case '3g':
        return NetworkType.CELLULAR_3G;
      case '4g':
        return NetworkType.CELLULAR_4G;
      default:
        return NetworkType.UNKNOWN;
    }
  }

  // 5G 检测 (基于下行速度和 RTT)
  if (connection.downlink && connection.rtt) {
    if (connection.downlink >= 50 && connection.rtt < 30) {
      return NetworkType.CELLULAR_5G;
    }
  }

  return NetworkType.UNKNOWN;
}

/**
 * 获取网络速度等级
 * @returns 网络速度等级
 */
export function getNetworkSpeed(): NetworkSpeed {
  if (!isOnline()) {
    return NetworkSpeed.UNKNOWN;
  }

  const connection = getNetworkConnection();
  if (!connection || !connection.downlink) {
    return NetworkSpeed.UNKNOWN;
  }

  const downlink = connection.downlink; // Mbps

  if (downlink < 0.5) {
    return NetworkSpeed.SLOW;
  } else if (downlink < 2) {
    return NetworkSpeed.MODERATE;
  } else if (downlink < 10) {
    return NetworkSpeed.GOOD;
  } else {
    return NetworkSpeed.EXCELLENT;
  }
}

/**
 * 获取完整的网络信息
 * @returns 网络信息对象
 */
export function getNetworkInfo(): NetworkInfo {
  const online = isOnline();
  const type = getNetworkType();
  const speed = getNetworkSpeed();

  const info: NetworkInfo = {
    online,
    type,
    speed
  };

  // 添加更多详细信息（如果可用）
  const connection = getNetworkConnection();
  if (connection) {
    if (typeof connection.downlink === 'number') {
      info.downlink = connection.downlink;
    }
    if (typeof connection.rtt === 'number') {
      info.rtt = connection.rtt;
    }
    if (connection.effectiveType) {
      info.effectiveType = connection.effectiveType;
    }
    if (typeof connection.saveData === 'boolean') {
      info.saveData = connection.saveData;
    }
  }

  return info;
}

/**
 * 获取网络连接对象（Network Information API）
 * @returns 网络连接对象或 null
 */
function getNetworkConnection(): any {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return (
    // @ts-ignore: Navigator.connection 是实验性 API
    navigator.connection ||
    // @ts-ignore
    navigator.mozConnection ||
    // @ts-ignore
    navigator.webkitConnection ||
    null
  );
}

/**
 * 测量网络下载速度
 * @param sampleSize 测试文件大小（字节）
 * @param timeoutMs 超时时间（毫秒）
 * @returns Promise<number> 下载速度（Mbps）
 */
export async function measureDownloadSpeed(
  sampleSize: number = 1000000, // 默认 1MB
  timeoutMs: number = 10000 // 默认 10 秒
): Promise<number> {
  return new Promise((resolve, reject) => {
    // 创建一个随机 URL 避免缓存
    const url = `https://speed.cloudflare.com/__down?bytes=${sampleSize}&cachebust=${Date.now()}`;
    const startTime = Date.now();

    // 设置超时
    const timeoutId = setTimeout(() => {
      reject(new Error('Network speed test timed out'));
    }, timeoutMs);

    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const fileSizeMB = sampleSize / 1000000;
        const speedMbps = (fileSizeMB * 8) / durationSeconds; // 转换为 Mbps

        resolve(speedMbps);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * 测量网络延迟（RTT）
 * @param url 测试 URL
 * @param samples 测试次数
 * @returns Promise<number> 平均延迟（毫秒）
 */
export async function measureNetworkLatency(
  url: string = 'https://www.cloudflare.com/cdn-cgi/trace',
  samples: number = 5
): Promise<number> {
  const results: number[] = [];

  for (let i = 0; i < samples; i++) {
    const startTime = Date.now();
    try {
      // 添加随机参数避免缓存
      const cacheBust = `${url}${url.includes('?') ? '&' : '?'}cachebust=${Date.now()}`;
      await fetch(cacheBust, { method: 'HEAD' });
      const latency = Date.now() - startTime;
      results.push(latency);
    } catch (error) {
      console.error('Error measuring latency:', error);
    }

    // 在测试之间等待一小段时间
    if (i < samples - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // 计算平均延迟（如果有结果）
  if (results.length === 0) {
    throw new Error('Failed to measure network latency');
  }

  // 排除最高和最低值，计算平均值
  if (results.length > 2) {
    results.sort((a, b) => a - b);
    results.shift(); // 移除最低值
    results.pop();   // 移除最高值
  }

  return results.reduce((sum, latency) => sum + latency, 0) / results.length;
}

/**
 * 创建一个网络状态监听器
 * @param onlineCallback 联网时的回调函数
 * @param offlineCallback 断网时的回调函数
 * @returns 一个包含移除监听器方法的对象
 */
export function createNetworkListener(
  onlineCallback?: () => void,
  offlineCallback?: () => void
): { remove: () => void } {
  // 确保代码在浏览器环境中运行
  if (typeof window === 'undefined') {
    return { remove: () => { } };
  }

  const handleOnline = () => {
    if (onlineCallback) onlineCallback();
  };

  const handleOffline = () => {
    if (offlineCallback) offlineCallback();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return {
    remove: () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

/**
 * 网络状态变化监听器类型
 */
export type NetworkStatusListener = (info: NetworkInfo) => void;

/**
 * 增强的网络状态监测类
 */
export class NetworkMonitor {
  private _networkInfo: NetworkInfo;
  private _listeners: Array<NetworkStatusListener> = [];
  private _cleanup: (() => void) | null = null;
  private _connectionChangeHandler: (() => void) | null = null;
  private _pollingInterval: number | null = null;
  private _pollingId: any = null;

  constructor(pollingIntervalMs: number = 5000) {
    this._networkInfo = getNetworkInfo();
    this._setupListeners();

    // 如果提供了轮询间隔，则启用轮询
    if (pollingIntervalMs > 0) {
      this._pollingInterval = pollingIntervalMs;
      this._startPolling();
    }
  }

  /**
   * 获取当前网络状态
   */
  get isOnline(): boolean {
    return this._networkInfo.online;
  }

  /**
   * 获取当前网络类型
   */
  get networkType(): NetworkType {
    return this._networkInfo.type;
  }

  /**
   * 获取当前网络速度等级
   */
  get networkSpeed(): NetworkSpeed {
    return this._networkInfo.speed;
  }

  /**
   * 获取完整的网络信息
   */
  get networkInfo(): NetworkInfo {
    return { ...this._networkInfo };
  }

  /**
   * 添加网络状态变化监听器
   * @param listener 监听器函数
   * @returns 移除监听器的函数
   */
  addListener(listener: NetworkStatusListener): () => void {
    this._listeners.push(listener);
    // 立即触发一次当前状态
    listener(this._networkInfo);

    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * 手动刷新网络信息
   * @returns 最新的网络信息
   */
  refreshNetworkInfo(): NetworkInfo {
    const previousInfo = this._networkInfo;
    this._networkInfo = getNetworkInfo();

    // 如果网络信息发生变化，通知监听器
    if (this._hasNetworkInfoChanged(previousInfo, this._networkInfo)) {
      this._notifyListeners();
    }

    return this._networkInfo;
  }

  /**
   * 测量当前网络速度
   * @returns Promise<{downloadSpeed: number, latency: number}> 下载速度(Mbps)和延迟(ms)
   */
  async measureNetworkPerformance(): Promise<{ downloadSpeed: number; latency: number }> {
    try {
      const [downloadSpeed, latency] = await Promise.all([
        measureDownloadSpeed(),
        measureNetworkLatency()
      ]);

      return { downloadSpeed, latency };
    } catch (error) {
      console.error('Error measuring network performance:', error);
      throw error;
    }
  }

  /**
   * 设置网络状态监听
   */
  private _setupListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // 监听在线/离线状态变化
    const networkListener = createNetworkListener(
      // 联网回调
      () => {
        const newInfo = getNetworkInfo();
        if (this._hasNetworkInfoChanged(this._networkInfo, newInfo)) {
          this._networkInfo = newInfo;
          this._notifyListeners();
        }
      },
      // 断网回调
      () => {
        const newInfo = getNetworkInfo();
        if (this._hasNetworkInfoChanged(this._networkInfo, newInfo)) {
          this._networkInfo = newInfo;
          this._notifyListeners();
        }
      }
    );

    // 监听 connection 对象的变化（如果可用）
    const connection = getNetworkConnection();
    if (connection) {
      this._connectionChangeHandler = () => {
        const newInfo = getNetworkInfo();
        if (this._hasNetworkInfoChanged(this._networkInfo, newInfo)) {
          this._networkInfo = newInfo;
          this._notifyListeners();
        }
      };

      // 监听 change 事件
      try {
        connection.addEventListener('change', this._connectionChangeHandler);
      } catch (error) {
        console.error('Error adding connection change listener:', error);
      }
    }

    this._cleanup = () => {
      networkListener.remove();

      if (connection && this._connectionChangeHandler) {
        try {
          connection.removeEventListener('change', this._connectionChangeHandler);
        } catch (error) {
          console.error('Error removing connection change listener:', error);
        }
      }

      this._stopPolling();
    };
  }

  /**
   * 启动轮询
   */
  private _startPolling(): void {
    if (this._pollingInterval && !this._pollingId) {
      this._pollingId = setInterval(() => {
        this.refreshNetworkInfo();
      }, this._pollingInterval);
    }
  }

  /**
   * 停止轮询
   */
  private _stopPolling(): void {
    if (this._pollingId) {
      clearInterval(this._pollingId);
      this._pollingId = null;
    }
  }

  /**
   * 检查网络信息是否发生变化
   */
  private _hasNetworkInfoChanged(oldInfo: NetworkInfo, newInfo: NetworkInfo): boolean {
    return (
      oldInfo.online !== newInfo.online ||
      oldInfo.type !== newInfo.type ||
      oldInfo.speed !== newInfo.speed ||
      oldInfo.downlink !== newInfo.downlink ||
      oldInfo.rtt !== newInfo.rtt ||
      oldInfo.effectiveType !== newInfo.effectiveType ||
      oldInfo.saveData !== newInfo.saveData
    );
  }

  /**
   * 通知所有监听器
   */
  private _notifyListeners(): void {
    this._listeners.forEach(listener => {
      try {
        listener(this._networkInfo);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * 销毁监听器
   */
  destroy(): void {
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }
    this._listeners = [];
  }
}

/**
 * 创建一个网络监视器实例
 * @param pollingIntervalMs 轮询间隔（毫秒），设为0禁用轮询
 * @returns NetworkMonitor实例
 */
export function createNetworkMonitor(pollingIntervalMs: number = 5000): NetworkMonitor {
  return new NetworkMonitor(pollingIntervalMs);
}

/**
 * 检测设备是否支持5G网络
 * 注意：这是一个启发式检测，不一定100%准确
 * @returns 是否可能支持5G
 */
export function detectPossible5GSupport(): boolean {
  const connection = getNetworkConnection();
  if (!connection) {
    return false;
  }

  // 检查下行速度和RTT
  if (connection.downlink && connection.rtt) {
    // 5G通常具有高下行速度(>50Mbps)和低延迟(<30ms)
    return connection.downlink >= 50 && connection.rtt < 30;
  }

  return false;
}

/**
 * 获取网络速度描述
 * @param speedMbps 网络速度(Mbps)
 * @returns 速度描述
 */
export function getSpeedDescription(speedMbps: number): string {
  if (speedMbps < 0.5) {
    return '非常慢 (< 0.5 Mbps)';
  } else if (speedMbps < 2) {
    return '较慢 (0.5 - 2 Mbps)';
  } else if (speedMbps < 10) {
    return '良好 (2 - 10 Mbps)';
  } else if (speedMbps < 30) {
    return '很好 (10 - 30 Mbps)';
  } else if (speedMbps < 100) {
    return '极好 (30 - 100 Mbps)';
  } else {
    return '超快 (> 100 Mbps)';
  }
}

/**
 * 获取网络类型的中文描述
 * @param type 网络类型
 * @returns 中文描述
 */
export function getNetworkTypeDescription(type: NetworkType): string {
  switch (type) {
    case NetworkType.ETHERNET:
      return '有线网络';
    case NetworkType.WIFI:
      return 'WiFi';
    case NetworkType.CELLULAR:
      return '移动网络';
    case NetworkType.CELLULAR_2G:
      return '2G网络';
    case NetworkType.CELLULAR_3G:
      return '3G网络';
    case NetworkType.CELLULAR_4G:
      return '4G网络';
    case NetworkType.CELLULAR_5G:
      return '5G网络';
    case NetworkType.OFFLINE:
      return '离线';
    default:
      return '未知网络';
  }
}

