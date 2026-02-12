import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { StreakService } from "@/lib/streak-service";
import { GitHubAPIClient } from "@/lib/github-api-client";
import { User } from "@/lib/models/user";

export async function POST(request: NextRequest) {
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

    const users = await User.find({}).select('_id username githubId email');
    
    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found to update",
        processed: 0,
        errors: []
      });
    }

    const githubClient = new GitHubAPIClient();
    const streakService = new StreakService(githubClient);
    
    const results = [];
    const errors = [];
    let notificationsSent = 0;

    for (const user of users) {
      try {
        const result = await streakService.updateStreakDataWithNotifications(
          user._id.toString(), 
          user.username,
          user,
          null
        );
        
        results.push({
          userId: user._id.toString(),
          username: user.username,
          success: result.success,
          updated: result.updated,
          notificationSent: result.notificationSent || false,
          error: result.error
        });

        if (result.notificationSent) {
          notificationsSent++;
        }

        if (!result.success) {
          errors.push({
            userId: user._id.toString(),
            username: user.username,
            error: result.error
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          userId: user._id.toString(),
          username: user.username,
          success: false,
          updated: false,
          notificationSent: false,
          error: errorMessage
        });

        errors.push({
          userId: user._id.toString(),
          username: user.username,
          error: errorMessage
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const updatedCount = results.filter(r => r.updated).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${users.length} users`,
      processed: users.length,
      successful: successCount,
      updated: updatedCount,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
      results
    });

  } catch (error) {
    console.error("Cron streak update error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process streak updates",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}