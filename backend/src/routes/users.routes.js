import { Router } from "express";

import {
    addToHistory,
    getUserHistory,
    login,
    register,
    verifyEmail,
    resendVerificationEmail,
    googleLogin,
    forgotPassword,
    resetPassword,
    logout,
    validateSession
} from "../controllers/user.controller.js";


const router = Router();


router.route("/login").post(login)

router.route("/register").post(register)

router.route("/verify-email").get(verifyEmail)

router.route("/resend-verification").post(
    resendVerificationEmail
)

router.route("/google").post(googleLogin)

router.route("/forgot-password").post(
    forgotPassword
)

router.route("/reset-password").post(
    resetPassword
)

router.route("/logout").post(logout)

router.route("/validate-session").get(
    validateSession
)

router.route("/add_to_activity").post(
    addToHistory
)

router.route("/get_all_activity").get(
    getUserHistory
)


export default router;
