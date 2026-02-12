import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await database.connect();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
    });

  } catch (error) {
    console.error("Cron health check error:", error);
    
    return NextResponse.json(
      { 
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}