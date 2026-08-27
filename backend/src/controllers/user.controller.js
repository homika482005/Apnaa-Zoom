import httpStatus from "http-status";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import {
    MeetingHistory
} from "../models/meetingHistory.model.js";


const googleClient =
    new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID
    );


const SESSION_TIME =
    7 * 24 * 60 * 60 * 1000;


/*
|--------------------------------------------------------------------------
| Create Session
|--------------------------------------------------------------------------
*/

const createSession = async (
    user
) => {

    const token =
        crypto
            .randomBytes(32)
            .toString("hex");


    user.token =
        token;


    user.tokenExpires =
        new Date(
            Date.now() +
            SESSION_TIME
        );


    await user.save();


    return token;

};


/*
|--------------------------------------------------------------------------
| Validate Session
|--------------------------------------------------------------------------
*/

const validateSession = async (
    req,
    res
) => {

    const {
        token
    } = req.query;


    if (!token) {

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({

            message:
                "Authentication token is required"

        });

    }


    try {

        const user =
            await User.findOne({

                token:
                    token,

                tokenExpires: {
                    $gt:
                        new Date()
                }

            });


        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Invalid or expired token"

            });

        }


        return res.status(
            httpStatus.OK
        ).json({

            message:
                "Session is valid"

        });


    } catch (error) {

        console.error(
            "Session validation error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Something went wrong"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Google Login
|--------------------------------------------------------------------------
*/

const googleLogin = async (
    req,
    res
) => {

    const {
        credential
    } = req.body;


    if (!credential) {

        return res.status(
            httpStatus.BAD_REQUEST
        ).json({

            message:
                "Google credential is required"

        });

    }


    try {

        /*
        --------------------------------------------------------------
        Verify Google ID token
        --------------------------------------------------------------
        */

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

            });

        }


        /*
        --------------------------------------------------------------
        Google information
        --------------------------------------------------------------
        */

        const googleId =
            payload.sub;


        const email =
            payload.email;


        const name =
            payload.name ||
            "ApnaaZoom User";


        const avatar =
            payload.picture ||
            "";


        const emailVerified =
            payload.email_verified;


        if (
            !googleId ||
            !email
        ) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Invalid Google account information"

            });

        }


        if (!emailVerified) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Google email is not verified"

            });

        }


        const normalizedEmail =
            email
                .toLowerCase()
                .trim();


        /*
        --------------------------------------------------------------
        Find existing user
        --------------------------------------------------------------
        */

        let user =
            await User.findOne({

                googleId:
                    googleId

            });


        if (!user) {

            user =
                await User.findOne({

                    email:
                        normalizedEmail

                });

        }


        /*
        --------------------------------------------------------------
        Existing user
        --------------------------------------------------------------
        */

        if (user) {

            user.googleId =
                googleId;


            user.email =
                normalizedEmail;


            user.name =
                name;


            user.avatar =
                avatar;


            const token =
                await createSession(
                    user
                );


            return res.status(
                httpStatus.OK
            ).json({

                token:
                    token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    username:
                        user.username,

                    avatar:
                        user.avatar

                }

            });

        }


        /*
        --------------------------------------------------------------
        New Google user
        --------------------------------------------------------------
        */

        let baseUsername =
            normalizedEmail
                .split("@")[0]
                .replace(
                    /[^a-zA-Z0-9_]/g,
                    "_"
                )
                .toLowerCase();


        if (
            baseUsername.length < 3
        ) {

            baseUsername =
                "user";

        }


        if (
            baseUsername.length > 20
        ) {

            baseUsername =
                baseUsername.substring(
                    0,
                    20
                );

        }


        let username =
            baseUsername;


        let counter =
            1;


        while (
            await User.findOne({
                username:
                    username
            })
        ) {

            const suffix =
                String(counter);


            const maxLength =
                20 -
                suffix.length;


            username =
                baseUsername.substring(
                    0,
                    maxLength
                ) +
                suffix;


            counter++;

        }


        /*
        --------------------------------------------------------------
        Create user
        --------------------------------------------------------------
        */

        user =
            new User({

                name:
                    name,

                username:
                    username,

                email:
                    normalizedEmail,

                googleId:
                    googleId,

                avatar:
                    avatar

            });


        await user.save();


        const token =
            await createSession(
                user
            );


        return res.status(
            httpStatus.CREATED
        ).json({

            token:
                token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                username:
                    user.username,

                avatar:
                    user.avatar

            }

        });


    } catch (error) {

        console.error(
            "Google authentication error:",
            error
        );


        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({

            message:
                "Google authentication failed"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Create New Meeting
|--------------------------------------------------------------------------
*/

const createMeeting = async (
    req,
    res
) => {

    const {
        token
    } = req.body;


    if (!token) {

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({

            message:
                "Authentication token is required"

        });

    }


    try {

        /*
        --------------------------------------------------------------
        Validate user
        --------------------------------------------------------------
        */

        const user =
            await User.findOne({

                token:
                    token,

                tokenExpires: {
                    $gt:
                        new Date()
                }

            });


        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Invalid or expired token"

            });

        }


        /*
        --------------------------------------------------------------
        Generate unique meeting code
        --------------------------------------------------------------
        */

        let meetingCode =
            "";


        let existingMeeting =
            null;


        do {

            meetingCode =
                crypto
                    .randomBytes(5)
                    .toString("hex")
                    .substring(
                        0,
                        8
                    );


            existingMeeting =
                await Meeting.findOne({

                    meetingCode:
                        meetingCode

                });

        } while (
            existingMeeting
        );


        /*
        --------------------------------------------------------------
        Create meeting
        --------------------------------------------------------------
        */

        const meeting =
            new Meeting({

                meetingCode:
                    meetingCode,

                createdBy:
                    user.username

            });


        await meeting.save();


        /*
        --------------------------------------------------------------
        Create creator's history
        --------------------------------------------------------------
        */

        await MeetingHistory.create({

            user_id:
                user.username,

            meeting:
                meeting._id,

            meetingCode:
                meeting.meetingCode,

            action:
                "created"

        });


        return res.status(
            httpStatus.CREATED
        ).json({

            message:
                "Meeting created successfully",

            meetingCode:
                meeting.meetingCode,

            date:
                meeting.createdAt

        });


    } catch (error) {

        console.error(
            "Create meeting error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Unable to create meeting"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Validate Meeting
|--------------------------------------------------------------------------
*/

const validateMeeting = async (
    req,
    res
) => {

    const meetingCode =
        String(
            req.params.code ||
            ""
        ).trim();


    if (!meetingCode) {

        return res.status(
            httpStatus.BAD_REQUEST
        ).json({

            message:
                "Meeting code is required"

        });

    }


    try {

        const meeting =
            await Meeting.findOne({

                meetingCode:
                    meetingCode

            });


        if (!meeting) {

            return res.status(
                httpStatus.NOT_FOUND
            ).json({

                message:
                    "Meeting not found"

            });

        }


        return res.status(
            httpStatus.OK
        ).json({

            valid:
                true,

            meetingCode:
                meeting.meetingCode,

            createdBy:
                meeting.createdBy,

            createdAt:
                meeting.createdAt

        });


    } catch (error) {

        console.error(
            "Meeting validation error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Unable to validate meeting"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

const logout = async (
    req,
    res
) => {

    const {
        token
    } = req.body;


    if (!token) {

        return res.status(
            httpStatus.OK
        ).json({

            message:
                "Logged out successfully"

        });

    }


    try {

        const user =
            await User.findOne({

                token:
                    token

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

        });


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Something went wrong"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Get User History
|--------------------------------------------------------------------------
*/

const getUserHistory = async (
    req,
    res
) => {

    const {
        token
    } = req.query;


    if (!token) {

        return res.status(
            httpStatus.UNAUTHORIZED
        ).json({

            message:
                "Authentication token is required"

        });

    }


    try {

        const user =
            await User.findOne({

                token:
                    token,

                tokenExpires: {
                    $gt:
                        new Date()
                }

            });


        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Invalid or expired token"

            });

        }


        const history =
            await MeetingHistory.find({

                user_id:
                    user.username

            })
            .populate(
                "meeting"
            )
            .sort({

                date:
                    -1

            });


        return res.status(
            httpStatus.OK
        ).json(
            history
        );


    } catch (error) {

        console.error(
            "Get history error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Something went wrong"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Add Meeting To User History
|--------------------------------------------------------------------------
*/

const addToHistory = async (
    req,
    res
) => {

    const {
        token,
        meeting_code,
        action = "joined"
    } = req.body;


    const cleanMeetingCode =
        String(
            meeting_code ||
            ""
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            );


    if (
        !token ||
        !cleanMeetingCode
    ) {

        return res.status(
            httpStatus.BAD_REQUEST
        ).json({

            message:
                "Token and meeting code are required"

        });

    }


    if (
        ![
            "created",
            "joined"
        ].includes(
            action
        )
    ) {

        return res.status(
            httpStatus.BAD_REQUEST
        ).json({

            message:
                "Invalid history action"

        });

    }


    try {

        /*
        --------------------------------------------------------------
        Validate user
        --------------------------------------------------------------
        */

        const user =
            await User.findOne({

                token:
                    token,

                tokenExpires: {
                    $gt:
                        new Date()
                }

            });


        if (!user) {

            return res.status(
                httpStatus.UNAUTHORIZED
            ).json({

                message:
                    "Invalid or expired token"

            });

        }


        /*
        --------------------------------------------------------------
        Find actual meeting
        --------------------------------------------------------------
        */

        const meeting =
            await Meeting.findOne({

                meetingCode:
                    cleanMeetingCode

            });


        if (!meeting) {

            return res.status(
                httpStatus.NOT_FOUND
            ).json({

                message:
                    "Meeting not found"

            });

        }


        /*
        --------------------------------------------------------------
        Prevent duplicate history
        --------------------------------------------------------------
        */

        const existingHistory =
            await MeetingHistory.findOne({

                user_id:
                    user.username,

                meeting:
                    meeting._id,

                action:
                    action

            });


        if (
            existingHistory
        ) {

            return res.status(
                httpStatus.OK
            ).json({

                message:
                    "Meeting already exists in history",

                meetingCode:
                    cleanMeetingCode,

                action:
                    action

            });

        }


        /*
        --------------------------------------------------------------
        Create history record
        --------------------------------------------------------------
        */

        const historyEntry =
            new MeetingHistory({

                user_id:
                    user.username,

                meeting:
                    meeting._id,

                meetingCode:
                    meeting.meetingCode,

                action:
                    action

            });


        await historyEntry.save();


        return res.status(
            httpStatus.CREATED
        ).json({

            message:
                "Meeting added to history",

            meetingCode:
                meeting.meetingCode,

            action:
                action

        });


    } catch (error) {

        console.error(
            "Add history error:",
            error
        );


        return res.status(
            httpStatus.INTERNAL_SERVER_ERROR
        ).json({

            message:
                "Something went wrong"

        });

    }

};


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {

    googleLogin,

    logout,

    validateSession,

    validateMeeting,

    createMeeting,

    getUserHistory,

    addToHistory

};
