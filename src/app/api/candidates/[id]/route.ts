import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existingCandidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, position, resumeLink, notes, stage, historyNotes } = body;

    if (email && email.trim().toLowerCase() !== existingCandidate.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: "Please provide a valid email address" },
          { status: 400 }
        );
      }

      const emailConflict = await prisma.candidate.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: "A candidate with this email already exists" },
          { status: 409 }
        );
      }
    }

    const stageChanged = Boolean(stage && stage.trim() && stage.trim() !== existingCandidate.stage);
    const newStage = stageChanged ? stage.trim() : existingCandidate.stage;

    const updateData: Prisma.CandidateUpdateInput = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (position !== undefined) updateData.position = String(position).trim();
    if (resumeLink !== undefined) updateData.resumeLink = resumeLink ? String(resumeLink).trim() : null;
    if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;

    if (stageChanged) {
      updateData.stage = newStage;
      updateData.stageHistory = {
        create: {
          fromStage: existingCandidate.stage,
          toStage: newStage,
          notes: historyNotes ? String(historyNotes).trim() : (notes ? String(notes).trim() : `Moved from ${existingCandidate.stage} to ${newStage}`),
        },
      };
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: updateData,
      include: {
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedCandidate);
  } catch (error: any) {
    console.error("Error updating candidate:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A candidate with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existingCandidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.candidate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting candidate:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
