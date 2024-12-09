import express from "express";
// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Google OAuth configuration
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: `${
//         process.env.SERVER_URL || "https://chat-app-test-cllw.onrender.com"
//       }/auth/google/callback`,
//     },
//     (accessToken, refreshToken, profile, done) => {
//       console.log("Google profile:", profile);

//       // Logic to store user data in the database
//       const user = {
//         googleId: profile.id,
//         displayName: profile.displayName,
//         email: profile.emails[0].value,
//       };

//       return done(null, profile);
//     }
//   )
// );

// // Cerealization user into session
// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// // Deserealization user from session
// passport.deserializeUser((user, done) => {
//   console.log("Deserializing user:", user);
//   done(null, user);
// });

// // Route for Google OAuth authentication
// router.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // Route for Google OAuth callback
// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "/",
//   }),
//   (req, res) => {
//     console.log("User authenticated:", req.user);
//     res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
//   }
// );

// Route to get user profile
router.get("/profile", (req, res) => {
  // console.log("Session in /profile:", req.session);
  // console.log("Cookies in /profile:", req.cookies);
  // console.log("User in /profile:", req.user);
  // if (req.isAuthenticated()) {
  //   res.json(req.user);
  // } else {
  //   res.status(401).json({ error: "User not authenticated" });
  // }

  res.status(401).json({ error: "Authorization is disabled." });
});

// Route to logout
// router.get("/logout", (req, res) => {
//   req.logout(() => {
//     res.redirect(process.env.CLIENT_URL || "/");
//   });
// });

router.get("/logout", (req, res) => {
  res.json({ message: "Logout not available." });
});

export default router;
