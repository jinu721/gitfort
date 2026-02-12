import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { database } from '@/lib/database'
import { SecurityScan } from '@/lib/models/security-scan'
import { Repository } from '@/lib/models/repository'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await database.connect()

    const repositories = await Repository.find({ userId: session.user.id })
    const repositoryIds = repositories.map(repo => repo._id.toString())

    if (repositoryIds.length === 0) {
      return NextResponse.json([])
    }

    const securityScans = await SecurityScan.find({
      repositoryId: { $in: repositoryIds },
      status: 'completed'
    })
    .sort({ scanDate: -1 })
    .limit(50)

    const findings = securityScans.map(scan => {
      const repository = repositories.find(repo => repo._id.toString() === scan.repositoryId)
      
      return {
        id: scan._id.toString(),
        repositoryName: repository?.name || 'Unknown Repository',
        repositoryId: scan.repositoryId,
        scanDate: scan.scanDate,
        riskScore: scan.riskScore,
        vulnerabilities: scan.vulnerabilities,
        status: scan.status
      }
    })

    return NextResponse.json(findings)
  } catch (error) {
    console.error('Error fetching security findings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
