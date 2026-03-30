import { NextResponse } from "next/server";

export function GET() {
    return NextResponse.json({
        status: "ok",
        service: "reunio-room-booking",
        environment: process.env.NODE_ENV ?? "unknown",
        timestamp: new Date().toISOString(),
    });
}
