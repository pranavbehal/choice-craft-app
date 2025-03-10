/**
 * Authentication Callback Route Handler
 *
 * Manages OAuth callback processing for Supabase authentication.
 * Handles session creation, token management, and redirect logic.
 *
 * @route GET /auth/callback
 */

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET request handler for authentication callback
 * @param {Request} request - Incoming request with auth code
 * @returns {Response} Redirect response with authentication state
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const returnTo = requestUrl.searchParams.get("return_to") || "/";

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Exchange the authorization code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(new URL("/", requestUrl.origin));
      }

      // Set authentication cookie with secure parameters
      const response = NextResponse.redirect(
        new URL(returnTo, requestUrl.origin)
      );
      response.cookies.set("sb-auth-token", data.session?.access_token || "", {
        path: "/",
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week expiration
      });

      return response;
    }

    return NextResponse.redirect(new URL("/", requestUrl.origin));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
