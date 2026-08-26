// import { Router } from "express";
// import { addToHistory, getUserHistory, login, register } from "../controllers/user.controller.js";



// const router = Router();

// router.route("/login").post(login)
// router.route("/register").post(register)
// router.route("/add_to_activity").post(addToHistory)
// router.route("/get_all_activity").get(getUserHistory)

// export default router;
import { Router } from "express";
import {
    addToHistory,
    getUserHistory,
    login,
    register,
    verifyEmail
} from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/verify-email").get(verifyEmail)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

export default router;
