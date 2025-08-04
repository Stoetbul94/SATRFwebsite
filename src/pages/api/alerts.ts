import type { NextApiRequest, NextApiResponse } from 'next'
import { AlertConfig, ALERT_LEVELS } from '../../lib/monitoring'

// Alert storage (in production, use a database)
let alerts: Array<AlertConfig & { id: string; timestamp: number; status: 'active' | 'resolved' }> = []

// Alert configuration for different notification channels
const ALERT_CONFIG = {
  channels: {
    email: {
      enabled: true,
      recipients: {
        [ALERT_LEVELS.CRITICAL]: ['dev-team@satrf.com', 'cto@satrf.com'],
        [ALERT_LEVELS.HIGH]: ['dev-team@satrf.com'],
        [ALERT_LEVELS.MEDIUM]: ['dev-team@satrf.com'],
        [ALERT_LEVELS.LOW]: ['dev-team@satrf.com']
      }
    },
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channels: {
        [ALERT_LEVELS.CRITICAL]: '#satrf-alerts-critical',
        [ALERT_LEVELS.HIGH]: '#satrf-alerts',
        [ALERT_LEVELS.MEDIUM]: '#satrf-alerts',
        [ALERT_LEVELS.LOW]: '#satrf-alerts'
      }
    },
    sms: {
      enabled: false,
      recipients: {
        [ALERT_LEVELS.CRITICAL]: ['emergency-number'],
        [ALERT_LEVELS.HIGH]: [],
        [ALERT_LEVELS.MEDIUM]: [],
        [ALERT_LEVELS.LOW]: []
      }
    }
  }
}

// Notification service
class NotificationService {
  async sendEmail(recipients: string[], subject: string, message: string) {
    // In production, use a proper email service like SendGrid, AWS SES, etc.
    console.log('📧 Email notification:', { recipients, subject, message })
    
    // Placeholder for email sending
    try {
      // Example with a hypothetical email service
      // await emailService.send({
      //   to: recipients,
      //   subject,
      //   html: message
      // })
      
      return { success: true, channel: 'email' }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { success: false, channel: 'email', error: error.message }
    }
  }

  async sendSlack(webhookUrl: string, channel: string, message: string) {
    if (!webhookUrl) {
      console.warn('Slack webhook URL not configured')
      return { success: false, channel: 'slack', error: 'Webhook not configured' }
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          text: message,
          username: 'SATRF Monitoring',
          icon_emoji: ':warning:'
        })
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`)
      }

      return { success: true, channel: 'slack' }
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
      return { success: false, channel: 'slack', error: error.message }
    }
  }

  async sendSMS(recipients: string[], message: string) {
    // In production, use a proper SMS service like Twilio, AWS SNS, etc.
    console.log('📱 SMS notification:', { recipients, message })
    
    // Placeholder for SMS sending
    try {
      // Example with a hypothetical SMS service
      // await smsService.send({
      //   to: recipients,
      //   message
      // })
      
      return { success: true, channel: 'sms' }
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return { success: false, channel: 'sms', error: error.message }
    }
  }
}

const notificationService = new NotificationService()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create new alert
    try {
      const alertData: AlertConfig = req.body
      
      // Validate required fields
      if (!alertData.level || !alertData.title || !alertData.message) {
        return res.status(400).json({
          error: 'Missing required fields: level, title, message'
        })
      }

      // Generate alert ID
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create alert record
      const alert = {
        id: alertId,
        ...alertData,
        timestamp: Date.now(),
        status: 'active' as const
      }

      // Store alert
      alerts.push(alert)

      // Send notifications
      const notificationResults = await sendNotifications(alert)

      // Return response
      res.status(201).json({
        success: true,
        alert: {
          id: alert.id,
          level: alert.level,
          title: alert.title,
          timestamp: alert.timestamp,
          status: alert.status
        },
        notifications: notificationResults
      })

    } catch (error) {
      console.error('Error creating alert:', error)
      res.status(500).json({
        error: 'Failed to create alert',
        details: error.message
      })
    }
  } else if (req.method === 'GET') {
    // Retrieve alerts with filtering
    try {
      const { level, status, limit = '50', offset = '0' } = req.query
      
      let filteredAlerts = [...alerts]

      // Filter by level
      if (level && typeof level === 'string') {
        filteredAlerts = filteredAlerts.filter(alert => alert.level === level)
      }

      // Filter by status
      if (status && typeof status === 'string') {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === status)
      }

      // Sort by timestamp (newest first)
      filteredAlerts.sort((a, b) => b.timestamp - a.timestamp)

      // Apply pagination
      const limitNum = parseInt(limit as string, 10)
      const offsetNum = parseInt(offset as string, 10)
      const paginatedAlerts = filteredAlerts.slice(offsetNum, offsetNum + limitNum)

      res.status(200).json({
        alerts: paginatedAlerts,
        total: filteredAlerts.length,
        limit: limitNum,
        offset: offsetNum
      })

    } catch (error) {
      console.error('Error retrieving alerts:', error)
      res.status(500).json({
        error: 'Failed to retrieve alerts',
        details: error.message
      })
    }
  } else if (req.method === 'PUT') {
    // Update alert status
    try {
      const { id, status } = req.body

      if (!id || !status) {
        return res.status(400).json({
          error: 'Missing required fields: id, status'
        })
      }

      const alertIndex = alerts.findIndex(alert => alert.id === id)
      
      if (alertIndex === -1) {
        return res.status(404).json({
          error: 'Alert not found'
        })
      }

      // Update alert status
      alerts[alertIndex].status = status

      res.status(200).json({
        success: true,
        alert: alerts[alertIndex]
      })

    } catch (error) {
      console.error('Error updating alert:', error)
      res.status(500).json({
        error: 'Failed to update alert',
        details: error.message
      })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}

async function sendNotifications(alert: AlertConfig & { id: string; timestamp: number }) {
  const results = []
  const config = ALERT_CONFIG.channels

  // Determine which channels to use
  const channels = alert.channels || ['email', 'slack']
  const recipients = alert.recipients || []

  for (const channel of channels) {
    if (!config[channel]?.enabled) {
      results.push({
        success: false,
        channel,
        error: 'Channel not enabled'
      })
      continue
    }

    const channelConfig = config[channel]
    let channelRecipients = recipients

    // Use default recipients if none specified
    if (recipients.length === 0 && channelConfig.recipients) {
      channelRecipients = channelConfig.recipients[alert.level] || []
    }

    if (channelRecipients.length === 0) {
      results.push({
        success: false,
        channel,
        error: 'No recipients configured'
      })
      continue
    }

    // Format message
    const message = formatAlertMessage(alert, channel)

    // Send notification
    let result
    switch (channel) {
      case 'email':
        result = await notificationService.sendEmail(
          channelRecipients,
          `🚨 ${alert.title}`,
          message
        )
        break
      case 'slack':
        const slackChannel = channelConfig.channels?.[alert.level] || '#satrf-alerts'
        result = await notificationService.sendSlack(
          channelConfig.webhook,
          slackChannel,
          message
        )
        break
      case 'sms':
        result = await notificationService.sendSMS(channelRecipients, message)
        break
      default:
        result = {
          success: false,
          channel,
          error: 'Unknown channel'
        }
    }

    results.push(result)
  }

  return results
}

function formatAlertMessage(alert: AlertConfig & { id: string; timestamp: number }, channel: string) {
  const timestamp = new Date(alert.timestamp).toISOString()
  const levelEmoji = {
    [ALERT_LEVELS.CRITICAL]: '🚨',
    [ALERT_LEVELS.HIGH]: '⚠️',
    [ALERT_LEVELS.MEDIUM]: '📊',
    [ALERT_LEVELS.LOW]: 'ℹ️'
  }[alert.level] || '📋'

  if (channel === 'slack') {
    return `${levelEmoji} *${alert.title}*\n\n${alert.message}\n\n*Alert ID:* ${alert.id}\n*Timestamp:* ${timestamp}\n*Level:* ${alert.level.toUpperCase()}`
  }

  if (channel === 'sms') {
    return `${levelEmoji} ${alert.title}: ${alert.message}`
  }

  // Email format
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">${levelEmoji} ${alert.title}</h2>
      <p style="font-size: 16px; line-height: 1.5;">${alert.message}</p>
      
      ${alert.data ? `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Alert Data:</h3>
          <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(alert.data, null, 2)}</pre>
        </div>
      ` : ''}
      
      <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #666;">
        <p><strong>Alert ID:</strong> ${alert.id}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Level:</strong> ${alert.level.toUpperCase()}</p>
      </div>
    </div>
  `
} 