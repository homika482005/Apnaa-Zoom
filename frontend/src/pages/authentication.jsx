import * as React from "react";

import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import {
    createTheme,
    ThemeProvider
} from "@mui/material/styles";

import {
    Snackbar,
    Typography
} from "@mui/material";

import {
    GoogleLogin
} from "@react-oauth/google";

import {
    useNavigate
} from "react-router-dom";

import { AuthContext } from "../contexts/AuthContext";


const defaultTheme = createTheme();


export default function Authentication() {

    const router = useNavigate();


    const [error, setError] =
        React.useState("");

    const [message, setMessage] =
        React.useState("");

    const [open, setOpen] =
        React.useState(false);

    const [loading, setLoading] =
        React.useState(false);


    const {
        handleGoogleLogin
    } = React.useContext(AuthContext);


    const showMessage = (value) => {

        setMessage(value);
        setOpen(true);

    };


    const handleGoogleSuccess = async (
        credentialResponse
    ) => {

        try {

            setError("");
            setLoading(true);


            if (
                !credentialResponse ||
                !credentialResponse.credential
            ) {

                throw new Error(
                    "Google authentication response is missing"
                );

            }


            const result =
                await handleGoogleLogin(
                    credentialResponse.credential
                );


            if (!result || !result.token) {

                throw new Error(
                    "Google login failed"
                );

            }


            localStorage.setItem(
                "token",
                result.token
            );


            showMessage(
                "Google login successful"
            );


            router("/home");


        } catch (err) {

            console.error(
                "Google login error:",
                err
            );


            setError(
                err.response?.data?.message ||
                err.message ||
                "Google login failed"
            );

        } finally {

            setLoading(false);

        }

    };


    const handleGoogleError = () => {

        setError(
            "Google login failed. Please try again."
        );

    };


    return (

        <ThemeProvider theme={defaultTheme}>

            <Grid
                container
                component="main"
                sx={{
                    minHeight: "100vh"
                }}
            >

                <CssBaseline />


                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage:
                            "url(https://source.unsplash.com/random?wallpapers)",
                        backgroundRepeat:
                            "no-repeat",
                        backgroundColor: (theme) =>
                            theme.palette.mode === "light"
                                ? theme.palette.grey[50]
                                : theme.palette.grey[900],
                        backgroundSize:
                            "cover",
                        backgroundPosition:
                            "center"
                    }}
                />


                <Grid
                    item
                    xs={12}
                    sm={8}
                    md={5}
                    component={Paper}
                    elevation={6}
                    square
                >

                    <Box
                        sx={{
                            my: 12,
                            mx: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                    >

                        <Avatar
                            sx={{
                                m: 1,
                                bgcolor:
                                    "secondary.main"
                            }}
                        >

                            <LockOutlinedIcon />

                        </Avatar>


                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{
                                mt: 2,
                                mb: 1,
                                fontWeight: 600
                            }}
                        >
                            Welcome to ApnaaZoom
                        </Typography>


                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                mb: 4,
                                textAlign: "center"
                            }}
                        >
                            Sign in securely with your Google account
                        </Typography>


                        {error && (

                            <Typography
                                sx={{
                                    color: "red",
                                    mb: 3,
                                    textAlign: "center"
                                }}
                            >
                                {error}
                            </Typography>

                        )}


                        <Box
                            sx={{
                                width: "100%",
                                maxWidth: 420,
                                display: "flex",
                                justifyContent: "center"
                            }}
                        >

                            <GoogleLogin
                                onSuccess={
                                    handleGoogleSuccess
                                }
                                onError={
                                    handleGoogleError
                                }
                                useOneTap
                            />

                        </Box>


                        {loading && (

                            <Typography
                                sx={{
                                    mt: 3,
                                    color: "text.secondary"
                                }}
                            >
                                Signing you in...
                            </Typography>

                        )}


                        <Box
                            sx={{
                                mt: 5,
                                textAlign: "center"
                            }}
                        >

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                No password required
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Use your Google account to access ApnaaZoom.
                            </Typography>

                        </Box>


                        {loading && (

                            <Button
                                disabled
                                sx={{
                                    mt: 3
                                }}
                            >
                                Please wait...
                            </Button>

                        )}

                    </Box>

                </Grid>

            </Grid>


            <Snackbar
                open={open}
                autoHideDuration={3000}
                message={message}
                onClose={() =>
                    setOpen(false)
                }
            />

        </ThemeProvider>

    );

}
