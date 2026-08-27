import axios from "axios";

import React, {
    createContext,
    useEffect,
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

    const router =
        useNavigate();


    const [userData, setUserData] =
        useState(null);


    const [authLoading, setAuthLoading] =
        useState(true);


    const [isAuthenticated, setIsAuthenticated] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Validate Existing Session
    |--------------------------------------------------------------------------
    */

    const validateStoredSession =
        async () => {

            const token =
                localStorage.getItem(
                    "token"
                );


            if (!token) {

                setUserData(null);

                setIsAuthenticated(
                    false
                );

                setAuthLoading(
                    false
                );

                return false;

            }


            try {

                const request =
                    await client.get(
                        "/validate-session",
                        {
                            params: {
                                token
                            }
                        }
                    );


                if (
                    request.status === 200
                ) {

                    setIsAuthenticated(
                        true
                    );


                    /*
                    ----------------------------------------------------------
                    Restore basic user information from localStorage
                    if available.
                    ----------------------------------------------------------
                    */

                    const storedUser =
                        localStorage.getItem(
                            "user"
                        );


                    if (storedUser) {

                        try {

                            setUserData(
                                JSON.parse(
                                    storedUser
                                )
                            );

                        } catch (
                            parseError
                        ) {

                            console.log(
                                "Unable to restore stored user:",
                                parseError
                            );

                        }

                    }


                    return true;

                }


                throw new Error(
                    "Invalid session"
                );


            } catch (error) {

                console.error(
                    "Session validation failed:",
                    error
                );


                localStorage.removeItem(
                    "token"
                );


                localStorage.removeItem(
                    "user"
                );


                setUserData(null);

                setIsAuthenticated(
                    false
                );


                return false;

            } finally {

                setAuthLoading(
                    false
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Validate Session On App Start
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        validateStoredSession();

    }, []);


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


                const data =
                    request.data;


                if (
                    !data ||
                    !data.token
                ) {

                    throw new Error(
                        "Google login failed"
                    );

                }


                /*
                --------------------------------------------------------------
                Save session
                --------------------------------------------------------------
                */

                localStorage.setItem(
                    "token",
                    data.token
                );


                if (
                    data.user
                ) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            data.user
                        )
                    );


                    setUserData(
                        data.user
                    );

                }


                setIsAuthenticated(
                    true
                );


                return data;


            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                throw error;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const handleLogout =
        async () => {

            const token =
                localStorage.getItem(
                    "token"
                );


            try {

                if (token) {

                    await client.post(
                        "/logout",
                        {
                            token
                        }
                    );

                }

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            } finally {

                localStorage.removeItem(
                    "token"
                );


                localStorage.removeItem(
                    "user"
                );


                setUserData(
                    null
                );


                setIsAuthenticated(
                    false
                );


                router(
                    "/auth"
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Create Meeting
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


            } catch (error) {

                console.error(
                    "Create meeting error:",
                    error
                );


                throw error;

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
                        `/meeting/${encodeURIComponent(
                            cleanCode
                        )}`
                    );


                return request.data;


            } catch (error) {

                console.error(
                    "Validate meeting error:",
                    error
                );


                throw error;

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


                if (!token) {

                    throw new Error(
                        "Authentication required"
                    );

                }


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


            } catch (error) {

                /*
                --------------------------------------------------------------
                If the session has expired, clear it.
                --------------------------------------------------------------
                */

                if (
                    error.response?.status ===
                    401
                ) {

                    localStorage.removeItem(
                        "token"
                    );


                    localStorage.removeItem(
                        "user"
                    );


                    setUserData(null);

                    setIsAuthenticated(
                        false
                    );

                }


                throw error;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Add Meeting To History
    |--------------------------------------------------------------------------
    */

    const addToUserHistory =
        async (
            meetingCode,
            action = "joined"
        ) => {

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
                        "/add_to_activity",
                        {

                            token,

                            meeting_code:
                                meetingCode,

                            action:
                                action

                        }
                    );


                return request.data;


            } catch (error) {

                console.error(
                    "Add meeting history error:",
                    error
                );


                throw error;

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Context Value
    |--------------------------------------------------------------------------
    */

    const data = {

        userData,

        setUserData,

        authLoading,

        isAuthenticated,

        handleGoogleLogin,

        handleLogout,

        createMeeting,

        validateMeeting,

        getHistoryOfUser,

        addToUserHistory

    };


    /*
    |--------------------------------------------------------------------------
    | Authentication Loading Screen
    |--------------------------------------------------------------------------
    */

    if (
        authLoading
    ) {

        return (

            <div
                style={{
                    minHeight:
                        "100vh",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    background:
                        "#f7f9fc",

                    color:
                        "#667085",

                    fontFamily:
                        "Arial, sans-serif"
                }}
            >

                Checking session...

            </div>

        );

    }


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
