import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import server from '../environment';
import axios from 'axios';

export default function VerifyEmail() {

    const [searchParams] = useSearchParams();

    const [message, setMessage] = React.useState("Verifying your email...");
    const [loading, setLoading] = React.useState(true);
    const [success, setSuccess] = React.useState(false);

    const router = useNavigate();

    useEffect(() => {

        const verifyEmail = async () => {

            const token = searchParams.get("token");

            if (!token) {
                setMessage("Verification token is missing");
                setLoading(false);
                return;
            }

            try {

                const request = await axios.get(
                    `${server}/api/v1/users/verify-email`,
                    {
                        params: {
                            token: token
                        }
                    }
                );

                if (request.status === 200) {
                    setMessage(request.data.message);
                    setSuccess(true);
                }

            } catch (err) {

                console.log(err);

                setMessage(
                    err.response?.data?.message ||
                    "Something went wrong"
                );

            } finally {

                setLoading(false);

            }
        }

        verifyEmail();

    }, [searchParams]);


    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3
            }}
        >

            {loading && (
                <CircularProgress />
            )}

            <Typography
                variant="h5"
                sx={{ mt: 2 }}
            >
                {message}
            </Typography>


            {!loading && success && (
                <Button
                    variant="contained"
                    sx={{ mt: 3 }}
                    onClick={() => router("/auth")}
                >
                    Go to Login
                </Button>
            )}


            {!loading && !success && (
                <Button
                    variant="contained"
                    sx={{ mt: 3 }}
                    onClick={() => router("/auth")}
                >
                    Back to Login
                </Button>
            )}

        </Box>
    );
}
