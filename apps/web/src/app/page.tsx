'use client'

import { useState } from 'react'
import {
  capitalize,
  toCamelCase,
  randomString,
  unique,
  chunk,
  deepClone,
  formatDate,
  getRelativeTime
} from '@trace/utils'
import { Validator, EventEmitter, Storage } from '@trace/core'

export default function Home() {
  const [results, setResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setResults(prev => [...prev, result])
  }

  const testStringUtils = () => {
    addResult('=== 字符串工具测试 ===')
    addResult(`capitalize('hello'): ${capitalize('hello')}`)
    addResult(`toCamelCase('hello-world'): ${toCamelCase('hello-world')}`)
    addResult(`randomString(10): ${randomString(10)}`)
  }

  const testArrayUtils = () => {
    addResult('=== 数组工具测试 ===')
    const arr = [1, 2, 2, 3, 3, 4]
    addResult(`unique([1,2,2,3,3,4]): ${JSON.stringify(unique(arr))}`)

    const chunked = chunk([1, 2, 3, 4, 5, 6], 2)
    addResult(`chunk([1,2,3,4,5,6], 2): ${JSON.stringify(chunked)}`)
  }

  const testObjectUtils = () => {
    addResult('=== 对象工具测试 ===')
    const obj = { a: 1, b: { c: 2 } }
    const cloned = deepClone(obj)
    cloned.b.c = 999
    addResult(`原对象: ${JSON.stringify(obj)}`)
    addResult(`深拷贝后修改: ${JSON.stringify(cloned)}`)
  }

  const testDateUtils = () => {
    addResult('=== 日期工具测试 ===')
    const now = new Date()
    addResult(`formatDate(now): ${formatDate(now, 'YYYY-MM-DD HH:mm:ss')}`)

    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
    addResult(`getRelativeTime(2小时前): ${getRelativeTime(pastDate)}`)
  }

  const testValidator = () => {
    addResult('=== 验证器测试 ===')
    const validator = new Validator()
      .addRule('name', { required: true, minLength: 2 })
      .addRule('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })

    const result1 = validator.validate({ name: 'A', email: 'invalid' })
    addResult(`验证失败: ${JSON.stringify(result1)}`)

    const result2 = validator.validate({ name: 'Alice', email: 'alice@example.com' })
    addResult(`验证成功: ${JSON.stringify(result2)}`)
  }

  const testEventEmitter = () => {
    addResult('=== 事件发射器测试 ===')
    const emitter = new EventEmitter()

    emitter.on('test', (data) => {
      addResult(`收到事件: ${data}`)
    })

    emitter.emit('test', 'Hello World!')
    addResult(`监听器数量: ${emitter.listenerCount('test')}`)
  }

  const testStorage = () => {
    addResult('=== 存储工具测试 ===')
    const storage = new Storage({ prefix: 'trace' })

    storage.set('user', { name: 'Alice', age: 25 })
    const user = storage.get('user')
    addResult(`存储的用户: ${JSON.stringify(user)}`)

    addResult(`所有键: ${JSON.stringify(storage.keys())}`)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Trace 函数库测试</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testStringUtils} style={{ margin: '5px' }}>
          测试字符串工具
        </button>
        <button onClick={testArrayUtils} style={{ margin: '5px' }}>
          测试数组工具
        </button>
        <button onClick={testObjectUtils} style={{ margin: '5px' }}>
          测试对象工具
        </button>
        <button onClick={testDateUtils} style={{ margin: '5px' }}>
          测试日期工具
        </button>
        <button onClick={testValidator} style={{ margin: '5px' }}>
          测试验证器
        </button>
        <button onClick={testEventEmitter} style={{ margin: '5px' }}>
          测试事件发射器
        </button>
        <button onClick={testStorage} style={{ margin: '5px' }}>
          测试存储工具
        </button>
        <button onClick={clearResults} style={{ margin: '5px', backgroundColor: '#ff6b6b', color: 'white' }}>
          清空结果
        </button>
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3>测试结果:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {result}
          </div>
        ))}
        {results.length === 0 && (
          <div style={{ color: '#666' }}>点击上方按钮开始测试...</div>
        )}
      </div>
    </div>
  )
}