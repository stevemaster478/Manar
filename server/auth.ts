import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { storage } from "./storage";

const pgStore = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store if DATABASE_URL is not set or invalid (development only)
  let sessionStore;
  const databaseUrl = process.env.DATABASE_URL?.trim();
  
  // Validate DATABASE_URL is a valid PostgreSQL connection string
  const isValidDatabaseUrl = databaseUrl && 
    databaseUrl.length > 0 && 
    (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'));
  
  if (!isValidDatabaseUrl) {
    // Fallback to memory store in development
    // Note: sessions will be lost on server restart
    // Using express-session's built-in MemoryStore (no external store)
    sessionStore = undefined; // undefined means use default MemoryStore
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Using memory store for sessions (DATABASE_URL not set or invalid)");
      console.warn("   Note: Sessions will be lost on server restart");
      if (databaseUrl) {
        console.warn(`   DATABASE_URL present but invalid format: ${databaseUrl.substring(0, 30)}...`);
        console.warn(`   Expected format: postgresql://user:password@host/database`);
      } else {
        console.warn(`   DATABASE_URL is not set in .env file`);
      }
    }
  } else {
    // Try to create PostgreSQL session store
    // Note: We validate the URL format before passing to pgStore
    // to avoid connect-pg-simple trying to parse an invalid URL
    try {
      // Additional validation: try to parse as URL to catch format errors early
      try {
        new URL(databaseUrl);
        // Check it's a postgres URL
        if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
          throw new Error("URL must start with postgresql:// or postgres://");
        }
      } catch (urlError) {
        throw new Error(`DATABASE_URL is not a valid PostgreSQL URL: ${databaseUrl.substring(0, 50)}...`);
      }
      
      sessionStore = new pgStore({
        conString: databaseUrl,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: "sessions",
      });
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Using PostgreSQL session store");
      }
    } catch (error) {
      console.error("⚠️  Error creating PostgreSQL session store:", error);
      if (error instanceof Error) {
        console.error(`   Error details: ${error.message}`);
      }
      console.warn("   Falling back to memory store");
      sessionStore = undefined;
      if (process.env.NODE_ENV === "development") {
        console.warn("   Note: Sessions will be lost on server restart");
        console.warn("   Fix DATABASE_URL format to use PostgreSQL session store");
      }
    }
  }

  return session({
    secret: process.env.SESSION_SECRET || "manar-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5173/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if database is available
            if (!process.env.DATABASE_URL?.trim() || 
                (!process.env.DATABASE_URL.startsWith('postgresql://') && 
                 !process.env.DATABASE_URL.startsWith('postgres://'))) {
              console.error("❌ DATABASE_URL not configured or invalid - cannot create user");
              console.error("   Please set a valid PostgreSQL connection string in .env file");
              return done(new Error("Database not configured. Please set DATABASE_URL in .env file with a valid Neon PostgreSQL connection string."), null);
            }
            
            const user = await storage.upsertUser({
              id: profile.id,
              email: profile.emails?.[0]?.value || "",
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value || "",
            });
            return done(null, user);
          } catch (error) {
            console.error("❌ Error in Google OAuth callback:", error);
            if (error instanceof Error) {
              console.error("   Error message:", error.message);
            }
            return done(error, null);
          }
        }
      )
    );
  }

  // Apple Sign-In Strategy (using Passport with OpenID Connect)
  // Note: Apple Sign-In requires additional setup with @passport-next/passport-apple
  // For now, we'll add the route structure but implementation will need apple-oauth2 package

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });

  // Google Auth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("❌ Google OAuth error:", err);
          if (err.name === "TokenError" || err.message?.includes("Bad Request")) {
            console.error("   This usually means:");
            console.error("   1. GOOGLE_CALLBACK_URL doesn't match Google Console");
            console.error("   2. GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is wrong");
            console.error("   3. The callback URL in Google Console must be: http://localhost:5173/api/auth/google/callback");
            return res.redirect("/?error=google_oauth_config");
          }
          return res.redirect("/?error=google_failed");
        }
        if (!user) {
          return res.redirect("/?error=google_failed");
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("❌ Login error:", loginErr);
            return res.redirect("/?error=login_failed");
          }
          return res.redirect("/");
        });
      })(req, res, next);
    }
  );

  // Error handler for OAuth failures
  app.use("/api/auth/google/callback", (err: any, req: any, res: any, next: any) => {
    console.error("Google OAuth callback error:", err);
    if (err.name === "TokenError" || err.message?.includes("Bad Request")) {
      return res.redirect("/?error=google_oauth_config&message=" + encodeURIComponent("Google OAuth configuration error. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in .env"));
    }
    res.redirect("/?error=google_failed");
  });

  // Apple Sign-In Routes
  app.get("/api/auth/apple", (req, res) => {
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_REDIRECT_URI) {
      return res.status(500).json({ message: "Apple Sign-In not configured" });
    }
    
    const redirectUri = encodeURIComponent(process.env.APPLE_REDIRECT_URI);
    const clientId = process.env.APPLE_CLIENT_ID;
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection
    
    // Store state in session
    (req.session as any).appleState = state;
    
    const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code id_token&scope=email name&response_mode=form_post&state=${state}`;
    res.redirect(authUrl);
  });

  app.post("/api/auth/apple/callback", async (req, res) => {
    try {
      // Verify state
      const state = (req.session as any)?.appleState;
      if (!state || req.body.state !== state) {
        return res.redirect("/login?error=apple_state_mismatch");
      }
      
      delete (req.session as any).appleState;
      
      // Get ID token from Apple response
      const idToken = req.body.id_token;
      if (!idToken) {
        return res.redirect("/login?error=apple_no_token");
      }

      // Verify Apple ID token
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return res.redirect("/login?error=apple_invalid_token");
      }

      // Verify token signature using Apple's public keys
      const client = jwksClient({
        jwksUri: "https://appleid.apple.com/auth/keys",
        cache: true,
        cacheMaxAge: 86400000, // 24 hours
      });

      const getKey = (header: any, callback: any) => {
        client.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      };

      // Verify token
      jwt.verify(idToken, getKey as any, {
        audience: process.env.APPLE_CLIENT_ID,
        issuer: "https://appleid.apple.com",
      }, async (err, decodedToken) => {
        if (err) {
          console.error("Apple token verification error:", err);
          return res.redirect("/login?error=apple_verification_failed");
        }

        const token = decodedToken as any;
        const userId = token.sub; // Apple user ID
        
        // Extract user info
        const email = token.email || req.body.email || "";
        const name = token.name || req.body.user;
        let firstName = "";
        let lastName = "";
        
        if (name && typeof name === 'object') {
          firstName = name.firstName || "";
          lastName = name.lastName || "";
        }

        // Create or update user
        try {
          const user = await storage.upsertUser({
            id: `apple_${userId}`, // Prefix to avoid conflicts with Google IDs
            email,
            firstName,
            lastName,
            profileImageUrl: "", // Apple doesn't provide profile images
          });

          // Log user in
          req.login(user, (err) => {
            if (err) {
              console.error("Login error:", err);
              return res.redirect("/login?error=apple_login_failed");
            }
            res.redirect("/");
          });
        } catch (error) {
          console.error("Error creating/updating user:", error);
          res.redirect("/login?error=apple_user_creation_failed");
        }
      });
    } catch (error) {
      console.error("Apple callback error:", error);
      res.redirect("/login?error=apple_callback_error");
    }
  });

  // Logout
  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

