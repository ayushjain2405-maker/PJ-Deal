import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  fromDatabaseDeal,
  isFullyDelivered,
  sanitizeDealPatch,
  toDatabasePatch,
} from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const user = await getAuthenticatedUser(request);
    const payload = await request.json();
    const updates = sanitizeDealPatch(payload);
    const databasePatch = toDatabasePatch(updates);
    const supabase = getSupabaseAdmin();

    const { data: currentDeal, error: currentError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (currentError) {
      throw currentError;
    }

    const mergedDeal = {
      ...fromDatabaseDeal(currentDeal),
      ...updates,
    };

    if (isFullyDelivered(mergedDeal)) {
      const { error: deleteError } = await supabase
        .from("deals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      return NextResponse.json({ deleted: true });
    }

    const { data, error } = await supabase
      .from("deals")
      .update(databasePatch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ deal: fromDatabaseDeal(data), deleted: false });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Could not update deal." },
      { status: 400 }
    );
  }
}
