import * as React from 'react';
import {
    Box,
    Button,
    CircularProgress,
    TextField,
    Typography
} from '@mui/material';
import {
    useNavigate,
    useSearchParams
} from 'react-router-dom';

import { AuthContext } from '../contexts/AuthContext';


export default function ResetPassword() {

    const [searchParams] =
        useSearchParams();

    const router = useNavigate();


    const [password, setPassword] =
        React.useState("");

    const [confirmPassword, setConfirmPassword] =
        React.useState("");

    const [message, setMessage] =
        React.useState("");

    const [error, setError] =
        React.useState("");

    const [loading, setLoading] =
        React.useState(false);

    const [success, setSuccess] =
        React.useState(false);


    const {
        handleResetPassword
    } = React.useContext(AuthContext);


    const token =
        searchParams.get("token");


    const handleResetPasswordSubmit = async () => {

        try {

            setError("");
            setMessage("");


            if (!token) {

                setError(
                    "Password reset token is missing"
                );

                return;

            }


            if (!password || !confirmPassword) {

                setError(
                    "Please enter and confirm your new password"
                );

                return;

            }


            if (password.length < 6) {

                setError(
                    "Password must be at least 6 characters"
                );

                return;

            }


            if (password !== confirmPassword) {

                setError(
                    "Passwords do not match"
                );

                return;

            }


            setLoading(true);


            let result =
                await handleResetPassword(
                    token,
                    password
                );


            setMessage(result.message);

            setSuccess(true);


        } catch (err) {

            console.log(err);

            setError(
                err.response?.data?.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);

        }

    }


    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 3
            }}
        >

            <Box
                sx={{
                    width: "100%",
                    maxWidth: 450
                }}
            >

                {!success ? (

                    <>

                        <Typography
                            variant="h4"
                            sx={{
                                mb: 3
                            }}
                        >
                            Reset Password
                        </Typography>


                        <TextField
                            fullWidth
                            required
                            margin="normal"
                            label="New Password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                        />


                        <TextField
                            fullWidth
                            required
                            margin="normal"
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                        />


                        {error && (

                            <Typography
                                sx={{
                                    color: "red",
                                    mt: 2
                                }}
                            >
                                {error}
                            </Typography>

                        )}


                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3
                            }}
                            onClick={
                                handleResetPasswordSubmit
                            }
                            disabled={loading}
                        >

                            {loading ? (
                                <CircularProgress
                                    size={24}
                                    color="inherit"
                                />
                            ) : (
                                "Reset Password"
                            )}

                        </Button>


                        <Button
                            fullWidth
                            sx={{
                                mt: 2
                            }}
                            onClick={() =>
                                router("/auth")
                            }
                        >
                            Back to Login
                        </Button>

                    </>

                ) : (

                    <>

                        <Typography
                            variant="h4"
                            sx={{
                                mb: 3
                            }}
                        >
                            Password Reset Successful
                        </Typography>


                        <Typography
                            sx={{
                                mb: 3
                            }}
                        >
                            {message}
                        </Typography>


                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() =>
                                router("/auth")
                            }
                        >
                            Go to Login
                        </Button>

                    </>

                )}

            </Box>

        </Box>
    );
}
