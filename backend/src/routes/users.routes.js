import { Router } from "express";

import {
    googleLogin,
    logout,
    validateSession,
    getUserHistory,
    addToHistory
} from "../controllers/user.controller.js";


const router = Router();


/*
|--------------------------------------------------------------------------
| Google Authentication
|--------------------------------------------------------------------------
*/

router
    .route("/google")
    .post(googleLogin);


/*
|--------------------------------------------------------------------------
| Session
|--------------------------------------------------------------------------
*/

router
    .route("/logout")
    .post(logout);


router
    .route("/validate-session")
    .get(validateSession);


/*
|--------------------------------------------------------------------------
| Meeting History
|--------------------------------------------------------------------------
*/

router
    .route("/add_to_activity")
    .post(addToHistory);


router
    .route("/get_all_activity")
    .get(getUserHistory);


export default router;
