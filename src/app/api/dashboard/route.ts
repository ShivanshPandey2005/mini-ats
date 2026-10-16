import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ATS_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      totalCandidates,
      rawStageCounts,
      rawPositionCounts,
      recentActivity,
      thisWeekCount,
      thisMonthCount,
    ] = await Promise.all([
      // Total candidates
      prisma.candidate.count(),

      // Group by stage
      prisma.candidate.groupBy({
        by: ["stage"],
        _count: {
          stage: true,
        },
      }),

      // Group by position
      prisma.candidate.groupBy({
        by: ["position"],
        _count: {
          position: true,
        },
        orderBy: {
          _count: {
            position: "desc",
          },
        },
      }),

      // Last 10 stage changes with candidate information
      prisma.stageHistory.findMany({
        take: 10,
        orderBy: {
          changedAt: "desc",
        },
        include: {
          candidate: true,
        },
      }),

      // Candidates created in last 7 days
      prisma.candidate.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Candidates created in last 30 days
      prisma.candidate.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Map stage counts ensuring all standard ATS stages are represented
    const stageMap = new Map<string, number>();
    for (const item of rawStageCounts) {
      stageMap.set(item.stage, item._count.stage);
    }

    const byStage = ATS_STAGES.map((stage) => ({
      stage,
      count: stageMap.get(stage) || 0,
    }));

    // Include any additional stages in the database if present
    stageMap.forEach((count, stage) => {
      if (!ATS_STAGES.includes(stage)) {
        byStage.push({ stage, count });
      }
    });

    const byPosition = rawPositionCounts.map((item) => ({
      position: item.position,
      count: item._count.position,
    }));

    return NextResponse.json({
      totalCandidates,
      byStage,
      recentActivity,
      byPosition,
      thisWeekCount,
      thisMonthCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
