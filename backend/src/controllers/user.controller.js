import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"

import crypto from "crypto"
import { OAuth2Client } from "google-auth-library";
import { Meeting } from "../models/meeting.model.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail
} from "../utils/email.js";

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);


const SESSION_TIME = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TIME = 15 * 60 * 1000;
const RESET_PASSWORD_TIME = 15 * 60 * 1000;


const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;


const createSession = async (user) => {

    let token = crypto.randomBytes(32).toString("hex");

    user.token = token;

    user.tokenExpires = new Date(
        Date.now() + SESSION_TIME
    );

    await user.save();

    return token;
}


const login = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Please Provide"
        })
    }

    try {

        const user = await User.findOne({
            username: username
        });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: "User Not Found"
            })
        }


        if (!user.password) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Please login using Google or reset your password"
            })
        }


        let isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            )


        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Username or password"
            })
        }


        if (user.email && !user.emailVerified) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Please verify your email before login"
            })
        }


        const token = await createSession(user);


        return res.status(httpStatus.OK).json({
            token: token
        })

    } catch (e) {

        console.log(e);

        return res.status(500).json({
            message: `Something went wrong ${e}`
        })

    }
}


const register = async (req, res) => {

    const {
        name,
        username,
        email,
        password
    } = req.body;


    if (
        !name ||
        !username ||
        !email ||
        !password
    ) {
        return res.status(400).json({
            message: "Please Provide All Details"
        })
    }


    if (!usernamePattern.test(username)) {

        return res.status(400).json({
            message: "Username must be 3-20 characters and contain only letters, numbers or underscore"
        })

    }


    if (password.length < 6) {

        return res.status(400).json({
            message: "Password must be at least 6 characters"
        })

    }


    const normalizedEmail =
        email.toLowerCase().trim();


    try {

        const existingUsername =
            await User.findOne({
                username: username
            });


        if (existingUsername) {

            return res.status(
                httpStatus.CONFLICT
            ).json({
                message: "Username already exists"
            });

        }


        const existingEmail =
            await User.findOne({
                email: normalizedEmail
            });


        if (existingEmail) {

            return res.status(
                httpStatus.CONFLICT
            ).json({
                message: "Email already exists"
            });

        }


        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        const verificationToken =
            crypto.randomBytes(32).toString("hex");


        const hashedVerificationToken =
            crypto
                .createHash("sha256")
                .update(verificationToken)
                .digest("hex");


        const newUser = new User({

            name: name,

            username: username,

            email: normalizedEmail,

            password: hashedPassword,

            emailVerified: false,

            verificationToken:
                hashedVerificationToken,

            verificationTokenExpires:
                new Date(
                    Date.now() +
                    VERIFICATION_TIME
                )

        });


        await newUser.save();


        await sendVerificationEmail(
            normalizedEmail,
            name,
            verificationToken
        );


        return res.status(
            httpStatus.CREATED
        ).json({
            message:
                "User Registered. Please verify your email."
        })


    } catch (e) {

        console.log(e);

        return res.status(500).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const verifyEmail = async (req, res) => {

    const { token } = req.query;


    if (!token) {

        return res.status(400).json({
            message:
                "Verification token is required"
        })

    }


    try {

        const hashedVerificationToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");


        const user = await User.findOne({

            verificationToken:
                hashedVerificationToken,

            verificationTokenExpires:
                {
                    $gt: new Date()
                }

        });


        if (!user) {

            return res.status(
                httpStatus.BAD_REQUEST
            ).json({
                message:
                    "Invalid or expired verification link"
            })

        }


        user.emailVerified = true;

        user.verificationToken = undefined;

        user.verificationTokenExpires = undefined;


        await user.save();


        return res.status(
            httpStatus.OK
        ).json({
            message:
                "Email verified successfully"
        })


    } catch (e) {

        console.log(e);

        return res.status(500).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const resendVerificationEmail = async (
    req,
    res
) => {

    const { email } = req.body;


    if (!email) {

        return res.status(400).json({
            message: "Email is required"
        })

    }


    const normalizedEmail =
        email.toLowerCase().trim();


    try {

        const user = await User.findOne({
            email: normalizedEmail
        });


        if (
            !user ||
            user.emailVerified
        ) {

            return res.status(
                httpStatus.OK
            ).json({
                message:
                    "If the account exists and needs verification, a new verification email has been sent."
            })

        }


        const verificationToken =
            crypto.randomBytes(32).toString("hex");


        const hashedVerificationToken =
            crypto
                .createHash("sha256")
                .update(verificationToken)
                .digest("hex");


        user.verificationToken =
            hashedVerificationToken;


        user.verificationTokenExpires =
            new Date(
                Date.now() +
                VERIFICATION_TIME
            );


        await user.save();


        await sendVerificationEmail(
            normalizedEmail,
            user.name,
            verificationToken
        );


        return res.status(
            httpStatus.OK
        ).json({
            message:
                "If the account exists and needs verification, a new verification email has been sent."
        })


    } catch (e) {

        console.log(e);

        return res.status(500).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const googleLogin = async (req, res) => {

    const {
        credential,
        username
    } = req.body;


    if (!credential) {

        return res.status(400).json({
            message:
                "Google credential is required"
        })

    }


    if (username) {

        if (!usernamePattern.test(username)) {

            return res.status(400).json({
                message:
                    "Username must be 3-20 characters and contain only letters, numbers or underscore"
            })

        }

    }


    try {

        const ticket =
            await googleClient.verifyIdToken({

                idToken:
                    credential,

                audience:
                    process.env.GOOGLE_CLIENT_ID

            });


        const payload =
            ticket.getPayload();


        if (!payload) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid Google credential"
            })

        }


        const googleId =
            payload.sub;

        const email =
            payload.email;

        const name =
            payload.name;

        const avatar =
           
