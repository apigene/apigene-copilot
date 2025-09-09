import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import { auth } from "@clerk/nextjs/server";

export interface Interaction {
  created_at: string;
  user_id: string;
  api_title: string;
  actions_result: {
    action_name: string;
    status_code: number;
  }[];
}

export interface SummaryRequest {
  startDate: string;
  endDate: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user's organization from Clerk
    const { orgId } = await auth();

    if (!orgId) {
      console.log("No organization ID found for user");
      return NextResponse.json(
        { error: "User not associated with an organization" },
        { status: 401 },
      );
    }

    const body: SummaryRequest = await request.json();
    const { startDate, endDate } = body;

    // Connect to MongoDB
    const client = await connectToDatabase();
    const databaseName = process.env.DATABASE_ENV + "_" + orgId;

    const db = await client.db(databaseName);

    const interactions = db.collection("interactions");

    // Query the real data from MongoDB
    const result = await interactions
      .aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
        },
        {
          $project: {
            _id: 0,
            user_id: 1,
            created_at: {
              $dateToString: { format: "%d/%m/%Y", date: "$created_at" },
            }, // Format to dd/MM/yyyy
            api_title: 1,
            "actions_result.action_name": 1,
            "actions_result.status_code": 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
