import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Google OAuth configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.CLIENT_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Google profile:", profile);

      // Logic to store user data in the database
      const user = {
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
      };

      return done(null, profile);
    }
  )
);

// Cerealization user into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserealization user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Route for Google OAuth authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route for Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// Route to get user profile
router.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});

// Route to logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

export default router;
