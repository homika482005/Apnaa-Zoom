import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import server from "../environment";


const withAuth = (WrappedComponent) => {

    const AuthComponent = (props) => {

        const router = useNavigate();

        const [loading, setLoading] =
            useState(true);


        const checkAuthentication = async () => {

            const token =
                localStorage.getItem("token");


            if (!token) {

                router("/auth");

                return;

            }


            try {

                await axios.get(
                    `${server}/api/v1/users/validate-session`,
                    {
                        params: {
                            token: token
                        }
                    }
                );

                setLoading(false);

            } catch (err) {

                console.log(
                    "Authentication failed",
                    err
                );

                localStorage.removeItem(
                    "token"
                );

                router("/auth");

            }

        }


        useEffect(() => {

            checkAuthentication();

        }, []);


        if (loading) {

            return (
                <div
                    style={{
                        height: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    Loading...
                </div>
            )

        }


        return (
            <WrappedComponent
                {...props}
            />
        )

    }


    return AuthComponent;

}


export default withAuth;
