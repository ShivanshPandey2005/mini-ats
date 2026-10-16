import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const stage = searchParams.get("stage")?.trim() || "";
    const sort = searchParams.get("sort")?.trim() || "createdAt";
    const order = searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {};

    if (stage && stage.toLowerCase() !== "all") {
      where.stage = stage;
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { position: { contains: q } },
      ];
    }

    const validSortFields = ["name", "createdAt", "stage", "position"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";

    const [total, candidates] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        orderBy: { [sortField]: order },
        skip,
        take: limit,
        include: {
          stageHistory: {
            orderBy: { changedAt: "desc" },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      candidates,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, position, resumeLink, notes, stage } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!position || typeof position !== "string" || !position.trim()) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    const candidateStage = (stage && typeof stage === "string" && stage.trim()) || "Applied";

    const existing = await prisma.candidate.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A candidate with this email already exists" },
        { status: 409 }
      );
    }

    const candidate = await prisma.candidate.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        position: position.trim(),
        resumeLink: resumeLink ? String(resumeLink).trim() : null,
        notes: notes ? String(notes).trim() : null,
        stage: candidateStage,
        stageHistory: {
          create: {
            fromStage: "Applied",
            toStage: candidateStage,
            notes: notes ? String(notes).trim() : "Candidate applied",
          },
        },
      },
      include: {
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error: any) {
    console.error("Error creating candidate:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A candidate with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}
