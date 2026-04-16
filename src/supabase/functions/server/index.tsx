import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-1a1b1aa9/health", (c) => {
  return c.json({ status: "ok" });
});

// Instagram OAuth - Initiate
app.get("/make-server-1a1b1aa9/auth/instagram", (c) => {
  const clientId = Deno.env.get("INSTAGRAM_CLIENT_ID");
  const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI") || "http://localhost:54321/functions/v1/make-server-1a1b1aa9/auth/instagram/callback";
  
  if (!clientId) {
    return c.json({ error: "Instagram Client ID not configured" }, 500);
  }
  
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
  
  return c.redirect(authUrl);
});

// Instagram OAuth - Callback
app.get("/make-server-1a1b1aa9/auth/instagram/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  
  if (error) {
    console.log(`Instagram OAuth error: ${error}`);
    return c.html(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram_auth_error', error: '${error}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return c.json({ error: "No authorization code received" }, 400);
  }
  
  try {
    const clientId = Deno.env.get("INSTAGRAM_CLIENT_ID");
    const clientSecret = Deno.env.get("INSTAGRAM_CLIENT_SECRET");
    const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI") || "http://localhost:54321/functions/v1/make-server-1a1b1aa9/auth/instagram/callback";
    
    if (!clientId || !clientSecret) {
      throw new Error("Instagram credentials not configured");
    }
    
    // Exchange code for access token
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: code,
    });
    
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
    }
    
    // Store the access token and user info
    const userId = tokenData.user_id;
    await kv.set(`instagram_token_${userId}`, JSON.stringify({
      access_token: tokenData.access_token,
      user_id: userId,
      created_at: new Date().toISOString(),
    }));
    
    // Return success page that closes the popup
    return c.html(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'instagram_auth_success', 
              userId: '${userId}',
              accessToken: '${tokenData.access_token}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.log(`Instagram OAuth callback error: ${err.message}`);
    return c.html(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram_auth_error', error: '${err.message}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

// Get Instagram user profile
app.get("/make-server-1a1b1aa9/api/instagram/profile", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }
  
  try {
    const tokenData = await kv.get(`instagram_token_${userId}`);
    
    if (!tokenData) {
      return c.json({ error: "Not authenticated with Instagram" }, 401);
    }
    
    const { access_token } = JSON.parse(tokenData);
    
    // Fetch user profile from Instagram
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
    );
    
    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: ${await profileResponse.text()}`);
    }
    
    const profile = await profileResponse.json();
    return c.json(profile);
  } catch (err) {
    console.log(`Error fetching Instagram profile: ${err.message}`);
    return c.json({ error: err.message }, 500);
  }
});

// Get Instagram user media
app.get("/make-server-1a1b1aa9/api/instagram/media", async (c) => {
  const userId = c.req.query("userId");
  const limit = c.req.query("limit") || "25";
  
  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }
  
  try {
    const tokenData = await kv.get(`instagram_token_${userId}`);
    
    if (!tokenData) {
      return c.json({ error: "Not authenticated with Instagram" }, 401);
    }
    
    const { access_token } = JSON.parse(tokenData);
    
    // Fetch user media from Instagram
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${access_token}`
    );
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch media: ${await mediaResponse.text()}`);
    }
    
    const media = await mediaResponse.json();
    return c.json(media);
  } catch (err) {
    console.log(`Error fetching Instagram media: ${err.message}`);
    return c.json({ error: err.message }, 500);
  }
});

// Disconnect Instagram
app.delete("/make-server-1a1b1aa9/api/instagram/disconnect", async (c) => {
  const userId = c.req.query("userId");
  
  if (!userId) {
    return c.json({ error: "User ID required" }, 400);
  }
  
  try {
    await kv.del(`instagram_token_${userId}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error disconnecting Instagram: ${err.message}`);
    return c.json({ error: err.message }, 500);
  }
});

Deno.serve(app.fetch);