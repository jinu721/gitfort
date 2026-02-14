import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { databaseIntegrationService } from '@/lib/database-integration-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary':
        const summary = await databaseIntegrationService.getUserDataSummary(parseInt(session.user.id));
        return NextResponse.json({ success: true, data: summary });

      case 'stats':
        const stats = await databaseIntegrationService.getUserStats(session.user.id);
        return NextResponse.json({ success: true, data: stats });

      case 'activity':
        const days = parseInt(searchParams.get('days') || '30');
        const activity = await databaseIntegrationService.getRecentActivity(session.user.id, days);
        return NextResponse.json({ success: true, data: activity });

      case 'validate':
        const validation = await databaseIntegrationService.validateDataIntegrity(session.user.id);
        return NextResponse.json({ success: true, data: validation });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in database integration API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const retentionDays = parseInt(searchParams.get('retentionDays') || '90');

    const result = await databaseIntegrationService.cleanupOldData(session.user.id, retentionDays);

    return NextResponse.json({
      success: true,
      message: 'Old data cleaned up successfully',
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}