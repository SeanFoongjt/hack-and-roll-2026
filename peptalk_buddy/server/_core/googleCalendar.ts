import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { ENV } from "./env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_LIST_URL = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type GoogleStatePayload = {
  appRedirect: string;
  nonce: string;
  issuedAt: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function getGoogleRedirectUri(req: Request): string {
  if (ENV.googleRedirectUri) {
    return ENV.googleRedirectUri;
  }
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}/api/google/oauth/callback`;
}

function buildGoogleAuthUrl(req: Request, appRedirect: string): string {
  const statePayload: GoogleStatePayload = {
    appRedirect,
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
  };

  const state = base64UrlEncode(JSON.stringify(statePayload));
  const redirectUri = getGoogleRedirectUri(req);

  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

async function testCalendarAccess(accessToken: string) {
  const response = await fetch(`${GOOGLE_CALENDAR_LIST_URL}?maxResults=1`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Google Calendar test GET failed: ${responseText}`);
  }

  let calendarCount = 0;
  try {
    const data = JSON.parse(responseText) as { items?: unknown[] };
    calendarCount = Array.isArray(data.items) ? data.items.length : 0;
  } catch {
    calendarCount = 0;
  }

  return {
    calendarCount,
    responseText,
  };
}

function buildAppRedirect(appRedirect: string, payload: Record<string, unknown>) {
  const redirectUrl = new URL(appRedirect);
  redirectUrl.searchParams.set("status", "success");
  redirectUrl.searchParams.set("payload", base64UrlEncode(JSON.stringify(payload)));
  return redirectUrl.toString();
}

function buildErrorRedirect(appRedirect: string, error: string) {
  const redirectUrl = new URL(appRedirect);
  redirectUrl.searchParams.set("status", "error");
  redirectUrl.searchParams.set("error", error);
  return redirectUrl.toString();
}

export function registerGoogleCalendarRoutes(app: Express) {
  app.get("/api/google/oauth/start", (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Google OAuth is not configured" });
      return;
    }

    const appRedirect = typeof req.query.appRedirect === "string" ? req.query.appRedirect : "";
    if (!appRedirect) {
      res.status(400).json({ error: "appRedirect is required" });
      return;
    }

    const url = buildGoogleAuthUrl(req, appRedirect);
    res.json({ url });
  });

  app.get("/api/google/oauth/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    let appRedirect = "";
    try {
      const decodedState = base64UrlDecode(state);
      const payload = JSON.parse(decodedState) as GoogleStatePayload;
      appRedirect = payload.appRedirect;
    } catch (error) {
      res.status(400).json({ error: "invalid state payload" });
      return;
    }

    if (!appRedirect) {
      res.status(400).json({ error: "appRedirect missing in state" });
      return;
    }

    try {
      const redirectUri = getGoogleRedirectUri(req);
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      const testResult = await testCalendarAccess(tokens.access_token);

      const payload = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        test: testResult,
      };

      res.redirect(302, buildAppRedirect(appRedirect, payload));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google OAuth failed";
      res.redirect(302, buildErrorRedirect(appRedirect, message));
    }
  });
}
