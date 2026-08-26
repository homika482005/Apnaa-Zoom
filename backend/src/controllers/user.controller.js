import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"

import crypto from "crypto"
import { OAuth2Client } from "google-auth-library";
import { Meeting } from "../models/meeting.model.js";
import { sendVerificationEmail } from "../utils/email.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const login = async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide" })
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }

        if (!user.password) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Please login using Google"
            })
        }

        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {

            if (user.email && !user.emailVerified) {
                return res.status(httpStatus.UNAUTHORIZED).json({
                    message: "Please verify your email before login"
                })
            }

            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();

            return res.status(httpStatus.OK).json({ token: token })

        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Username or password"
            })
        }

    } catch (e) {
        return res.status(500).json({
            message: `Something went wrong ${e}`
        })
    }
}


const register = async (req, res) => {

    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({
            message: "Please Provide All Details"
        })
    }

    try {

        const existingUsername = await User.findOne({ username });

        if (existingUsername) {
            return res.status(httpStatus.FOUND).json({
                message: "Username already exists"
            });
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(httpStatus.FOUND).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const hashedVerificationToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: hashedPassword,
            emailVerified: false,
            verificationToken: hashedVerificationToken,
            verificationTokenExpires: new Date(Date.now() + 15 * 60 * 1000)
        });

        await newUser.save();

        await sendVerificationEmail(
            email,
            name,
            verificationToken
        );

        res.status(httpStatus.CREATED).json({
            message: "User Registered. Please verify your email."
        })

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: `Something went wrong ${e}`
        })
    }

}


const verifyEmail = async (req, res) => {

    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            message: "Verification token is required"
        })
    }

    try {

        const hashedVerificationToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            verificationToken: hashedVerificationToken,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: "Invalid or expired verification link"
            })
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        res.status(httpStatus.OK).json({
            message: "Email verified successfully"
        })

    } catch (e) {
        res.status(500).json({
            message: `Something went wrong ${e}`
        })
    }
}


const googleLogin = async (req, res) => {

    const { credential, username } = req.body;

    if (!credential) {
        return res.status(400).json({
            message: "Google credential is required"
        })
    }

    try {

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Google credential"
            })
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        const avatar = payload.picture;

        if (!googleId || !email || !name) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                message: "Invalid Google account information"
            })
        }

        const existingGoogleUser = await User.findOne({ googleId: googleId });

        if (existingGoogleUser) {

            let token = crypto.randomBytes(20).toString("hex");

            existingGoogleUser.token = token;
            await existingGoogleUser.save();

            return res.status(httpStatus.OK).json({
                token: token
            })
        }


        const existingEmailUser = await User.findOne({ email: email });

        if (existingEmailUser) {

            return res.status(httpStatus.CONFLICT).json({
                message: "An ApnaaZoom account already exists with this email. Please login with your existing account first."
            })
        }


        if (!username) {

            return res.status(httpStatus.OK).json({
                requiresUsername: true,
                name: name,
                email: email,
                avatar: avatar
            })
        }


        const existingUsername = await User.findOne({ username: username });

        if (existingUsername) {

            return res.status(httpStatus.FOUND).json({
                message: "Username already exists"
            })
        }


        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: null,
            emailVerified: true,
            googleId: googleId,
            avatar: avatar
        });

        await newUser.save();

        let token = crypto.randomBytes(20).toString("hex");

        newUser.token = token;
        await newUser.save();

        res.status(httpStatus.CREATED).json({
            token: token
        })

    } catch (e) {

        console.log(e);

        return res.status(httpStatus.UNAUTHORIZED).json({
            message: "Google authentication failed"
        })
    }
}


const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        const meetings = await Meeting.find({ user_id: user.username })
        res.json(meetings)
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({
            message: "Added code to history"
        })

    } catch (e) {
        res.json({
            message: `Something went wrong ${e}`
        })
    }
}


export {
    login,
    register,
    verifyEmail,
    googleLogin,
    getUserHistory,
    addToHistory
}
