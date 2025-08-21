'use client'

import { useState, useEffect } from 'react'
import {
  lru
} from '@trace/utils'
import {
  isOnline,
  createNetworkMonitor,
  getNetworkInfo,
  NetworkInfo,
  NetworkType,
  NetworkSpeed,
  getNetworkTypeDescription,
  getSpeedDescription,
  measureDownloadSpeed,
  measureNetworkLatency
} from '@trace/core'

export default function Home() {
  const [results, setResults] = useState<string[]>([])
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkInfo())
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [speedTestResult, setSpeedTestResult] = useState<{
    downloadSpeed: number | null;
    latency: number | null;
  }>({
    downloadSpeed: null,
    latency: null
  })

  const addResult = (result: string) => {
    setResults(prev => [result, ...prev].slice(0, 50)) // 限制日志数量
  }

  useEffect(() => {
    // 初始化网络状态
    setNetworkInfo(getNetworkInfo())

    // 创建网络监视器 (每5秒轮询一次)
    const networkMonitor = createNetworkMonitor(5000)

    // 添加网络状态变化监听器
    const removeListener = networkMonitor.addListener((info) => {
      setNetworkInfo(info)
      addResult(`网络状态变化: ${info.online ? '已连接' : '已断开'} - 类型: ${getNetworkTypeDescription(info.type)} - ${new Date().toLocaleTimeString()}`)
    })

    // 组件卸载时清理监听器
    return () => {
      removeListener()
      networkMonitor.destroy()
    }
  }, [])

  // 测试网络状态检测功能
  const testNetworkStatus = () => {
    const info = getNetworkInfo()
    setNetworkInfo(info)
    addResult(`当前网络状态: ${info.online ? '已连接' : '已断开'}, 类型: ${getNetworkTypeDescription(info.type)}, 速度等级: ${getSpeedDescription(info.downlink || 0)}`)
  }

  // 测量网络速度
  const testNetworkSpeed = async () => {
    setIsLoading(true)
    addResult('开始测量网络速度...')

    try {
      // 测量下载速度
      const downloadSpeed = await measureDownloadSpeed(500000) // 使用500KB的样本以加快测试
      setSpeedTestResult(prev => ({ ...prev, downloadSpeed }))
      addResult(`下载速度: ${downloadSpeed.toFixed(2)} Mbps (${getSpeedDescription(downloadSpeed)})`)

      // 测量网络延迟
      const latency = await measureNetworkLatency()
      setSpeedTestResult(prev => ({ ...prev, latency }))
      addResult(`网络延迟: ${latency.toFixed(0)} ms`)
    } catch (error) {
      addResult(`测速失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取网络类型的颜色
  const getNetworkTypeColor = (type: NetworkType) => {
    switch (type) {
      case NetworkType.ETHERNET:
        return '#4CAF50'; // 绿色
      case NetworkType.WIFI:
        return '#2196F3'; // 蓝色
      case NetworkType.CELLULAR_5G:
        return '#9C27B0'; // 紫色
      case NetworkType.CELLULAR_4G:
        return '#00BCD4'; // 青色
      case NetworkType.CELLULAR_3G:
        return '#FF9800'; // 橙色
      case NetworkType.CELLULAR_2G:
        return '#F44336'; // 红色
      case NetworkType.CELLULAR:
        return '#607D8B'; // 蓝灰色
      case NetworkType.OFFLINE:
        return '#9E9E9E'; // 灰色
      default:
        return '#9E9E9E'; // 灰色
    }
  }

  // 获取网络速度的颜色
  const getSpeedColor = (speed: NetworkSpeed) => {
    switch (speed) {
      case NetworkSpeed.EXCELLENT:
        return '#4CAF50'; // 绿色
      case NetworkSpeed.GOOD:
        return '#8BC34A'; // 浅绿色
      case NetworkSpeed.MODERATE:
        return '#FFC107'; // 琥珀色
      case NetworkSpeed.SLOW:
        return '#FF5722'; // 深橙色
      default:
        return '#9E9E9E'; // 灰色
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>网络状态检测</h1>

      <div style={{ marginBottom: '20px' }}>
        {/* 网络状态卡片 */}
        <div style={{
          padding: '20px',
          backgroundColor: networkInfo.online ? '#f8f9fa' : '#ffe6e6',
          border: `1px solid ${networkInfo.online ? '#dee2e6' : '#f5c2c7'}`,
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: '0', color: '#212529' }}>
              网络状态: {networkInfo.online ? '已连接 ✅' : '已断开 ❌'}
            </h2>
            <span style={{
              backgroundColor: getNetworkTypeColor(networkInfo.type),
              color: 'white',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {getNetworkTypeDescription(networkInfo.type)}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>下行速度</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {networkInfo.downlink ? `${networkInfo.downlink.toFixed(1)} Mbps` : '未知'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>网络延迟</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {networkInfo.rtt ? `${networkInfo.rtt.toFixed(0)} ms` : '未知'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>速度等级</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: getSpeedColor(networkInfo.speed)
              }}>
                {networkInfo.speed !== NetworkSpeed.UNKNOWN ? networkInfo.speed : '未知'}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>数据节省</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {typeof networkInfo.saveData === 'boolean' ? (networkInfo.saveData ? '开启' : '关闭') : '未知'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={testNetworkStatus}
              style={{
                padding: '10px 16px',
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              检测网络状态
            </button>

            <button
              onClick={testNetworkSpeed}
              disabled={isLoading || !networkInfo.online}
              style={{
                padding: '10px 16px',
                backgroundColor: isLoading ? '#6c757d' : '#198754',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading || !networkInfo.online ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                opacity: isLoading || !networkInfo.online ? 0.7 : 1
              }}
            >
              {isLoading ? '测速中...' : '测量网络速度'}
            </button>
          </div>

          {speedTestResult.downloadSpeed !== null && speedTestResult.latency !== null && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e9ecef',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>测速结果</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>下载速度:</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {speedTestResult.downloadSpeed.toFixed(2)} Mbps
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {getSpeedDescription(speedTestResult.downloadSpeed)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>网络延迟:</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {speedTestResult.latency.toFixed(0)} ms
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {speedTestResult.latency < 50 ? '极佳' : speedTestResult.latency < 100 ? '良好' : speedTestResult.latency < 200 ? '一般' : '较差'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p style={{ fontSize: '12px', marginTop: '15px', color: '#6c757d' }}>
            提示: 你可以通过浏览器的开发者工具模拟不同的网络条件来测试此功能
          </p>
        </div>

        {/* 事件日志 */}
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#212529' }}>事件日志:</h3>
          {results.length === 0 ? (
            <p style={{ color: '#6c757d' }}>暂无事件</p>
          ) : (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {results.map((result, index) => (
                <li key={index} style={{ marginBottom: '8px', color: '#495057' }}>{result}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
