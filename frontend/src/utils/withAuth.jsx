import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import server from "../environment";


const withAuth = (WrappedComponent) => {

    const AuthComponent = (props) => {

        const router = useNavigate();


        const checkAuthentication = async () => {

            const token =
                localStorage.getItem("token");


            if (!token) {

                router("/auth");

                return;

            }


            try {

                await axios.get(
                    `${server}/api/v1/users/get_all_activity`,
                    {
                        params: {
                            token: token
                        }
                    }
                );

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


        return (
            <WrappedComponent
                {...props}
            />
        )

    }


    return AuthComponent;

}


export default withAuth;
