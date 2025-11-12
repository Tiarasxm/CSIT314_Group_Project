import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";

  const supabase = await createClient();

  // Handle email confirmation - Supabase redirects here after verification
  // The token is already verified by Supabase before redirecting
  if (token && (type === "signup" || type === "email")) {
    // Try to verify the token
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type === "signup" ? "signup" : "email",
    });

    if (!verifyError && data?.user) {
      // Email confirmed successfully - redirect to confirmation success page
      return NextResponse.redirect(new URL("/email-confirmed", request.url));
    } else {
      // Verification failed or token expired
      return NextResponse.redirect(new URL("/login?error=Invalid or expired confirmation link", request.url));
    }
  }

  // Handle OAuth code (Google sign-in/sign-up)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get user after OAuth authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user already exists in users table
        const { data: existingUser } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        // If user exists, redirect to their dashboard based on role
        if (existingUser) {
          const role = existingUser.role;
          if (role === "platform-manager") {
            return NextResponse.redirect(new URL("/platform-manager/dashboard", request.url));
          } else if (role === "user-admin") {
            return NextResponse.redirect(new URL("/user-admin/dashboard", request.url));
          } else if (role === "csr-representative") {
            return NextResponse.redirect(new URL("/csr-representative/dashboard", request.url));
          } else {
            return NextResponse.redirect(new URL("/user/dashboard", request.url));
          }
        }
        
        // New Google OAuth user - create user record in database
        // The database trigger should handle this, but we'll also do it here as a fallback
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || 
                  user.user_metadata?.full_name || 
                  `${user.user_metadata?.given_name || ""} ${user.user_metadata?.family_name || ""}`.trim() ||
                  "User",
            first_name: user.user_metadata?.first_name || user.user_metadata?.given_name,
            last_name: user.user_metadata?.last_name || user.user_metadata?.family_name,
            role: "user", // Default role for new signups
          })
          .select()
          .single();

        // If insert fails, it might be because the trigger already created it
        // Try to fetch the user again
        if (insertError) {
          const { data: retryUser } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (retryUser) {
            // User was created by trigger, use that role
            const role = retryUser.role;
            if (role === "platform-manager") {
              return NextResponse.redirect(new URL("/platform-manager/dashboard", request.url));
            } else if (role === "user-admin") {
              return NextResponse.redirect(new URL("/user-admin/dashboard", request.url));
            } else if (role === "csr-representative") {
              return NextResponse.redirect(new URL("/csr-representative/dashboard", request.url));
            } else {
              return NextResponse.redirect(new URL("/user/dashboard", request.url));
            }
          }
        }

        // Redirect new Google OAuth user directly to dashboard (no password needed!)
        return NextResponse.redirect(new URL("/user/dashboard", request.url));
      }
    }
  }

  // Return to login page if there's an error
  const forwardedHost = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const redirectUrl = new URL("/login?error=Could not authenticate", `${protocol}://${forwardedHost || requestUrl.host}`);
  return NextResponse.redirect(redirectUrl);
}

