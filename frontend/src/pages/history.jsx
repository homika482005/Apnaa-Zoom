import React, {
    useContext,
    useEffect,
    useState
} from "react";

import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Typography
} from "@mui/material";

import {
    ArrowBack,
    ContentCopy,
    History as HistoryIcon,
    VideoCall
} from "@mui/icons-material";

import {
    useNavigate
} from "react-router-dom";

import {
    AuthContext
} from "../contexts/AuthContext";

import withAuth from "../utils/withAuth";


function History() {

    const navigate =
        useNavigate();


    const {
        getHistoryOfUser
    } = useContext(
        AuthContext
    );


    const [
        meetings,
        setMeetings
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    const formatDate = (
        date
    ) => {

        if (!date) {

            return "Unknown date";

        }


        const parsed =
            new Date(date);


        if (
            isNaN(
                parsed.getTime()
            )
        ) {

            return "Unknown date";

        }


        return parsed.toLocaleString(
            undefined,
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    };


    useEffect(() => {

        let mounted = true;


        const loadHistory =
            async () => {

                try {

                    setLoading(
                        true
                    );


                    setError("");


                    const data =
                        await getHistoryOfUser();


                    if (
                        mounted
                    ) {

                        if (
                            Array.isArray(
                                data
                            )
                        ) {

                            setMeetings(
                                data
                            );

                        } else {

                            setMeetings(
                                []
                            );

                        }

                    }

                } catch (
                    historyError
                ) {

                    console.error(
                        "History error:",
                        historyError
                    );


                    if (
                        mounted
                    ) {

                        if (
                            historyError.response &&
                            historyError.response.data &&
                            historyError.response.data.message
                        ) {

                            setError(
                                historyError.response.data.message
                            );

                        } else {

                            setError(
                                "Unable to load meeting history."
                            );

                        }

                    }

                } finally {

                    if (
                        mounted
                    ) {

                        setLoading(
                            false
                        );

                    }

                }

            };


        loadHistory();


        return () => {

            mounted =
                false;

        };

    }, [getHistoryOfUser]);


    const copyMeetingCode =
        async (
            meetingCode
        ) => {

            try {

                await navigator.clipboard.writeText(
                    meetingCode
                );

                alert(
                    "Meeting code copied!"
                );

            } catch (
                copyError
            ) {

                console.error(
                    "Copy error:",
                    copyError
                );

            }

        };


    const joinMeeting =
        (
            meetingCode
        ) => {

            if (!meetingCode) {

                return;

            }


            navigate(
                "/meeting/" +
                meetingCode
            );

        };


    return (

        <Box
            sx={{
                minHeight:
                    "100vh",

                background:
                    "#f7f9fc"
            }}
        >

            {/* Header */}

            <Box
                sx={{
                    background:
                        "#ffffff",

                    borderBottom:
                        "1px solid #eaecf0"
                }}
            >

                <Container
                    maxWidth="md"
                    sx={{
                        py:
                            2
                    }}
                >

                    <Box
                        sx={{
                            display:
                                "flex",

                            alignItems:
                                "center"
                        }}
                    >

                        <Button
                            startIcon={
                                <ArrowBack />
                            }
                            onClick={() =>
                                navigate(
                                    "/home"
                                )
                            }
                            sx={{
                                textTransform:
                                    "none"
                            }}
                        >
                            Back
                        </Button>


                        <Box
                            sx={{
                                flex:
                                    1,

                                textAlign:
                                    "center"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        "1.35rem",

                                    fontWeight:
                                        800,

                                    color:
                                        "#17202f"
                                }}
                            >
                                Meeting History
                            </Typography>

                        </Box>


                        <Box
                            sx={{
                                width:
                                    70
                            }}
                        />

                    </Box>

                </Container>

            </Box>


            {/* Main */}

            <Container
                maxWidth="md"
                sx={{
                    py:
                        4
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
                            3
                    }}
                >

                    <HistoryIcon
                        sx={{
                            color:
                                "#1976d2"
                        }}
                    />


                    <Typography
                        sx={{
                            fontSize:
                                "1.6rem",

                            fontWeight:
                                800
                        }}
                    >
                        Your Meetings
                    </Typography>

                </Box>


                {/* Loading */}

                {loading && (

                    <Box
                        sx={{
                            minHeight:
                                300,

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center"
                        }}
                    >

                        <Box
                            sx={{
                                textAlign:
                                    "center"
                            }}
                        >

                            <CircularProgress />


                            <Typography
                                sx={{
                                    mt:
                                        2,

                                    color:
                                        "#667085"
                                }}
                            >
                                Loading history...
                            </Typography>

                        </Box>

                    </Box>

                )}


                {/* Error */}

                {!loading &&
                    error && (

                    <Card
                        elevation={0}
                        sx={{
                            border:
                                "1px solid #fecdca",

                            background:
                                "#fff6f5",

                            borderRadius:
                                3
                        }}
                    >

                        <CardContent>

                            <Typography
                                sx={{
                                    color:
                                        "#b42318",

                                    fontWeight:
                                        600,

                                    mb:
                                        2
                                }}
                            >
                                {error}
                            </Typography>


                            <Button
                                variant="contained"
                                onClick={() =>
                                    window.location.reload()
                                }
                            >
                                Retry
                            </Button>

                        </CardContent>

                    </Card>

                )}


                {/* Empty */}

                {!loading &&
                    !error &&
                    meetings.length === 0 && (

                    <Card
                        elevation={0}
                        sx={{
                            border:
                                "1px solid #eaecf0",

                            borderRadius:
                                3,

                            background:
                                "#ffffff"
                        }}
                    >

                        <CardContent
                            sx={{
                                py:
                                    7,

                                textAlign:
                                    "center"
                            }}
                        >

                            <HistoryIcon
                                sx={{
                                    fontSize:
                                        50,

                                    color:
                                        "#98a2b3",

                                    mb:
                                        1
                                }}
                            />


                            <Typography
                                sx={{
                                    fontSize:
                                        "1.3rem",

                                    fontWeight:
                                        800,

                                    mb:
                                        1
                                }}
                            >
                                No meetings yet
                            </Typography>


                            <Typography
                                sx={{
                                    color:
                                        "#667085",

                                    mb:
                                        3
                                }}
                            >
                                Your created and joined meetings
                                will appear here.
                            </Typography>


                            <Button
                                variant="contained"
                                startIcon={
                                    <VideoCall />
                                }
                                onClick={() =>
                                    navigate(
                                        "/home"
                                    )
                                }
                                sx={{
                                    textTransform:
                                        "none",

                                    borderRadius:
                                        2,

                                    fontWeight:
                                        700
                                }}
                            >
                                Start Meeting
                            </Button>

                        </CardContent>

                    </Card>

                )}


                {/* History */}

                {!loading &&
                    !error &&
                    meetings.length > 0 && (

                    <Box>

                        {meetings.map(
                            (
                                item,
                                index
                            ) => {

                                const code =
                                    item.meetingCode ||
                                    (
                                        item.meeting &&
                                        item.meeting.meetingCode
                                    ) ||
                                    "Unknown";


                                const action =
                                    item.action ||
                                    "joined";


                                const date =
                                    item.date ||
                                    (
                                        item.meeting &&
                                        item.meeting.createdAt
                                    );


                                return (

                                    <Card
                                        key={
                                            item._id ||
                                            index
                                        }
                                        elevation={0}
                                        sx={{
                                            mb:
                                                2,

                                            border:
                                                "1px solid #eaecf0",

                                            borderRadius:
                                                3,

                                            background:
                                                "#ffffff"
                                        }}
                                    >

                                        <CardContent>

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

                                                <Box>

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                "1.05rem",

                                                            fontWeight:
                                                                800,

                                                            mb:
                                                                0.7
                                                        }}
                                                    >
                                                        {code}
                                                    </Typography>


                                                    <Typography
                                                        sx={{
                                                            color:
                                                                action ===
                                                                "created"
                                                                    ? "#1976d2"
                                                                    : "#635bdb",

                                                            fontSize:
                                                                "0.85rem",

                                                            fontWeight:
                                                                700,

                                                            mb:
                                                                0.5
                                                        }}
                                                    >
                                                        {action ===
                                                        "created"
                                                            ? "Created"
                                                            : "Joined"}
                                                    </Typography>


                                                    <Typography
                                                        sx={{
                                                            color:
                                                                "#667085",

                                                            fontSize:
                                                                "0.78rem"
                                                        }}
                                                    >
                                                        {
                                                            formatDate(
                                                                date
                                                            )
                                                        }
                                                    </Typography>

                                                </Box>


                                                <Box
                                                    sx={{
                                                        display:
                                                            "flex",

                                                        gap:
                                                            1,

                                                        width:
                                                            {
                                                                xs:
                                                                    "100%",

                                                                sm:
                                                                    "auto"
                                                            }
                                                    }}
                                                >

                                                    <Button
                                                        variant="outlined"
                                                        startIcon={
                                                            <ContentCopy />
                                                        }
                                                        onClick={() =>
                                                            copyMeetingCode(
                                                                code
                                                            )
                                                        }
                                                        disabled={
                                                            code ===
                                                            "Unknown"
                                                        }
                                                        sx={{
                                                            flex:
                                                                {
                                                                    xs:
                                                                        1,

                                                                    sm:
                                                                        "initial"
                                                                },

                                                            textTransform:
                                                                "none",

                                                            borderRadius:
                                                                2
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>


                                                    <Button
                                                        variant="contained"
                                                        startIcon={
                                                            <VideoCall />
                                                        }
                                                        onClick={() =>
                                                            joinMeeting(
                                                                code
                                                            )
                                                        }
                                                        disabled={
                                                            code ===
                                                            "Unknown"
                                                        }
                                                        sx={{
                                                            flex:
                                                                {
                                                                    xs:
                                                                        1,

                                                                    sm:
                                                                        "initial"
                                                                },

                                                            textTransform:
                                                                "none",

                                                            borderRadius:
                                                                2,

                                                            fontWeight:
                                                                700
                                                        }}
                                                    >
                                                        Join
                                                    </Button>

                                                </Box>

                                            </Box>

                                        </CardContent>

                                    </Card>

                                );

                            }
                        )}

                    </Box>

                )}

            </Container>

        </Box>

    );

}


export default withAuth(
    History
);
