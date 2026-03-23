import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAuthenticatedUser(request) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Please sign in to continue.");
  }

  const accessToken = authorizationHeader.replace("Bearer ", "").trim();
  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error("Your login session is invalid. Please sign in again.");
  }

  return user;
}
