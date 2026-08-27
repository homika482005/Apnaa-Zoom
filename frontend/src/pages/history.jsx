import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    Snackbar,
    Stack,
    Typography
} from "@mui/material";

import {
    ArrowBackRounded,
    ContentCopyRounded,
    HomeRounded,
    HistoryRounded,
    LoginRounded,
    VideoCallRounded
} from "@mui/icons-material";

import {
    useNavigate
} from "react-router-dom";

import {
    AuthContext
} from "../contexts/AuthContext";

import withAuth from "../utils/withAuth";


function History() {

    const navigate = useNavigate();


    const {
        getHistoryOfUser
    } = useContext(
        AuthContext
    );


    const [meetings, setMeetings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [copiedCode, setCopiedCode] =
        useState("");

    const [snackbarOpen, setSnackbarOpen] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Fetch meeting history
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let mounted = true;


        const fetchHistory =
            async () => {

                try {

                    setLoading(true);
                    setError("");


                    const history =
                        await getHistoryOfUser();


                    if (
                        mounted
                    ) {

                        setMeetings(
                            Array.isArray(history)
                                ? history
                                : []
                        );

                    }

                } catch (historyError) {

                    console.error(
                        "History loading error:",
                        historyError
                    );


                    if (
                        mounted
                    ) {

                        setError(
                            "Unable to load your meeting history."
                        );

                    }

                } finally {

                    if (
                        mounted
                    ) {

                        setLoading(false);

                    }

                }

            };


        fetchHistory();


        return () => {

            mounted = false;

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Date formatting
    |--------------------------------------------------------------------------
    */

    const formatDate =
        (dateString) => {

            if (
                !dateString
            ) {

                return "Unknown date";

            }


            const date =
                new Date(
                    dateString
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "Unknown date";

            }


            return date.toLocaleDateString(
                undefined,
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );

        };


    const formatTime =
        (dateString) => {

            if (
                !dateString
            ) {

                return "";

            }


            const date =
                new Date(
                    dateString
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return "";

            }


            return date.toLocaleTimeString(
                undefined,
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Sort history
    |--------------------------------------------------------------------------
    */

    const sortedMeetings =
        useMemo(() => {

            return [...meetings].sort(
                (
                    first,
                    second
                ) => {

                    const firstDate =
                        new Date(
                            first?.date || 0
                        ).getTime();


                    const secondDate =
                        new Date(
                            second?.date || 0
                        ).getTime();


                    return (
                        secondDate -
                        firstDate
                    );

                }
            );

        }, [meetings]);


    /*
    |--------------------------------------------------------------------------
    | Copy meeting code
    |--------------------------------------------------------------------------
    */

    const copyMeetingCode =
        async (
            code
        ) => {

            if (
                !code
            ) {

                return;

            }


            try {

                await navigator
                    .clipboard
                    .writeText(
                        code
                    );


                setCopiedCode(
                    code
                );

                setSnackbarOpen(
                    true
                );


                setTimeout(
                    () => {

                        setCopiedCode(
                            ""
                        );

                    },
                    1800
                );


            } catch (copyError) {

                console.error(
                    "Copy failed:",
                    copyError
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Join existing meeting
    |--------------------------------------------------------------------------
    */

    const joinMeeting =
        (
            code
        ) => {

            if (
                !code
            ) {

                return;

            }


            navigate(
                `/meeting/${code}`
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Group meetings by day
    |--------------------------------------------------------------------------
    */

    const getDayLabel =
        (
            dateString
        ) => {

            if (
                !dateString
            ) {

                return "Older";

            }


            const date =
                new Date(
                    dateString
                );


            const today =
                new Date();


            const yesterday =
                new Date();


            yesterday.setDate(
                yesterday.getDate() - 1
            );


            const sameDay =
                (
                    firstDate,
                    secondDate
                ) => (

                    firstDate
                        .getFullYear() ===
                    secondDate
                        .getFullYear()

                    &&

                    firstDate
                        .getMonth() ===
                    secondDate
                        .getMonth()

                    &&

                    firstDate
                        .getDate() ===
                    secondDate
                        .getDate()

                );


            if (
                sameDay(
                    date,
                    today
                )
            ) {

                return "Today";

            }


            if (
                sameDay(
                    date,
                    yesterday
                )
            ) {

                return "Yesterday";

            }


            return formatDate(
                dateString
            );

        };


    return (

        <Box
            sx={{
                minHeight:
                    "100vh",

                background:
                    "linear-gradient(180deg,#f8faff 0%,#eef4ff 100%)"
            }}
        >

            {/* =====================================================
                HEADER
            ====================================================== */}

            <Box
                sx={{
                    position:
                        "sticky",

                    top:
                        0,

                    zIndex:
                        10,

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
                        py:
                            {
                                xs:
                                    1.1,

                                sm:
                                    1.5
                            }
                    }}
                >

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

                        <IconButton
                            onClick={() =>
                                navigate(
                                    "/home"
                                )
                            }
                            aria-label="Back to home"
                        >
                            <ArrowBackRounded />
                        </IconButton>


                        <Box
                            sx={{
                                flex:
                                    1,

                                minWidth:
                                    0
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        {
                                            xs:
                                                "1.15rem",

                                            sm:
                                                "1.35rem"
                                        },

                                    fontWeight:
                                        800,

                                    color:
                                        "#171b2d"
                                }}
                            >
                                Meeting History
                            </Typography>


                            <Typography
                                sx={{
                                    display:
                                        {
                                            xs:
                                                "none",

                                            sm:
                                                "block"
                                        },

                                    fontSize:
                                        "0.78rem",

                                    color:
                                        "#667085"
                                }}
                            >
                                Rejoin a previous meeting or copy its code.
                            </Typography>

                        </Box>


                        <Button
                            variant="outlined"
                            startIcon={
                                <HomeRounded />
                            }
                            onClick={() =>
                                navigate(
                                    "/home"
                                )
                            }
                            sx={{
                                display:
                                    {
                                        xs:
                                            "none",

                                        sm:
                                            "inline-flex"
                                    },

                                borderRadius:
                                    2.5,

                                textTransform:
                                    "none",

                                fontWeight:
                                    700
                            }}
                        >
                            Home
                        </Button>

                    </Box>

                </Container>

            </Box>


            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <Container
                maxWidth="md"
                sx={{
                    py:
                        {
                            xs:
                                3,

                            sm:
                                5,

                            md:
                                6
                        }
                }}
            >

                {/* Summary */}

                <Box
                    sx={{
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

                        gap:
                            2,

                        mb:
                            3,

                        flexDirection:
                            {
                                xs:
                                    "column",

                                sm:
                                    "row"
                            }
                    }}
                >

                    <Box>

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap:
                                    1.2,

                                mb:
                                    0.8
                            }}
                        >

                            <Box
                                sx={{
                                    width:
                                        46,

                                    height:
                                        46,

                                    borderRadius:
                                        2.5,

                                    background:
                                        "#eaf2ff",

                                    color:
                                        "#1976d2",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center"
                                }}
                            >
                                <HistoryRounded />
                            </Box>


                            <Typography
                                sx={{
                                    fontWeight:
                                        800,

                                    fontSize:
                                        {
                                            xs:
                                                "1.45rem",

                                            sm:
                                                "1.7rem"
                                        },

                                    color:
                                        "#171b2d"
                                }}
                            >
                                Your meetings
                            </Typography>

                        </Box>


                        <Typography
                            sx={{
                                color:
                                    "#667085",

                                fontSize:
                                    "0.9rem"
                            }}
                        >
                            {meetings.length}{" "}
                            {meetings.length === 1
                                ? "meeting"
                                : "meetings"}{" "}
                            in your history
                        </Typography>

                    </Box>


                    <Button
                        variant="contained"
                        startIcon={
                            <VideoCallRounded />
                        }
                        onClick={() =>
                            navigate(
                                "/home"
                            )
                        }
                        sx={{
                            borderRadius:
                                2.5,

                            textTransform:
                                "none",

                            fontWeight:
                                700,

                            px:
                                2
                        }}
                    >
                        New Meeting
                    </Button>

                </Box>


                {error && (

                    <Alert
                        severity="error"
                        sx={{
                            mb:
                                2.5,

                            borderRadius:
                                2.5
                        }}
                    >
                        {error}
                    </Alert>

                )}


                {/* =================================================
                    LOADING
                ================================================== */}

                {loading && (

                    <Box
                        sx={{
                            minHeight:
                                280,

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center"
                        }}
                    >

                        <Stack
                            alignItems="center"
                            spacing={2}
                        >

                            <CircularProgress />

                            <Typography
                                sx={{
                                    color:
                                        "#667085"
                                }}
                            >
                                Loading your meetings...
                            </Typography>

                        </Stack>

                    </Box>

                )}


                {/* =================================================
                    EMPTY STATE
                ================================================== */}

                {!loading &&
                    sortedMeetings.length === 0 && (

                        <Card
                            elevation={0}
                            sx={{
                                borderRadius:
                                    4,

                                border:
                                    "1px solid rgba(0,0,0,0.07)",

                                background:
                                    "#fff",

                                boxShadow:
                                    "0 14px 40px rgba(31,56,90,0.07)"
                            }}
                        >

                            <CardContent
                                sx={{
                                    py:
                                        {
                                            xs:
                                                6,

                                            sm:
                                                8
                                        },

                                    px:
                                        3,

                                    textAlign:
                                        "center"
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            70,

                                        height:
                                            70,

                                        mx:
                                            "auto",

                                        mb:
                                            2,

                                        borderRadius:
                                            "22px",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "#eef4ff",

                                        color:
                                            "#1976d2"
                                    }}
                                >

                                    <HistoryRounded
                                        sx={{
                                            fontSize:
                                                34
                                        }}
                                    />

                                </Box>


                                <Typography
                                    sx={{
                                        fontWeight:
                                            800,

                                        fontSize:
                                            "1.3rem",

                                        color:
                                            "#171b2d",

                                        mb:
                                            0.8
                                    }}
                                >
                                    No meetings yet
                                </Typography>


                                <Typography
                                    sx={{
                                        color:
                                            "#667085",

                                        maxWidth:
                                            470,

                                        mx:
                                            "auto",

                                        lineHeight:
                                            1.6,

                                        mb:
                                            2.5
                                    }}
                                >
                                    Start or join a meeting and
                                    it will appear here for quick
                                    access later.
                                </Typography>


                                <Button
                                    variant="contained"
                                    startIcon={
                                        <VideoCallRounded />
                                    }
                                    onClick={() =>
                                        navigate(
                                            "/home"
                                        )
                                    }
                                    sx={{
                                        borderRadius:
                                            2.5,

                                        textTransform:
                                            "none",

                                        fontWeight:
                                            700
                                    }}
                                >
                                    Start a Meeting
                                </Button>

                            </CardContent>

                        </Card>

                    )}


                {/* =================================================
                    HISTORY LIST
                ================================================== */}

                {!loading &&
                    sortedMeetings.length > 0 && (

                        <Stack
                            spacing={2}
                        >

                            {sortedMeetings.map(
                                (
                                    meeting,
                                    index
                                ) => {

                                    const code =
                                        meeting?.meetingCode ||
                                        "Unknown";


                                    const date =
                                        meeting?.date;


                                    return (

                                        <React.Fragment
                                            key={
                                                meeting?._id ||
                                                `${code}-${date}-${index}`
                                            }
                                        >

                                            {(
                                                index === 0 ||

                                                getDayLabel(
                                                    date
                                                ) !==
                                                getDayLabel(
                                                    sortedMeetings[
                                                        index - 1
                                                    ]?.date
                                                )
                                            ) && (

                                                <Box
                                                    sx={{
                                                        pt:
                                                            index === 0
                                                                ? 0
                                                                : 1
                                                    }}
                                                >

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "0.78rem",

                                                            fontWeight:
                                                                800,

                                                            color:
                                                                "#667085",

                                                            textTransform:
                                                                "uppercase",

                                                            letterSpacing:
                                                                "0.05em"
                                                        }}
                                                    >
                                                        {
                                                            getDayLabel(
                                                                date
                                                            )
                                                        }
                                                    </Typography>

                                                </Box>

                                            )}


                                            <Card
                                                elevation={0}
                                                sx={{
                                                    borderRadius:
                                                        3,

                                                    border:
                                                        "1px solid rgba(0,0,0,0.07)",

                                                    background:
                                                        "#fff",

                                                    transition:
                                                        "transform 0.2s ease, box-shadow 0.2s ease",

                                                    "&:hover":
                                                    {
                                                        transform:
                                                            "translateY(-2px)",

                                                        boxShadow:
                                                            "0 14px 35px rgba(31,56,90,0.10)"
                                                    }
                                                }}
                                            >

                                                <CardContent
                                                    sx={{
                                                        p:
                                                            {
                                                                xs:
                                                                    2,

                                                                sm:
                                                                    2.5
                                                            },

                                                        "&:last-child":
                                                        {
                                                            pb:
                                                                {
                                                                    xs:
                                                                        2,

                                                                    sm:
                                                                        2.5
                                                                }
                                                        }
                                                    }}
                                                >

                                                    <Box
                                                        sx={{
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

                                                            gap:
                                                                2,

                                                            flexDirection:
                                                                {
                                                                    xs:
                                                                        "column",

                                                                    sm:
                                                                        "row"
                                                                }
                                                        }}
                                                    >

                                                        <Box
                                                            sx={{
                                                                minWidth:
                                                                    0,

                                                                flex:
                                                                    1
                                                            }}
                                                        >

                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    gap:
                                                                        1,

                                                                    mb:
                                                                        0.7
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
                                                                            "#eef4ff",

                                                                        color:
                                                                            "#1976d2"
                                                                    }}
                                                                >

                                                                    <VideoCallRounded
                                                                        sx={{
                                                                            fontSize:
                                                                                21
                                                                        }}
                                                                    />

                                                                </Box>


                                                                <Typography
                                                                    sx={{
                                                                        fontWeight:
                                                                            750,

                                                                        fontSize:
                                                                            "1rem",

                                                                        color:
                                                                            "#171b2d",

                                                                        overflow:
                                                                            "hidden",

                                                                        textOverflow:
                                                                            "ellipsis",

                                                                        whiteSpace:
                                                                            "nowrap"
                                                                    }}
                                                                >
                                                                    {code}
                                                                </Typography>

                                                            </Box>


                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",

                                                                    alignItems:
                                                                        "center",

                                                                    gap:
                                                                        0.8,

                                                                    flexWrap:
                                                                        "wrap"
                                                                }}
                                                            >

                                                                <Chip
                                                                    size="small"
                                                                    label={
                                                                        formatDate(
                                                                            date
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        borderRadius:
                                                                            1.5,

                                                                        background:
                                                                            "#f2f4f7",

                                                                        color:
                                                                            "#475467",

                                                                        fontWeight:
                                                                            600
                                                                    }}
                                                                />


                                                                {formatTime(
                                                                    date
                                                                ) && (

                                                                    <Typography
                                                                        sx={{
                                                                            fontSize:
                                                                                "0.78rem",

                                                                            color:
                                                                                "#98a2b3"
                                                                        }}
                                                                    >
                                                                        {
                                                                            formatTime(
                                                                                date
                                                                            )
                                                                        }
                                                                    </Typography>

                                                                )}

                                                            </Box>

                                                        </Box>


                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            sx={{
                                                                width:
                                                                    {
                                                                        xs:
                                                                            "100%",

                                                                        sm:
                                                                            "auto"
                                                                    }
                                                            }}
                                                        >

                                                            <IconButton
                                                                onClick={() =>
                                                                    copyMeetingCode(
                                                                        code
                                                                    )
                                                                }
                                                                aria-label="Copy meeting code"
                                                                sx={{
                                                                    border:
                                                                        "1px solid #d0d5dd",

                                                                    borderRadius:
                                                                        2,

                                                                    color:
                                                                        "#344054"
                                                                }}
                                                            >
                                                                <ContentCopyRounded
                                                                    sx={{
                                                                        fontSize:
                                                                            18
                                                                    }}
                                                                />
                                                            </IconButton>


                                                            <Button
                                                                variant="contained"
                                                                startIcon={
                                                                    <VideoCallRounded />
                                                                }
                                                                onClick={() =>
                                                                    joinMeeting(
                                                                        code
                                                                    )
                                                                }
                                                                sx={{
                                                                    flex:
                                                                        {
                                                                            xs:
                                                                                1,

                                                                            sm:
                                                                                "initial"
                                                                        },

                                                                    minWidth:
                                                                        {
                                                                            sm:
                                                                                120
                                                                        },

                                                                    borderRadius:
                                                                        2,

                                                                    textTransform:
                                                                        "none",

                                                                    fontWeight:
                                                                        700
                                                                }}
                                                            >
                                                                Join
                                                            </Button>

                                                        </Stack>

                                                    </Box>

                                                </CardContent>

                                            </Card>

                                        </React.Fragment>

                                    );

                                }
                            )}

                        </Stack>

                    )}


                {/* =================================================
                    FOOTER
                ================================================== */}

                <Divider
                    sx={{
                        mt:
                            5,

                        mb:
                            2
                    }}
                />


                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        gap:
                            0.7,

                        color:
                            "#98a2b3"
                    }}
                >

                    <LoginRounded
                        sx={{
                            fontSize:
                                16
                        }}
                    />


                    <Typography
                        sx={{
                            fontSize:
                                "0.75rem"
                        }}
                    >
                        Signed in with Google
                    </Typography>

                </Box>

            </Container>


            <Snackbar
                open={
                    snackbarOpen
                }
                autoHideDuration={
                    2200
                }
                onClose={() =>
                    setSnackbarOpen(
                        false
                    )
                }
            >

                <Alert
                    severity="success"
                    variant="filled"
                    onClose={() =>
                        setSnackbarOpen(
                            false
                        )
                    }
                >
                    {copiedCode
                        ? `Meeting code "${copiedCode}" copied`
                        : "Copied"}
                </Alert>

            </Snackbar>

        </Box>

    );

}


export default withAuth(
    History
);
