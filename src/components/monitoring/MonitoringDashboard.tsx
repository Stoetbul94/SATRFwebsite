import React, { useState, useEffect } from 'react'
import { monitoring, performHealthCheck, getStoredEvents } from '../../lib/monitoring'

interface MonitoringData {
  uptime: number
  errorCount: number
  memoryUsage: number
  pageLoadTime: number
  activeAlerts: number
}

interface Alert {
  id: string
  level: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: number
  status: 'active' | 'resolved'
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  checks: {
    database: 'ok' | 'error' | 'not_configured'
    external_services: 'ok' | 'error'
    file_system: 'ok' | 'error'
    memory_usage: 'ok' | 'warning' | 'error'
  }
  message: string
}

const MonitoringDashboard: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    uptime: 0,
    errorCount: 0,
    memoryUsage: 0,
    pageLoadTime: 0,
    activeAlerts: 0
  })
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      // Get stored events for metrics
      const events = getStoredEvents()
      const errorEvents = events.filter(e => e.type === 'error')
      const performanceEvents = events.filter(e => e.type === 'performance')
      
      // Calculate metrics
      const errorCount = errorEvents.length
      const memoryUsage = performanceEvents
        .filter(e => e.name === 'performance_memory_usage')
        .map(e => e.data?.value || 0)
        .pop() || 0
      
      const pageLoadTime = performanceEvents
        .filter(e => e.name === 'page_performance')
        .map(e => e.data?.pageLoadTime || 0)
        .pop() || 0

      // Fetch health check
      const health = await performHealthCheck()
      
      // Fetch alerts
      const alertsResponse = await fetch('/api/alerts?status=active&limit=10')
      const alertsData = await alertsResponse.json()
      
      setMonitoringData({
        uptime: health.uptime,
        errorCount,
        memoryUsage: memoryUsage * 100, // Convert to percentage
        pageLoadTime,
        activeAlerts: alertsData.total || 0
      })
      
      setHealthCheck(health)
      setAlerts(alertsData.alerts || [])
      
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data
  useEffect(() => {
    fetchMonitoringData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // Get alert level color
  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get alert level icon
  const getAlertLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '📊'
      case 'low': return 'ℹ️'
      default: return '📋'
    }
  }

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SATRF Website Monitoring</h1>
        <p className="mt-2 text-gray-600">Real-time system health and performance monitoring</p>
        
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </button>
          
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            🔄 Refresh Now
          </button>
          
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full ${
                healthCheck?.status === 'healthy' ? 'bg-green-100' :
                healthCheck?.status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
              } flex items-center justify-center`}>
                <span className="text-lg">
                  {healthCheck?.status === 'healthy' ? '✅' :
                   healthCheck?.status === 'degraded' ? '⚠️' : '❌'}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overall Status</p>
              <p className={`text-2xl font-semibold ${getStatusColor(healthCheck?.status || 'unknown')}`}>
                {healthCheck?.status?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg">⏱️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Uptime</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatUptime(monitoringData.uptime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg">🚨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monitoringData.activeAlerts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-lg">💾</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monitoringData.memoryUsage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Checks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Health Checks</h3>
          </div>
          <div className="p-6">
            {healthCheck ? (
              <div className="space-y-4">
                {Object.entries(healthCheck.checks).map(([check, status]) => (
                  <div key={check} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {check.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status === 'ok' ? 'bg-green-100 text-green-800' :
                      status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      status === 'not_configured' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {status === 'ok' ? '✅ OK' :
                       status === 'warning' ? '⚠️ Warning' :
                       status === 'not_configured' ? '⚙️ Not Configured' :
                       '❌ Error'}
                    </span>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Message:</strong> {healthCheck.message}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No health check data available</p>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
          </div>
          <div className="p-6">
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-4 ${getAlertLevelColor(alert.level)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getAlertLevelIcon(alert.level)}</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{alert.title}</h4>
                          <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                          <p className="text-xs mt-2 opacity-75">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {alerts.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all {alerts.length} alerts →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Page Load Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monitoringData.pageLoadTime > 0 ? `${monitoringData.pageLoadTime.toFixed(0)}ms` : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Error Count (24h)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monitoringData.errorCount}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monitoringData.memoryUsage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => window.open('/api/health', '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              🏥 View Health Check
            </button>
            
            <button
              onClick={() => window.open('https://sentry.io', '_blank')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
            >
              📊 Open Sentry
            </button>
            
            <button
              onClick={() => window.open('https://analytics.google.com', '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              📈 Open Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringDashboard 