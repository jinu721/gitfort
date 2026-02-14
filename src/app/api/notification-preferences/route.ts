import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationPreferenceService } from '@/lib/notification-preference-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await notificationPreferenceService.getPreferences(session.user.id)
    
    if (!preferences) {
      // Create default preferences if none exist
      preferences = await notificationPreferenceService.createDefaultPreferences(session.user.id)
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Notification preferences GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    
    // Validate the updates
    const allowedFields = [
      'streakRiskNotifications',
      'securityAlerts', 
      'buildFailureNotifications',
      'weeklyReports',
      'emailFrequency',
      'quietHours'
    ]

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    const preferences = await notificationPreferenceService.updatePreferences(
      session.user.id,
      filteredUpdates
    )

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Notification preferences PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await notificationPreferenceService.deletePreferences(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification preferences DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification preferences' },
      { status: 500 }
    )
  }
}