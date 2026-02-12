import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { database } from "@/lib/database";
import { StreakService } from "@/lib/streak-service";
import { GitHubAPIClient } from "@/lib/github-api-client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await database.connect();

    const githubClient = new GitHubAPIClient();
    const streakService = new StreakService(githubClient);

    const streakSummary = await streakService.getStreakSummary(session.user.id);

    return NextResponse.json(streakSummary);
  } catch (error) {
    console.error("Error fetching streak summary:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch streak summary",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}