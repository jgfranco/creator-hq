import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Opt into request-time rendering (replaces `dynamic = "force-dynamic"`)
  await connection();

  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      db: "connected",
      latencyMs: Date.now() - start,
    });
  } catch (error) {
    console.error("[health] database check failed:", error);

    return NextResponse.json(
      { status: "error", db: "disconnected" },
      { status: 500 },
    );
  }
}
