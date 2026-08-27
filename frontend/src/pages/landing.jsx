import React, {
    useState
} from "react";

import {
    Box,
    Button,
    Container,
    InputAdornment,
    TextField,
    Typography
} from "@mui/material";

import {
    ArrowForwardRounded,
    CheckCircleRounded,
    ContentCopyRounded,
    LockRounded,
    PlayArrowRounded,
    VideoCallRounded
} from "@mui/icons-material";

import {
    useNavigate
} from "react-router-dom";


export default function LandingPage() {

    const navigate =
        useNavigate();


    const [meetingCode, setMeetingCode] =
        useState("");


    const [error, setError] =
        useState("");


    const handleJoinMeeting =
        () => {

            const cleanCode =
                meetingCode
                    .trim()
                    .replace(/\s+/g, "")
                    .replace(/^\/+/, "");


            if (!cleanCode) {

                setError(
                    "Enter a meeting code to continue."
                );

                return;

            }


            setError("");


            navigate(
                `/meeting/${cleanCode}`
            );

        };


    const handleKeyDown =
        (event) => {

            if (
                event.key === "Enter"
            ) {

                handleJoinMeeting();

            }

        };


    return (

        <Box
            sx={{
                minHeight:
                    "100vh",

                background:
                    "linear-gradient(135deg,#f7faff 0%,#eef4ff 45%,#ffffff 100%)",

                overflow:
                    "hidden"
            }}
        >

            {/* =====================================================
                NAVBAR
            ====================================================== */}

            <Box
                component="nav"
                sx={{
                    py:
                        {
                            xs: 1.5,
                            sm: 2
                        },

                    px:
                        {
                            xs: 2,
                            sm: 3
                        },

                    position:
                        "relative",

                    zIndex:
                        10
                }}
            >

                <Container
                    maxWidth="lg"
                >

                    <Box
                        sx={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "space-between"
                        }}
                    >

                        {/* Logo */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    1
                            }}
                        >

                            <Box
                                sx={{
                                    width:
                                        40,

                                    height:
                                        40,

                                    borderRadius:
                                        "12px",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    background:
                                        "linear-gradient(135deg,#1976d2,#635bdb)",

                                    color:
                                        "#fff",

                                    boxShadow:
                                        "0 8px 18px rgba(25,118,210,0.18)"
                                }}
                            >

                                <VideoCallRounded />

                            </Box>


                            <Typography
                                sx={{
                                    fontSize:
                                        {
                                            xs:
                                                "1.25rem",

                                            sm:
                                                "1.45rem"
                                        },

                                    fontWeight:
                                        800,

                                    letterSpacing:
                                        "-0.04em",

                                    color:
                                        "#171b2d"
                                }}
                            >
                                ApnaaZoom
                            </Typography>

                        </Box>


                        {/* Desktop nav */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    1,

                                flexDirection:
                                    {
                                        xs:
                                            "row",

                                        sm:
                                            "row"
                                    }
                            }}
                        >

                            <Button
                                onClick={() =>
                                    navigate(
                                        "/auth"
                                    )
                                }
                                sx={{
                                    textTransform:
                                        "none",

                                    color:
                                        "#344054",

                                    fontWeight:
                                        700,

                                    px:
                                        {
                                            xs:
                                                1.2,

                                            sm:
                                                1.8
                                        }
                                }}
                            >
                                Sign in
                            </Button>


                            <Button
                                variant="contained"
                                onClick={() =>
                                    navigate(
                                        "/auth"
                                    )
                                }
                                endIcon={
                                    <ArrowForwardRounded />
                                }
                                sx={{
                                    textTransform:
                                        "none",

                                    borderRadius:
                                        2.5,

                                    px:
                                        {
                                            xs:
                                                1.5,

                                            sm:
                                                2
                                        },

                                    fontWeight:
                                        700
                                }}
                            >
                                Get Started
                            </Button>

                        </Box>

                    </Box>

                </Container>

            </Box>


            {/* =====================================================
                HERO
            ====================================================== */}

            <Container
                maxWidth="lg"
                sx={{
                    position:
                        "relative",

                    zIndex:
                        2,

                    pt:
                        {
                            xs:
                                3,

                            sm:
                                5,

                            md:
                                7
                        },

                    pb:
                        {
                            xs:
                                5,

                            md:
                                8
                        }
                }}
            >

                <Box
                    sx={{
                        display:
                            "grid",

                        gridTemplateColumns:
                            {
                                xs:
                                    "1fr",

                                md:
                                    "1.05fr 0.95fr"
                            },

                        alignItems:
                            "center",

                        gap:
                            {
                                xs:
                                    4,

                                md:
                                    6
                            }
                    }}
                >

                    {/* Left side */}

                    <Box>

                        <Box
                            sx={{
                                display:
                                    "inline-flex",

                                alignItems:
                                    "center",

                                gap:
                                    0.8,

                                background:
                                    "#eaf2ff",

                                color:
                                    "#1557a5",

                                px:
                                    1.4,

                                py:
                                    0.7,

                                borderRadius:
                                    999,

                                mb:
                                    2.2
                            }}
                        >

                            <CheckCircleRounded
                                sx={{
                                    fontSize:
                                        17
                                }}
                            />


                            <Typography
                                sx={{
                                    fontSize:
                                        "0.8rem",

                                    fontWeight:
                                        700
                                }}
                            >
                                Simple. Secure. Connected.
                            </Typography>

                        </Box>


                        <Typography
                            component="h1"
                            sx={{
                                fontSize:
                                    {
                                        xs:
                                            "2.65rem",

                                        sm:
                                            "3.6rem",

                                        md:
                                            "4.25rem"
                                    },

                                lineHeight:
                                    1.04,

                                letterSpacing:
                                    "-0.065em",

                                fontWeight:
                                    850,

                                color:
                                    "#111827",

                                maxWidth:
                                    720,

                                mb:
                                    2
                            }}
                        >
                            Meet people.

                            <Box
                                component="span"
                                sx={{
                                    display:
                                        "block",

                                    color:
                                        "#1976d2"
                                }}
                            >
                                Connect anywhere.
                            </Box>
                        </Typography>


                        <Typography
                            sx={{
                                fontSize:
                                    {
                                        xs:
                                            "1rem",

                                        sm:
                                            "1.12rem"
                                    },

                                lineHeight:
                                    1.75,

                                color:
                                    "#667085",

                                maxWidth:
                                    620,

                                mb:
                                    3
                            }}
                        >
                            ApnaaZoom makes video meetings
                            fast and effortless. Start a
                            meeting, invite someone, or join
                            instantly with a meeting code.
                        </Typography>


                        {/* CTA */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                gap:
                                    1.2,

                                flexWrap:
                                    "wrap",

                                mb:
                                    3.5
                            }}
                        >

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={
                                    <VideoCallRounded />
                                }
                                onClick={() =>
                                    navigate(
                                        "/auth"
                                    )
                                }
                                sx={{
                                    px:
                                        2.6,

                                    py:
                                        1.35,

                                    borderRadius:
                                        2.5,

                                    textTransform:
                                        "none",

                                    fontWeight:
                                        700,

                                    fontSize:
                                        "1rem"
                                }}
                            >
                                Start a Meeting
                            </Button>


                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={
                                    <PlayArrowRounded />
                                }
                                onClick={() =>
                                    document
                                        .getElementById(
                                            "join-meeting"
                                        )
                                        ?.scrollIntoView({
                                            behavior:
                                                "smooth"
                                        })
                                }
                                sx={{
                                    px:
                                        2.4,

                                    py:
                                        1.35,

                                    borderRadius:
                                        2.5,

                                    textTransform:
                                        "none",

                                    fontWeight:
                                        700,

                                    fontSize:
                                        "1rem"
                                }}
                            >
                                Join a Meeting
                            </Button>

                        </Box>


                        {/* Trust points */}

                        <Box
                            sx={{
                                display:
                                    "flex",

                                flexWrap:
                                    "wrap",

                                gap:
                                    {
                                        xs:
                                            1.5,

                                        sm:
                                            2.5
                                    },

                                color:
                                    "#667085"
                            }}
                        >

                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        0.6
                                }}
                            >

                                <LockRounded
                                    sx={{
                                        fontSize:
                                            18
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.82rem"
                                    }}
                                >
                                    Google secured
                                </Typography>

                            </Box>


                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        0.6
                                }}
                            >

                                <CheckCircleRounded
                                    sx={{
                                        fontSize:
                                            18
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.82rem"
                                    }}
                                >
                                    No password required
                                </Typography>

                            </Box>


                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        0.6
                                }}
                            >

                                <VideoCallRounded
                                    sx={{
                                        fontSize:
                                            18
                                    }}
                                />

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.82rem"
                                    }}
                                >
                                    Desktop & mobile
                                </Typography>

                            </Box>

                        </Box>

                    </Box>


                    {/* =================================================
                        VISUAL
                    ================================================== */}

                    <Box
                        sx={{
                            position:
                                "relative",

                            display:
                                "flex",

                            justifyContent:
                                "center"
                        }}
                    >

                        <Box
                            sx={{
                                position:
                                    "absolute",

                                width:
                                    {
                                        xs:
                                            230,

                                        sm:
                                            330
                                    },

                                height:
                                    {
                                        xs:
                                            230,

                                        sm:
                                            330
                                    },

                                borderRadius:
                                    "50%",

                                background:
                                    "rgba(25,118,210,0.10)",

                                filter:
                                    "blur(4px)"
                            }}
                        />


                        <Box
                            sx={{
                                position:
                                    "relative",

                                width:
                                    {
                                        xs:
                                            "min(92vw, 470px)",

                                        sm:
                                            470
                                    }
                            }}
                        >

                            <Box
                                sx={{
                                    background:
                                        "#111827",

                                    borderRadius:
                                        {
                                            xs:
                                                "28px",

                                            sm:
                                                "34px"
                                        },

                                    p:
                                        {
                                            xs:
                                                1,

                                            sm:
                                                1.5
                                        },

                                    boxShadow:
                                        "0 30px 80px rgba(31,41,55,0.20)"
                                }}
                            >

                                <Box
                                    sx={{
                                        background:
                                            "linear-gradient(145deg,#202938,#111827)",

                                        aspectRatio:
                                            "4 / 3",

                                        borderRadius:
                                            {
                                                xs:
                                                    "22px",

                                                sm:
                                                    "28px"
                                            },

                                        overflow:
                                            "hidden",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        position:
                                            "relative"
                                    }}
                                >

                                    <img
                                        src="/mobile.png"
                                        alt="ApnaaZoom meeting"
                                        style={{
                                            width:
                                                "100%",

                                            height:
                                                "100%",

                                            objectFit:
                                                "contain",

                                            padding:
                                                "18px"
                                        }}
                                    />


                                    <Box
                                        sx={{
                                            position:
                                                "absolute",

                                            left:
                                                15,

                                            top:
                                                15,

                                            px:
                                                1.2,

                                            py:
                                                0.7,

                                            borderRadius:
                                                2,

                                            background:
                                                "rgba(0,0,0,0.55)",

                                            color:
                                                "#fff"
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                fontSize:
                                                    "0.76rem",

                                                fontWeight:
                                                    700
                                            }}
                                        >
                                            Live meeting
                                        </Typography>

                                    </Box>

                                </Box>


                                <Box
                                    sx={{
                                        display:
                                            "flex",

                                        justifyContent:
                                            "center",

                                        gap:
                                            1,

                                        py:
                                            {
                                                xs:
                                                    1.2,

                                                sm:
                                                    1.5
                                            }
                                    }}
                                >

                                    {[1, 2, 3, 4].map(
                                        item => (

                                            <Box
                                                key={
                                                    item
                                                }
                                                sx={{
                                                    width:
                                                        {
                                                            xs:
                                                                36,

                                                            sm:
                                                                44
                                                        },

                                                    height:
                                                        {
                                                            xs:
                                                                36,

                                                            sm:
                                                                44
                                                        },

                                                    borderRadius:
                                                        2,

                                                    background:
                                                        "#273142"
                                                }}
                                            />

                                        )
                                    )}

                                </Box>

                            </Box>


                            {/* Floating card */}

                            <Box
                                sx={{
                                    position:
                                        "absolute",

                                    right:
                                        {
                                            xs:
                                                -5,

                                            sm:
                                                -25
                                        },

                                    bottom:
                                        {
                                            xs:
                                                35,

                                            sm:
                                                65
                                        },

                                    background:
                                        "#fff",

                                    borderRadius:
                                        3,

                                    p:
                                        1.5,

                                    boxShadow:
                                        "0 15px 35px rgba(0,0,0,0.12)",

                                    display:
                                        {
                                            xs:
                                                "none",

                                            sm:
                                                "block"
                                        },

                                    minWidth:
                                        170
                                }}
                            >

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.75rem",

                                        color:
                                            "#667085",

                                        mb:
                                            0.4
                                    }}
                                >
                                    Meeting experience
                                </Typography>


                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.92rem",

                                        fontWeight:
                                            750,

                                        color:
                                            "#171b2d"
                                    }}
                                >
                                    Video • Audio • Chat
                                </Typography>

                            </Box>

                        </Box>

                    </Box>

                </Box>


                {/* =====================================================
                    JOIN SECTION
                ====================================================== */}

                <Box
                    id="join-meeting"
                    sx={{
                        mt:
                            {
                                xs:
                                    6,

                                md:
                                    8
                            },

                        maxWidth:
                            860,

                        mx:
                            "auto",

                        background:
                            "#fff",

                        border:
                            "1px solid rgba(0,0,0,0.07)",

                        borderRadius:
                            {
                                xs:
                                    3,

                                sm:
                                    4
                            },

                        p:
                            {
                                xs:
                                    2.2,

                                sm:
                                    3,

                                md:
                                    4
                            },

                        boxShadow:
                            "0 15px 40px rgba(30,60,100,0.07)"
                    }}
                >

                    <Box
                        sx={{
                            textAlign:
                                "center",

                            mb:
                                2.5
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize:
                                    {
                                        xs:
                                            "1.35rem",

                                        sm:
                                            "1.55rem"
                                    },

                                fontWeight:
                                    800,

                                color:
                                    "#171b2d",

                                mb:
                                    0.8
                            }}
                        >
                            Join a meeting
                        </Typography>


                        <Typography
                            sx={{
                                color:
                                    "#667085",

                                fontSize:
                                    "0.92rem"
                            }}
                        >
                            Have a meeting code?
                            Join directly as a guest.
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            display:
                                "flex",

                            gap:
                                1,

                            flexDirection:
                                {
                                    xs:
                                        "column",

                                    sm:
                                        "row"
                                }
                        }}
                    >

                        <TextField
                            fullWidth
                            value={
                                meetingCode
                            }
                            onChange={
                                event => {

                                    setMeetingCode(
                                        event.target.value
                                    );

                                    setError(
                                        ""
                                    );

                                }
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            label="Meeting code"
                            placeholder="Enter meeting code"
                            autoComplete="off"
                            InputProps={{
                                endAdornment:
                                    meetingCode && (

                                        <InputAdornment
                                            position="end"
                                        >

                                            <ContentCopyRounded
                                                sx={{
                                                    fontSize:
                                                        19,

                                                    color:
                                                        "#98a2b3"
                                                }}
                                            />

                                        </InputAdornment>

                                    )
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root":
                                {
                                    borderRadius:
                                        2.5
                                }
                            }}
                        />


                        <Button
                            variant="contained"
                            size="large"
                            onClick={
                                handleJoinMeeting
                            }
                            endIcon={
                                <ArrowForwardRounded />
                            }
                            sx={{
                                minWidth:
                                    {
                                        xs:
                                            "100%",

                                        sm:
                                            150
                                    },

                                borderRadius:
                                    2.5,

                                textTransform:
                                    "none",

                                fontWeight:
                                    700
                            }}
                        >
                            Join
                        </Button>

                    </Box>


                    {error && (

                        <Typography
                            sx={{
                                mt:
                                    1.2,

                                color:
                                    "#d32f2f",

                                fontSize:
                                    "0.82rem"
                            }}
                        >
                            {error}
                        </Typography>

                    )}

                </Box>


                {/* =====================================================
                    SIMPLE FEATURE STRIP
                ====================================================== */}

                <Box
                    sx={{
                        mt:
                            {
                                xs:
                                    4,

                                md:
                                    5
                            },

                        display:
                            "grid",

                        gridTemplateColumns:
                            {
                                xs:
                                    "1fr",

                                sm:
                                    "repeat(3, 1fr)"
                            },

                        gap:
                            1.5
                    }}
                >

                    {[
                        {
                            icon:
                                <VideoCallRounded />,

                            title:
                                "HD meetings",

                            text:
                                "Clear video and audio for everyday calls."
                        },

                        {
                            icon:
                                <LockRounded />,

                            title:
                                "Secure sign-in",

                            text:
                                "Google authentication keeps access simple."
                        },

                        {
                            icon:
                                <CheckCircleRounded />,

                            title:
                                "Easy to use",

                            text:
                                "Start or join meetings in seconds."
                        }

                    ].map(
                        feature => (

                            <Box
                                key={
                                    feature.title
                                }
                                sx={{
                                    background:
                                        "rgba(255,255,255,0.75)",

                                    border:
                                        "1px solid rgba(0,0,0,0.06)",

                                    borderRadius:
                                        3,

                                    p:
                                        2,

                                    display:
                                        "flex",

                                    gap:
                                        1.3,

                                    alignItems:
                                        "flex-start"
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            40,

                                        height:
                                            40,

                                        minWidth:
                                            40,

                                        borderRadius:
                                            2,

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "#eaf2ff",

                                        color:
                                            "#1976d2"
                                    }}
                                >
                                    {feature.icon}
                                </Box>


                                <Box>

                                    <Typography
                                        sx={{
                                            fontWeight:
                                                750,

                                            fontSize:
                                                "0.9rem",

                                            color:
                                                "#171b2d",

                                            mb:
                                                0.3
                                        }}
                                    >
                                        {feature.title}
                                    </Typography>


                                    <Typography
                                        sx={{
                                            color:
                                                "#667085",

                                            fontSize:
                                                "0.78rem",

                                            lineHeight:
                                                1.5
                                        }}
                                    >
                                        {feature.text}
                                    </Typography>

                                </Box>

                            </Box>

                        )
                    )}

                </Box>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <Box
                    sx={{
                        mt:
                            {
                                xs:
                                    5,

                                md:
                                    7
                            },

                        pt:
                            2.5,

                        borderTop:
                            "1px solid rgba(0,0,0,0.07)",

                        display:
                            "flex",

                        alignItems:
                            {
                                xs:
                                    "flex-start",

                                sm:
                                    "center"
                            },

                        justifyContent:
                            "space-between",

                        flexDirection:
                            {
                                xs:
                                    "column",

                                sm:
                                    "row"
                            },

                        gap:
                            1.5
                    }}
                >

                    <Typography
                        sx={{
                            color:
                                "#98a2b3",

                            fontSize:
                                "0.8rem"
                        }}
                    >
                        © {new Date().getFullYear()} ApnaaZoom
                    </Typography>


                    <Typography
                        sx={{
                            color:
                                "#98a2b3",

                            fontSize:
                                "0.8rem"
                        }}
                    >
                        Video meetings made simple.
                    </Typography>

                </Box>

            </Container>

        </Box>

    );

}
