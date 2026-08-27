import React, {
    useContext,
    useState
} from "react";

import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    IconButton,
    InputAdornment,
    TextField,
    Typography
} from "@mui/material";

import {
    AddRounded,
    ArrowForwardRounded,
    ContentCopyRounded,
    HistoryRounded,
    LogoutRounded,
    VideoCallRounded
} from "@mui/icons-material";

import {
    useNavigate
} from "react-router-dom";

import withAuth from "../utils/withAuth";

import {
    AuthContext
} from "../contexts/AuthContext";


function HomeComponent() {

    const navigate = useNavigate();


    const {
        addToUserHistory,
        handleLogout
    } = useContext(AuthContext);


    const [meetingCode, setMeetingCode] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const generateMeetingCode = () => {

        const characters =
            "abcdefghijklmnopqrstuvwxyz0123456789";


        let code = "";


        for (let i = 0; i < 8; i++) {

            code +=
                characters.charAt(
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                );

        }


        return code;

    };


    const handleStartMeeting = async () => {

        try {

            setError("");
            setLoading(true);


            const code =
                generateMeetingCode();


            await addToUserHistory(
                code
            );


            navigate(`/${code}`);


        } catch (err) {

            console.error(
                "Start meeting error:",
                err
            );


            setError(
                "Unable to start the meeting. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    const handleJoinMeeting = async () => {

        const cleanCode =
            meetingCode
                .trim()
                .replace(/\s+/g, "");


        if (!cleanCode) {

            setError(
                "Please enter a meeting code."
            );

            return;

        }


        try {

            setError("");
            setLoading(true);


            await addToUserHistory(
                cleanCode
            );


            navigate(
                `/${cleanCode}`
            );


        } catch (err) {

            console.error(
                "Join meeting error:",
                err
            );


            setError(
                "Unable to join the meeting. Please check the code and try again."
            );

        } finally {

            setLoading(false);

        }

    };


    const handleCopyMeetingCode = async () => {

        const cleanCode =
            meetingCode
                .trim()
                .replace(/\s+/g, "");


        if (!cleanCode) {

            setError(
                "Enter a meeting code first."
            );

            return;

        }


        try {

            await navigator.clipboard.writeText(
                cleanCode
            );


        } catch (err) {

            console.error(
                "Copy failed:",
                err
            );

        }

    };


    const handleLogoutUser = async () => {

        await handleLogout();

    };


    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !loading
        ) {

            handleJoinMeeting();

        }

    };


    return (

        <Box
            sx={{
                minHeight: "100vh",
                background:
                    "linear-gradient(180deg, #f8faff 0%, #eef4ff 100%)"
            }}
        >

            {/* Header */}

            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backgroundColor:
                        "rgba(255,255,255,0.92)",
                    backdropFilter:
                        "blur(12px)",
                    borderBottom:
                        "1px solid rgba(0,0,0,0.06)"
                }}
            >

                <Container
                    maxWidth="lg"
                    sx={{
                        py: {
                            xs: 1.2,
                            sm: 1.5
                        }
                    }}
                >

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                    >

                        {/* Brand */}

                        <Box>

                            <Typography
                                sx={{
                                    fontSize: {
                                        xs: "1.35rem",
                                        sm: "1.55rem"
                                    },
                                    fontWeight: 800,
                                    letterSpacing: "-0.04em",
                                    color: "#171b2d"
                                }}
                            >
                                ApnaaZoom
                            </Typography>

                            <Typography
                                sx={{
                                    display: {
                                        xs: "none",
                                        sm: "block"
                                    },
                                    fontSize: "0.78rem",
                                    color: "#697386"
                                }}
                            >
                                Connect. Talk. Collaborate.
                            </Typography>

                        </Box>


                        {/* Actions */}

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: {
                                    xs: 0.3,
                                    sm: 1
                                }
                            }}
                        >

                            <Button
                                startIcon={
                                    <HistoryRounded />
                                }
                                onClick={() =>
                                    navigate(
                                        "/history"
                                    )
                                }
                                sx={{
                                    minWidth: "auto",
                                    color: "#374151",
                                    fontWeight: 600,
                                    display: {
                                        xs: "none",
                                        sm: "inline-flex"
                                    }
                                }}
                            >
                                History
                            </Button>


                            <IconButton
                                aria-label="History"
                                onClick={() =>
                                    navigate(
                                        "/history"
                                    )
                                }
                                sx={{
                                    display: {
                                        xs: "inline-flex",
                                        sm: "none"
                                    }
                                }}
                            >
                                <HistoryRounded />
                            </IconButton>


                            <Button
                                startIcon={
                                    <LogoutRounded />
                                }
                                onClick={
                                    handleLogoutUser
                                }
                                sx={{
                                    minWidth: "auto",
                                    color: "#374151",
                                    fontWeight: 600
                                }}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        display: {
                                            xs: "none",
                                            sm: "inline"
                                        }
                                    }}
                                >
                                    Logout
                                </Box>
                            </Button>

                        </Box>

                    </Box>

                </Container>

            </Box>


            {/* Main */}

            <Container
                maxWidth="lg"
                sx={{
                    py: {
                        xs: 4,
                        sm: 6,
                        md: 8
                    }
                }}
            >

                {/* Hero */}

                <Box
                    sx={{
                        maxWidth: 760,
                        mx: "auto",
                        textAlign: "center",
                        mb: {
                            xs: 4,
                            md: 6
                        }
                    }}
                >

                    <Box
                        sx={{
                            width: 62,
                            height: 62,
                            mx: "auto",
                            mb: 2,
                            borderRadius: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                                "linear-gradient(135deg,#1976d2,#6c63ff)",
                            color: "#fff",
                            boxShadow:
                                "0 12px 30px rgba(63,81,181,0.22)"
                        }}
                    >

                        <VideoCallRounded
                            sx={{
                                fontSize: 34
                            }}
                        />

                    </Box>


                    <Typography
                        component="h1"
                        sx={{
                            fontSize: {
                                xs: "2rem",
                                sm: "2.7rem",
                                md: "3.2rem"
                            },
                            lineHeight: 1.08,
                            fontWeight: 800,
                            letterSpacing: "-0.055em",
                            color: "#171b2d",
                            mb: 1.5
                        }}
                    >
                        Video meetings,
                        <Box
                            component="span"
                            sx={{
                                color: "#1976d2"
                            }}
                        >
                            {" "}made simple.
                        </Box>
                    </Typography>


                    <Typography
                        sx={{
                            maxWidth: 620,
                            mx: "auto",
                            fontSize: {
                                xs: "0.98rem",
                                sm: "1.08rem"
                            },
                            lineHeight: 1.7,
                            color: "#667085"
                        }}
                    >
                        Start a new meeting or join someone
                        using a meeting code. Fast, clear and
                        designed for both desktop and mobile.
                    </Typography>

                </Box>


                {/* Main cards */}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "1fr 1fr"
                        },
                        gap: {
                            xs: 2,
                            md: 3
                        },
                        maxWidth: 1000,
                        mx: "auto"
                    }}
                >

                    {/* Start Meeting */}

                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: {
                                xs: 3,
                                sm: 4
                            },
                            border:
                                "1px solid rgba(25,118,210,0.12)",
                            background:
                                "linear-gradient(145deg,#ffffff,#f7faff)",
                            boxShadow:
                                "0 12px 35px rgba(34,62,120,0.07)"
                        }}
                    >

                        <CardContent
                            sx={{
                                p: {
                                    xs: 2.5,
                                    sm: 3.5
                                },
                                "&:last-child": {
                                    pb: {
                                        xs: 2.5,
                                        sm: 3.5
                                    }
                                }
                            }}
                        >

                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                        "#e8f1ff",
                                    color:
                                        "#1976d2",
                                    mb: 2
                                }}
                            >

                                <AddRounded />

                            </Box>


                            <Typography
                                sx={{
                                    fontSize: "1.35rem",
                                    fontWeight: 750,
                                    color: "#171b2d",
                                    mb: 0.8
                                }}
                            >
                                Start a meeting
                            </Typography>


                            <Typography
                                sx={{
                                    color: "#697386",
                                    lineHeight: 1.6,
                                    mb: 3
                                }}
                            >
                                Create an instant meeting
                                and invite others with your
                                meeting link.
                            </Typography>


                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={
                                    <VideoCallRounded />
                                }
                                endIcon={
                                    <ArrowForwardRounded />
                                }
                                onClick={
                                    handleStartMeeting
                                }
                                disabled={
                                    loading
                                }
                                sx={{
                                    py: 1.45,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: "1rem",
                                    boxShadow:
                                        "0 8px 18px rgba(25,118,210,0.22)"
                                }}
                            >
                                {loading
                                    ? "Starting..."
                                    : "Start New Meeting"}
                            </Button>

                        </CardContent>

                    </Card>


                    {/* Join Meeting */}

                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: {
                                xs: 3,
                                sm: 4
                            },
                            border:
                                "1px solid rgba(0,0,0,0.08)",
                            background:
                                "#ffffff",
                            boxShadow:
                                "0 12px 35px rgba(34,62,120,0.07)"
                        }}
                    >

                        <CardContent
                            sx={{
                                p: {
                                    xs: 2.5,
                                    sm: 3.5
                                },
                                "&:last-child": {
                                    pb: {
                                        xs: 2.5,
                                        sm: 3.5
                                    }
                                }
                            }}
                        >

                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                        "#f1f0ff",
                                    color:
                                        "#635bdb",
                                    mb: 2
                                }}
                            >

                                <ArrowForwardRounded />

                            </Box>


                            <Typography
                                sx={{
                                    fontSize: "1.35rem",
                                    fontWeight: 750,
                                    color: "#171b2d",
                                    mb: 0.8
                                }}
                            >
                                Join a meeting
                            </Typography>


                            <Typography
                                sx={{
                                    color: "#697386",
                                    lineHeight: 1.6,
                                    mb: 2.5
                                }}
                            >
                                Enter the meeting code
                                shared with you.
                            </Typography>


                            <TextField
                                fullWidth
                                value={
                                    meetingCode
                                }
                                onChange={
                                    (event) => {
                                        setMeetingCode(
                                            event.target.value
                                        );
                                        setError("");
                                    }
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                label="Meeting Code"
                                placeholder="e.g. ab12cd34"
                                autoComplete="off"
                                InputProps={{
                                    endAdornment:
                                        meetingCode && (
                                            <InputAdornment
                                                position="end"
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={
                                                        handleCopyMeetingCode
                                                    }
                                                    aria-label="Copy meeting code"
                                                >
                                                    <ContentCopyRounded
                                                        fontSize="small"
                                                    />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                }}
                                sx={{
                                    mb: 1.5,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2.5
                                    }
                                }}
                            />


                            <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                onClick={
                                    handleJoinMeeting
                                }
                                disabled={
                                    loading
                                }
                                sx={{
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    fontSize: "1rem"
                                }}
                            >
                                {loading
                                    ? "Joining..."
                                    : "Join Meeting"}
                            </Button>

                        </CardContent>

                    </Card>

                </Box>


                {/* Error */}

                {error && (

                    <Typography
                        sx={{
                            maxWidth: 1000,
                            mx: "auto",
                            mt: 2,
                            px: 1,
                            color: "#d32f2f",
                            textAlign: "center",
                            fontSize: "0.9rem"
                        }}
                    >
                        {error}
                    </Typography>

                )}


                {/* Bottom info */}

                <Box
                    sx={{
                        maxWidth: 1000,
                        mx: "auto",
                        mt: {
                            xs: 4,
                            md: 5
                        }
                    }}
                >

                    <Divider
                        sx={{
                            mb: 2.5
                        }}
                    />


                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            color: "#7a8496",
                            textAlign: "center"
                        }}
                    >

                        <Typography
                            variant="body2"
                        >
                            Secure Google sign-in
                        </Typography>


                        <Box
                            sx={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                background:
                                    "#b5bcc8"
                            }}
                        />


                        <Typography
                            variant="body2"
                        >
                            HD video & audio
                        </Typography>


                        <Box
                            sx={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                background:
                                    "#b5bcc8"
                            }}
                        />


                        <Typography
                            variant="body2"
                        >
                            Works on mobile
                        </Typography>

                    </Box>

                </Box>

            </Container>

        </Box>

    );

}


export default withAuth(
    HomeComponent
);
