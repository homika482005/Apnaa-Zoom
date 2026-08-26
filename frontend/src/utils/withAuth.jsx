import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import server from "../environment";


const withAuth = (WrappedComponent) => {

    const AuthComponent = (props) => {

        const router = useNavigate();

        const [checkingAuth, setCheckingAuth] =
            useState(true);


        useEffect(() => {

            let isMounted = true;


            const checkAuthentication = async () => {

                const token =
                    localStorage.getItem("token");


                if (!token) {

                    router("/auth", {
                        replace: true
                    });

                    return;

                }


                try {

                    await axios.get(
                        `${server}/api/v1/users/validate-session`,
                        {
                            params: {
                                token
                            }
                        }
                    );


                    if (isMounted) {

                        setCheckingAuth(false);

                    }

                } catch (error) {

                    console.error(
                        "Session validation failed:",
                        error
                    );


                    localStorage.removeItem(
                        "token"
                    );


                    if (isMounted) {

                        router("/auth", {
                            replace: true
                        });

                    }

                }

            };


            checkAuthentication();


            return () => {

                isMounted = false;

            };

        }, [router]);


        if (checkingAuth) {

            return (
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Arial, sans-serif"
                    }}
                >
                    Checking your session...
                </div>
            );

        }


        return (
            <WrappedComponent
                {...props}
            />
        );

    };


    return AuthComponent;

};


export default withAuth;
