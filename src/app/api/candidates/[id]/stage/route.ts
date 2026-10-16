import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { stage, notes } = body;

    if (!stage || typeof stage !== "string" || !stage.trim()) {
      return NextResponse.json({ error: "Stage is required" }, { status: 400 });
    }

    const targetStage = stage.trim();
    if (!VALID_STAGES.includes(targetStage)) {
      return NextResponse.json(
        {
          error: `Invalid stage: "${targetStage}". Must be one of: ${VALID_STAGES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: {
        stage: targetStage,
        stageHistory: {
          create: {
            fromStage: candidate.stage,
            toStage: targetStage,
            notes: notes
              ? String(notes).trim()
              : `Moved from ${candidate.stage} to ${targetStage}`,
          },
        },
      },
      include: {
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedCandidate);
  } catch (error) {
    console.error("Error updating candidate stage:", error);
    return NextResponse.json(
      { error: "Failed to update candidate stage" },
      { status: 500 }
    );
  }
}
