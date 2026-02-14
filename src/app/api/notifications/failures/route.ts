import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailService } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get failure statistics
    const stats = emailService.getFailureStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching email failure stats:', error);
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
    const daysOld = parseInt(searchParams.get('daysOld') || '7');

    // Clear old resolved failures
    const clearedCount = emailService.clearOldFailures(daysOld);

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} old failure logs`,
      clearedCount
    });
  } catch (error) {
    console.error('Error clearing email failure logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}