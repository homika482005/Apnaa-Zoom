import {
    Router
} from "express";


import {
    googleLogin,
    logout,
    validateSession,
    validateMeeting,
    createMeeting,
    getUserHistory,
    addToHistory
} from "../controllers/user.controller.js";


const router =
    Router();


/*
|--------------------------------------------------------------------------
| Google Authentication
|--------------------------------------------------------------------------
*/

router.post(
    "/google",
    googleLogin
);


/*
|--------------------------------------------------------------------------
| Session
|--------------------------------------------------------------------------
*/

router.get(
    "/validate-session",
    validateSession
);


router.post(
    "/logout",
    logout
);


/*
|--------------------------------------------------------------------------
| Meetings
|--------------------------------------------------------------------------
*/

router.post(
    "/meetings",
    createMeeting
);


router.get(
    "/meeting/:code",
    validateMeeting
);


/*
|--------------------------------------------------------------------------
| User History
|--------------------------------------------------------------------------
*/

router.get(
    "/get_all_activity",
    getUserHistory
);


router.post(
    "/add_to_activity",
    addToHistory
);


export default router;
