import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  fromDatabaseDeal,
  sanitizeDealInput,
  sortDealsNewestFirst,
  toDatabaseDeal,
} from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      deals: sortDealsNewestFirst((data ?? []).map(fromDatabaseDeal)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not load deals." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const payload = await request.json();
    const deal = sanitizeDealInput(payload);

    if (deal.customerDeliveryStatus === "Delivered" && deal.vendorDeliveryStatus === "Delivered") {
      return NextResponse.json(
        {
          error:
            "Both delivery sides are already delivered, so this deal does not need to be saved.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("deals")
      .insert(toDatabaseDeal({ ...deal, userId: user.id }))
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ deal: fromDatabaseDeal(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not save deal." },
      { status: 400 }
    );
  }
}
