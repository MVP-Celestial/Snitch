import { Router } from "express"
import {validateRegisterUser, validateLoginUser} from "../validator/auth.validator.js"
import { register, login, googleCallback } from "../controllers/auth.controller.js";
import passport from "passport";
import {config} from "../config/config.js"
import { authenticateUser } from "../middleware/auth.middleware.js";
import { getMe } from "../controllers/user.controller.js";

const router = Router();

// register on the right  has no (). Why? Because we're not saying:"Run this function right now."We're saying:
// "Express, here is a function. Run it when someone makes a POST request to /register."
router.post('/register', validateRegisterUser, register)

router.post('/login', validateLoginUser,login)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: config.NODE_ENV === "development" ? "http://localhost:5173/login" : "/login"  }), // responsible for taking the authcode from server to google and bring userdata from google in exchange of authcode
  googleCallback
);

/**
 * @route GET /auth/me
 * @desc Get the authenticated user's information
 * @access Private
 */

router.get('/me',authenticateUser,getMe )


export default router



//the main purpose of a routes file is to match incoming web requests (based on the URL path and HTTP method) and direct them to the correct controller and action


