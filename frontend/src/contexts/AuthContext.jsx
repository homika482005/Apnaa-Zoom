import axios from "axios";

import {
    createContext,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import server from "../environment";


export const AuthContext =
    createContext({});


const client =
    axios.create({
        baseURL:
            `${server}/api/v1/users`
    });


export const AuthProvider = ({
    children
}) => {

    const [userData, setUserData] =
        useState({});


    const router =
        useNavigate();


    /*
    |--------------------------------------------------------------------------
    | Google Login
    |--------------------------------------------------------------------------
    */

    const handleGoogleLogin =
        async (
            credential
        ) => {

            try {

                if (!credential) {

                    throw new Error(
                        "Google credential is missing"
                    );

                }


                const request =
                    await client.post(
                        "/google",
                        {
                            credential
                        }
                    );


                return request.data;

            } catch (err) {

                throw err;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const handleLogout =
        async () => {

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    );


                if (token) {

                    await client.post(
                        "/logout",
                        {
                            token
                        }
                    );

                }

            } catch (err) {

                console.error(
                    "Logout error:",
                    err
                );

            } finally {

                localStorage.removeItem(
                    "token"
                );


                setUserData({});


                router(
                    "/auth"
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Create New Meeting
    |--------------------------------------------------------------------------
    */

    const createMeeting =
        async () => {

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    );


                if (!token) {

                    throw new Error(
                        "Authentication required"
                    );

                }


                const request =
                    await client.post(
                        "/meetings",
                        {
                            token
                        }
                    );


                return request.data;

            } catch (err) {

                throw err;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Validate Meeting
    |--------------------------------------------------------------------------
    */

    const validateMeeting =
        async (
            meetingCode
        ) => {

            try {

                const cleanCode =
                    String(
                        meetingCode ||
                        ""
                    )
                        .trim()
                        .replace(
                            /\s+/g,
                            ""
                        );


                if (!cleanCode) {

                    throw new Error(
                        "Meeting code is required"
                    );

                }


                const request =
                    await client.get(
                        `/meeting/${encodeURIComponent(cleanCode)}`
                    );


                return request.data;

            } catch (err) {

                throw err;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Get Meeting History
    |--------------------------------------------------------------------------
    */

    const getHistoryOfUser =
        async () => {

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    );


                const request =
                    await client.get(
                        "/get_all_activity",
                        {
                            params: {
                                token
                            }
                        }
                    );


                return request.data;

            } catch (err) {

                throw err;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Add Existing Meeting To User History
    |--------------------------------------------------------------------------
    */

    const addToUserHistory =
        async (
            meetingCode
        ) => {

            try {

                const token =
                    localStorage.getItem(
                        "token"
                    );


                const request =
                    await client.post(
                        "/add_to_activity",
                        {
                            token,

                            meeting_code:
                                meetingCode
                        }
                    );


                return request.data;

            } catch (err) {

                throw err;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Context
    |--------------------------------------------------------------------------
    */

    const data = {

        userData,

        setUserData,

        handleGoogleLogin,

        handleLogout,

        createMeeting,

        validateMeeting,

        getHistoryOfUser,

        addToUserHistory

    };


    return (

        <AuthContext.Provider
            value={
                data
            }
        >

            {children}

        </AuthContext.Provider>

    );

};
