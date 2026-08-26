// import httpStatus from "http-status";
// import { User } from "../models/user.model.js";
// import bcrypt, { hash } from "bcrypt"

// import crypto from "crypto"
// import { Meeting } from "../models/meeting.model.js";

// const login = async (req, res) => {

//     const { username, password } = req.body;

//     if (!username || !password) {
//         return res.status(400).json({ message: "Please Provide" })
//     }

//     try { 
//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
//         }


//         let isPasswordCorrect = await bcrypt.compare(password, user.password)

//         if (isPasswordCorrect) {
//             let token = crypto.randomBytes(20).toString("hex");

//             user.token = token;
//             await user.save();
//             return res.status(httpStatus.OK).json({ token: token })
//         } else {
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
//         }

//     } catch (e) {
//         return res.status(500).json({ message: `Something went wrong ${e}` })
//     }
// }


// const register = async (req, res) => {
//     const { name, username, password } = req.body;

//     console.log("BODY:", req.body);
//     console.log("NAME:", name, "USERNAME:", username, "PASSWORD:", password);


//     try {
//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//             return res.status(httpStatus.FOUND).json({ message: "User already exists" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = new User({
//             name: name,
//             username: username,
//             password: hashedPassword
//         });

//         await newUser.save();

//         res.status(httpStatus.CREATED).json({ message: "User Registered" })

//     } catch (e) {
//         res.json({ message: `Something went wrong ${e}` })
//     }

// }


// const getUserHistory = async (req, res) => {
//     const { token } = req.query;

//     try {
//         const user = await User.findOne({ token: token });
//         const meetings = await Meeting.find({ user_id: user.username })
//         res.json(meetings)
//     } catch (e) {
//         res.json({ message: `Something went wrong ${e}` })
//     }
// }

// const addToHistory = async (req, res) => {
//     const { token, meeting_code } = req.body;

//     try {
//         const user = await User.findOne({ token: token });

//         const newMeeting = new Meeting({
//             user_id: user.username,
//             meetingCode: meeting_code
//         })

//         await newMeeting.save();

//         res.status(httpStatus.CREATED).json({ message: "Added code to history" })
//     } catch (e) {
//         res.json({ message: `Something went wrong ${e}` })


import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"

import crypto from "crypto"
import { Meeting } from "../models/meeting.model.js";
import { sendVerificationEmail } from "../utils/email.js";

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
    getUserHistory,
    addToHistory
}
//     }
// }


// export { login, register, getUserHistory, addToHistory }
