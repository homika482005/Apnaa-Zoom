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


const validateSession = async (req, res) => {

    const { token } = req.query;

    if (!token) {

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({
            message:
                "Authentication token is required"
        })

    }

    try {

        const user = await User.findOne({

            token: token,

            tokenExpires: {
                $gt: new Date()
            }

        });

        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid or expired token"
            })

        }

        return res.status(
            httpStatus.OK
        ).json({
            message:
                "Session is valid"
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

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

            return res.status(
                httpStatus.NOT_FOUND
            ).json({
                message:
                    "User Not Found"
            })

        }

        if (!user.password) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Please login using Google or reset your password"
            })

        }

        let isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            )

        if (!isPasswordCorrect) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid Username or password"
            })

        }

        if (
            user.email &&
            !user.emailVerified
        ) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Please verify your email before login"
            })

        }

        const token =
            await createSession(user);

        return res.status(
            httpStatus.OK
        ).json({
            token: token
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
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
            message:
                "Please Provide All Details"
        })

    }

    if (!usernamePattern.test(username)) {

        return res.status(400).json({
            message:
                "Username must be 3-20 characters and contain only letters, numbers or underscore"
        })

    }

    if (password.length < 6) {

        return res.status(400).json({
            message:
                "Password must be at least 6 characters"
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
                message:
                    "Username already exists"
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
                message:
                    "Email already exists"
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

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
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

            verificationTokenExpires: {
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

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
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
            message:
                "Email is required"
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

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
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

    if (
        username &&
        !usernamePattern.test(username)
    ) {

        return res.status(400).json({
            message:
                "Username must be 3-20 characters and contain only letters, numbers or underscore"
        })

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
            payload.picture;

        const emailVerified =
            payload.email_verified;

        if (
            !googleId ||
            !email ||
            !name
        ) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid Google account information"
            })

        }

        if (!emailVerified) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Google email is not verified"
            })

        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingGoogleUser =
            await User.findOne({
                googleId: googleId
            });

        if (existingGoogleUser) {

            existingGoogleUser.email =
                normalizedEmail;

            existingGoogleUser.emailVerified =
                true;

            existingGoogleUser.avatar =
                avatar;

            const token =
                await createSession(
                    existingGoogleUser
                );

            return res.status(
                httpStatus.OK
            ).json({
                token: token
            })

        }

        const existingEmailUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingEmailUser) {

            existingEmailUser.googleId =
                googleId;

            existingEmailUser.avatar =
                avatar;

            existingEmailUser.emailVerified =
                true;

            const token =
                await createSession(
                    existingEmailUser
                );

            return res.status(
                httpStatus.OK
            ).json({
                token: token
            })

        }

        if (!username) {

            return res.status(
                httpStatus.OK
            ).json({

                requiresUsername:
                    true,

                name:
                    name,

                email:
                    normalizedEmail,

                avatar:
                    avatar

            })

        }

        const existingUsername =
            await User.findOne({
                username: username
            });

        if (existingUsername) {

            return res.status(
                httpStatus.CONFLICT
            ).json({
                message:
                    "Username already exists"
            })

        }

        const newUser =
            new User({

                name:
                    name,

                username:
                    username,

                email:
                    normalizedEmail,

                password:
                    undefined,

                emailVerified:
                    true,

                googleId:
                    googleId,

                avatar:
                    avatar

            });

        const token =
            await createSession(
                newUser
            );

        return res.status(
            httpStatus.CREATED
        ).json({
            token: token
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({
            message:
                "Google authentication failed"
        })

    }

}


const forgotPassword = async (
    req,
    res
) => {

    const { email } = req.body;

    if (!email) {

        return res.status(400).json({
            message:
                "Email is required"
        })

    }

    const normalizedEmail =
        email.toLowerCase().trim();

    try {

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {

            return res.status(
                httpStatus.OK
            ).json({
                message:
                    "If an account with this email exists, a password reset email has been sent."
            })

        }

        const resetToken =
            crypto.randomBytes(32).toString("hex");

        const hashedResetToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        user.resetPasswordToken =
            hashedResetToken;

        user.resetPasswordExpires =
            new Date(
                Date.now() +
                RESET_PASSWORD_TIME
            );

        await user.save();

        await sendPasswordResetEmail(
            normalizedEmail,
            user.name,
            resetToken
        );

        return res.status(
            httpStatus.OK
        ).json({
            message:
                "If an account with this email exists, a password reset email has been sent."
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const resetPassword = async (
    req,
    res
) => {

    const {
        token,
        password
    } = req.body;

    if (!token || !password) {

        return res.status(400).json({
            message:
                "Token and password are required"
        })

    }

    if (password.length < 6) {

        return res.status(400).json({
            message:
                "Password must be at least 6 characters"
        })

    }

    try {

        const hashedResetToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

        const user =
            await User.findOne({

                resetPasswordToken:
                    hashedResetToken,

                resetPasswordExpires: {
                    $gt: new Date()
                }

            });

        if (!user) {

            return res.status(
                httpStatus.BAD_REQUEST
            ).json({
                message:
                    "Invalid or expired password reset link"
            })

        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        user.password =
            hashedPassword;

        user.resetPasswordToken =
            undefined;

        user.resetPasswordExpires =
            undefined;

        user.token =
            undefined;

        user.tokenExpires =
            undefined;

        await user.save();

        return res.status(
            httpStatus.OK
        ).json({
            message:
                "Password reset successfully. Please login again."
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const logout = async (req, res) => {

    const { token } = req.body;

    if (!token) {

        return res.status(
            httpStatus.OK
        ).json({
            message:
                "Logged out successfully"
        })

    }

    try {

        const user =
            await User.findOne({
                token: token
            });

        if (user) {

            user.token =
                undefined;

            user.tokenExpires =
                undefined;

            await user.save();

        }

        return res.status(
            httpStatus.OK
        ).json({
            message:
                "Logged out successfully"
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const getUserHistory = async (
    req,
    res
) => {

    const { token } = req.query;

    if (!token) {

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({
            message:
                "Authentication token is required"
        })

    }

    try {

        const user =
            await User.findOne({

                token: token,

                tokenExpires: {
                    $gt: new Date()
                }

            });

        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid or expired token"
            })

        }

        const meetings =
            await Meeting.find({
                user_id:
                    user.username
            });

        return res.status(
            httpStatus.OK
        ).json(meetings)

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


const addToHistory = async (
    req,
    res
) => {

    const {
        token,
        meeting_code
    } = req.body;

    if (!token || !meeting_code) {

        return res.status(400).json({
            message:
                "Please Provide"
        })

    }

    try {

        const user =
            await User.findOne({

                token: token,

                tokenExpires: {
                    $gt: new Date()
                }

            });

        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({
                message:
                    "Invalid or expired token"
            })

        }

        const newMeeting =
            new Meeting({

                user_id:
                    user.username,

                meetingCode:
                    meeting_code

            });

        await newMeeting.save();

        return res.status(
            httpStatus.CREATED
        ).json({
            message:
                "Added code to history"
        })

    } catch (e) {

        console.log(e);

        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({
            message:
                `Something went wrong ${e}`
        })

    }

}


export {
    login,
    register,
    verifyEmail,
    resendVerificationEmail,
    googleLogin,
    forgotPassword,
    resetPassword,
    logout,
    validateSession,
    getUserHistory,
    addToHistory
}
