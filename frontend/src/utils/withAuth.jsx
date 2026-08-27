import React, {
    useContext,
    useEffect
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    AuthContext
} from "../contexts/AuthContext";


const withAuth = (
    WrappedComponent
) => {

    function AuthenticatedComponent(
        props
    ) {

        const navigate =
            useNavigate();


        const location =
            useLocation();


        const {
            isAuthenticated,
            authLoading
        } =
            useContext(
                AuthContext
            );


        useEffect(() => {

            if (
                authLoading
            ) {

                return;

            }


            if (
                !isAuthenticated
            ) {

                navigate(
                    "/auth",
                    {
                        replace:
                            true,

                        state: {
                            from:
                                location.pathname
                        }
                    }
                );

            }

        }, [
            isAuthenticated,
            authLoading,
            navigate,
            location.pathname
        ]);


        /*
        --------------------------------------------------------------
        Wait until AuthContext finishes checking the session.
        --------------------------------------------------------------
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
                    Checking authentication...
                </div>

            );

        }


        /*
        --------------------------------------------------------------
        Don't render protected page when not authenticated.
        --------------------------------------------------------------
        */

        if (
            !isAuthenticated
        ) {

            return null;

        }


        return (

            <WrappedComponent
                {...props}
            />

        );

    }


    AuthenticatedComponent.displayName =
        `withAuth(${
            WrappedComponent.displayName ||
            WrappedComponent.name ||
            "Component"
        })`;


    return (
        AuthenticatedComponent
    );

};


export default withAuth;
