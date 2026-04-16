import { NextRequest } from "next/server";
import { aiSearch } from "@/lib/actions/ai-search";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return Response.json(
        { success: false, error: "Invalid query" },
        { status: 400 }
      );
    }

    const result = await aiSearch(query);

    return Response.json(result);
  } catch (error) {
    console.error("AI search API error:", error);

    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
