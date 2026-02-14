import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }


    const testEvent = {
      type: 'weekly_digest' as const,
      userId: session.user.id || '',
      data: {
        stats: {
          commits: 42,
          activeRepos: 5,
          currentStreak: 7,
          securityScans: 3,
          cicdRuns: 15
        }
      },
      timestamp: new Date()
    }

    await notificationService.sendNotification(testEvent)

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully'
    })
  } catch (error) {
    console.error('Test notification failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send test notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if email service is configured by trying to verify connection
    const emailService = (notificationService as any).emailService
    const isConfigured = emailService ? await emailService.verifyConnection() : false

    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'Email service is properly configured' 
        : 'Email service configuration needs attention'
    })
  } catch (error) {
    console.error('Email configuration check failed:', error)
    
    return NextResponse.json(
      { 
        configured: false,
        error: 'Failed to verify email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}