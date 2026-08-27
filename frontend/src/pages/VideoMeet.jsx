import React, {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import io from "socket.io-client";

import {
    Badge,
    Box,
    Button,
    CircularProgress,
    IconButton,
    TextField,
    Typography
} from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
    GoogleLogin
} from "@react-oauth/google";

import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    AuthContext
} from "../contexts/AuthContext";

import server from "../environment";


const serverUrl = server;


const peerConfigConnections = {

    iceServers: [

        {
            urls:
                "stun:stun.l.google.com:19302"
        }

    ]

};


export default function VideoMeetComponent() {

    const { url } = useParams();

    const location = useLocation();

    const navigate = useNavigate();


    const {
        handleGoogleLogin
    } = React.useContext(
        AuthContext
    );


    const socketRef =
        useRef(null);

    const socketIdRef =
        useRef(null);

    const localVideoRef =
        useRef(null);

    const videoRefs =
        useRef({});

    const connectionsRef =
        useRef({});


    const [cameraAvailable, setCameraAvailable] =
        useState(true);

    const [microphoneAvailable, setMicrophoneAvailable] =
        useState(true);

    const [video, setVideo] =
        useState(true);

    const [audio, setAudio] =
        useState(true);

    const [screen, setScreen] =
        useState(false);

    const [screenAvailable, setScreenAvailable] =
        useState(false);


    const [messages, setMessages] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const [unreadMessages, setUnreadMessages] =
        useState(0);

    const [showChat, setShowChat] =
        useState(false);

    const [showParticipants, setShowParticipants] =
        useState(false);


    const [videos, setVideos] =
        useState([]);


    const [username, setUsername] =
        useState("");


    const [guestLobby, setGuestLobby] =
        useState(true);


    const [showLoginGate, setShowLoginGate] =
        useState(false);


    const [googleLoginLoading, setGoogleLoginLoading] =
        useState(false);


    const [joining, setJoining] =
        useState(false);


    const [error, setError] =
        useState("");


    const [copied, setCopied] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const getMeetingCode = useCallback(() => {

        return (
            url ||
            window.location.pathname
                .replace("/", "")
        );

    }, [url]);


    const hasAuthenticationToken = () => {

        return Boolean(
            localStorage.getItem(
                "token"
            )
        );

    };


    /*
    |--------------------------------------------------------------------------
    | Camera / Microphone Permissions
    |--------------------------------------------------------------------------
    */

    const getPermissions = useCallback(
        async () => {

            try {

                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    setCameraAvailable(false);
                    setMicrophoneAvailable(false);

                    return;

                }


                try {

                    const videoStream =
                        await navigator.mediaDevices.getUserMedia({
                            video: true
                        });


                    setCameraAvailable(true);


                    videoStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                } catch (videoError) {

                    console.log(
                        "Camera permission:",
                        videoError
                    );

                    setCameraAvailable(false);

                }


                try {

                    const audioStream =
                        await navigator.mediaDevices.getUserMedia({
                            audio: true
                        });


                    setMicrophoneAvailable(true);


                    audioStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                } catch (audioError) {

                    console.log(
                        "Microphone permission:",
                        audioError
                    );

                    setMicrophoneAvailable(false);

                }


                setScreenAvailable(
                    Boolean(
                        navigator.mediaDevices.getDisplayMedia
                    )
                );


            } catch (permissionError) {

                console.error(
                    "Permission check failed:",
                    permissionError
                );

            }

        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | Create Local Media
    |--------------------------------------------------------------------------
    */

    const createLocalStream = useCallback(
        async (
            includeVideo = video,
            includeAudio = audio
        ) => {

            try {

                if (
                    window.localStream
                ) {

                    window.localStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }


                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    throw new Error(
                        "Your browser does not support camera and microphone access."
                    );

                }


                const stream =
                    await navigator.mediaDevices.getUserMedia({

                        video:
                            includeVideo &&
                            cameraAvailable,

                        audio:
                            includeAudio &&
                            microphoneAvailable

                    });


                window.localStream =
                    stream;


                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current.srcObject =
                        stream;

                }


                return stream;


            } catch (mediaError) {

                console.error(
                    "Media error:",
                    mediaError
                );


                setError(
                    "Camera or microphone access failed. Please check your browser permissions."
                );


                return null;

            }

        },
        [
            video,
            audio,
            cameraAvailable,
            microphoneAvailable
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Guest Lobby Preview
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let active = true;


        const startPreview = async () => {

            await getPermissions();


            if (!active) {
                return;
            }


            try {

                if (
                    navigator.mediaDevices &&
                    navigator.mediaDevices.getUserMedia
                ) {

                    const preview =
                        await navigator.mediaDevices.getUserMedia({

                            video: true,
                            audio: true

                        });


                    window.previewStream =
                        preview;


                    if (
                        localVideoRef.current &&
                        guestLobby
                    ) {

                        localVideoRef.current.srcObject =
                            preview;

                    }

                }

            } catch (previewError) {

                console.log(
                    "Preview error:",
                    previewError
                );

            }

        };


        startPreview();


        return () => {

            active = false;

        };

    }, [
        getPermissions,
        guestLobby
    ]);


    /*
    |--------------------------------------------------------------------------
    | Stop Preview
    |--------------------------------------------------------------------------
    */

    const stopPreview = () => {

        try {

            if (
                window.previewStream
            ) {

                window.previewStream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );


                window.previewStream =
                    null;

            }

        } catch (previewError) {

            console.log(
                previewError
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Replace Local Tracks
    |--------------------------------------------------------------------------
    */

    const replaceLocalStream = async (
        newStream
    ) => {

        try {

            if (
                window.localStream
            ) {

                window.localStream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

            }


            window.localStream =
                newStream;


            if (
                localVideoRef.current
            ) {

                localVideoRef.current.srcObject =
                    newStream;

            }


            for (
                const peerId in connectionsRef.current
            ) {

                const peer =
                    connectionsRef.current[
                        peerId
                    ];


                const senders =
                    peer.getSenders();


                const videoTrack =
                    newStream
                        ?.getVideoTracks()[0];


                const audioTrack =
                    newStream
                        ?.getAudioTracks()[0];


                const videoSender =
                    senders.find(
                        sender =>
                            sender.track &&
                            sender.track.kind === "video"
                    );


                const audioSender =
                    senders.find(
                        sender =>
                            sender.track &&
                            sender.track.kind === "audio"
                    );


                if (
                    videoSender &&
                    videoTrack
                ) {

                    await videoSender.replaceTrack(
                        videoTrack
                    );

                }


                if (
                    audioSender &&
                    audioTrack
                ) {

                    await audioSender.replaceTrack(
                        audioTrack
                    );

                }

            }

        } catch (streamError) {

            console.error(
                "Stream replacement error:",
                streamError
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Send Signaling Message
    |--------------------------------------------------------------------------
    */

    const sendSignal = (
        targetId,
        data
    ) => {

        if (
            socketRef.current &&
            socketRef.current.connected
        ) {

            socketRef.current.emit(
                "signal",
                targetId,
                JSON.stringify(data)
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Create Offer
    |--------------------------------------------------------------------------
    */

    const createOffer = async (
        targetId
    ) => {

        const peer =
            connectionsRef.current[
                targetId
            ];


        if (!peer) {
            return;
        }


        try {

            const description =
                await peer.createOffer();


            await peer.setLocalDescription(
                description
            );


            sendSignal(
                targetId,
                {
                    sdp:
                        peer.localDescription
                }
            );


        } catch (offerError) {

            console.error(
                "Offer error:",
                offerError
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Create Peer Connection
    |--------------------------------------------------------------------------
    */

    const createPeerConnection = useCallback(
        (
            remoteId
        ) => {

            if (
                connectionsRef.current[
                    remoteId
                ]
            ) {

                return connectionsRef.current[
                    remoteId
                ];

            }


            const peer =
                new RTCPeerConnection(
                    peerConfigConnections
                );


            connectionsRef.current[
                remoteId
            ] = peer;


            peer.onicecandidate =
                event => {

                    if (
                        event.candidate
                    ) {

                        sendSignal(
                            remoteId,
                            {
                                ice:
                                    event.candidate
                            }
                        );

                    }

                };


            peer.ontrack =
                event => {

                    const stream =
                        event.streams[0];


                    setVideos(
                        currentVideos => {

                            const existing =
                                currentVideos.find(
                                    item =>
                                        item.socketId ===
                                        remoteId
                                );


                            if (
                                existing
                            ) {

                                return currentVideos.map(
                                    item =>
                                        item.socketId ===
                                        remoteId
                                            ? {
                                                ...item,
                                                stream
                                            }
                                            : item
                                );

                            }


                            return [

                                ...currentVideos,

                                {
                                    socketId:
                                        remoteId,

                                    stream
                                }

                            ];

                        }
                    );

                };


            peer.onconnectionstatechange =
                () => {

                    const state =
                        peer.connectionState;


                    if (
                        state ===
                        "failed" ||
                        state ===
                        "closed"
                    ) {

                        try {

                            peer.close();

                        } catch (closeError) {

                            console.log(
                                closeError
                            );

                        }


                        delete connectionsRef.current[
                            remoteId
                        ];

                    }

                };


            if (
                window.localStream
            ) {

                window.localStream
                    .getTracks()
                    .forEach(
                        track =>
                            peer.addTrack(
                                track,
                                window.localStream
                            )
                    );

            }


            return peer;

        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | Receive Signal
    |--------------------------------------------------------------------------
    */

    const gotMessageFromServer = useCallback(
        async (
            fromId,
            messageData
        ) => {

            try {

                const signal =
                    JSON.parse(
                        messageData
                    );


                const peer =
                    createPeerConnection(
                        fromId
                    );


                if (
                    signal.sdp
                ) {

                    await peer.setRemoteDescription(
                        new RTCSessionDescription(
                            signal.sdp
                        )
                    );


                    if (
                        signal.sdp.type ===
                        "offer"
                    ) {

                        const answer =
                            await peer.createAnswer();


                        await peer.setLocalDescription(
                            answer
                        );


                        sendSignal(
                            fromId,
                            {
                                sdp:
                                    peer.localDescription
                            }
                        );

                    }

                }


                if (
                    signal.ice
                ) {

                    try {

                        await peer.addIceCandidate(
                            new RTCIceCandidate(
                                signal.ice
                            )
                        );

                    } catch (
                        iceError
                    ) {

                        console.log(
                            "ICE error:",
                            iceError
                        );

                    }

                }

            } catch (signalError) {

                console.error(
                    "Signal handling error:",
                    signalError
                );

            }

        },
        [
            createPeerConnection
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Add Message
    |--------------------------------------------------------------------------
    */

    const addMessage = useCallback(
        (
            data,
            sender,
            senderSocketId
        ) => {

            setMessages(
                previousMessages => [

                    ...previousMessages,

                    {
                        sender:
                            sender ||
                            "Participant",

                        data:
                            data,

                        time:
                            new Date()
                                .toLocaleTimeString(
                                    [],
                                    {
                                        hour:
                                            "2-digit",

                                        minute:
                                            "2-digit"
                                    }
                                )
                    }

                ]
            );


            if (
                senderSocketId !==
                socketIdRef.current &&
                !showChat
            ) {

                setUnreadMessages(
                    previous =>
                        previous + 1
                );

            }

        },
        [
            showChat
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Socket Connection
    |--------------------------------------------------------------------------
    */

    const connectToSocketServer =
        useCallback(
            async () => {

                const token =
                    localStorage.getItem(
                        "token"
                    );


                if (!token) {

                    setError(
                        "Please sign in with Google before joining the call."
                    );

                    setGuestLobby(true);

                    return;

                }


                if (
                    socketRef.current
                ) {

                    try {

                        socketRef.current.disconnect();

                    } catch (disconnectError) {

                        console.log(
                            disconnectError
                        );

                    }

                }


                const socket =
                    io.connect(
                        serverUrl,
                        {
                            auth: {
                                token:
                                    token
                            },

                            transports: [
                                "websocket",
                                "polling"
                            ]
                        }
                    );


                socketRef.current =
                    socket;


                socket.on(
                    "connect_error",
                    socketError => {

                        console.error(
                            "Socket connection error:",
                            socketError
                        );


                        setError(
                            "Unable to connect to the meeting. Please try again."
                        );

                    }
                );


                socket.on(
                    "signal",
                    gotMessageFromServer
                );


                socket.on(
                    "connect",
                    () => {

                        socketIdRef.current =
                            socket.id;


                        socket.emit(
                            "join-call",
                            window.location.href
                        );


                        socket.on(
                            "chat-message",
                            addMessage
                        );


                        socket.on(
                            "user-left",
                            remoteId => {

                                setVideos(
                                    previousVideos =>
                                        previousVideos.filter(
                                            item =>
                                                item.socketId !==
                                                remoteId
                                        )
                                );


                                if (
                                    connectionsRef.current[
                                        remoteId
                                    ]
                                ) {

                                    try {

                                        connectionsRef.current[
                                            remoteId
                                        ].close();

                                    } catch (
                                        closeError
                                    ) {

                                        console.log(
                                            closeError
                                        );

                                    }


                                    delete connectionsRef.current[
                                        remoteId
                                    ];

                                }

                            }
                        );


                        socket.on(
                            "user-joined",
                            async (
                                joinedId,
                                clients
                            ) => {

                                for (
                                    const clientId of clients
                                ) {

                                    if (
                                        clientId ===
                                        socket.id
                                    ) {

                                        continue;

                                    }


                                    createPeerConnection(
                                        clientId
                                    );

                                }


                                if (
                                    joinedId ===
                                    socket.id
                                ) {

                                    for (
                                        const clientId of clients
                                    ) {

                                        if (
                                            clientId ===
                                            socket.id
                                        ) {

                                            continue;

                                        }


                                        await createOffer(
                                            clientId
                                        );

                                    }

                                }

                            }
                        );

                    }


                );

            },
            [
                addMessage,
                createPeerConnection,
                gotMessageFromServer
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | Start Authenticated Meeting
    |--------------------------------------------------------------------------
    */

    const startAuthenticatedMeeting =
        async () => {

            if (
                !username.trim()
            ) {

                setError(
                    "Please enter your name."
                );

                return;

            }


            setError("");


            if (
                !hasAuthenticationToken()
            ) {

                setShowLoginGate(
                    true
                );

                return;

            }


            setJoining(true);


            stopPreview();


            const stream =
                await createLocalStream(
                    video,
                    audio
                );


            if (!stream) {

                setJoining(false);

                return;

            }


            setGuestLobby(false);


            await connectToSocketServer();


            setJoining(false);

        };


    /*
    |--------------------------------------------------------------------------
    | Google Login From Gate
    |--------------------------------------------------------------------------
    */

    const handleGoogleAuthentication =
        async (
            credentialResponse
        ) => {

            try {

                setGoogleLoginLoading(
                    true
                );

                setError("");


                if (
                    !credentialResponse ||
                    !credentialResponse.credential
                ) {

                    throw new Error(
                        "Google authentication response is missing."
                    );

                }


                const result =
                    await handleGoogleLogin(
                        credentialResponse.credential
                    );


                if (
                    !result ||
                    !result.token
                ) {

                    throw new Error(
                        "Google login failed."
                    );

                }


                localStorage.setItem(
                    "token",
                    result.token
                );


                setShowLoginGate(
                    false
                );


                setGuestLobby(
                    false
                );


                setJoining(true);


                stopPreview();


                const stream =
                    await createLocalStream(
                        video,
                        audio
                    );


                if (!stream) {

                    setJoining(false);

                    return;

                }


                await connectToSocketServer();


                setJoining(false);


            } catch (googleError) {

                console.error(
                    "Google authentication error:",
                    googleError
                );


                setError(
                    googleError.response?.data?.message ||
                    googleError.message ||
                    "Google login failed."
                );

            } finally {

                setGoogleLoginLoading(
                    false
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Camera
    |--------------------------------------------------------------------------
    */

    const handleVideo =
        async () => {

            const nextVideo =
                !video;


            setVideo(
                nextVideo
            );


            if (
                window.localStream
            ) {

                const videoTracks =
                    window.localStream
                        .getVideoTracks();


                videoTracks.forEach(
                    track => {

                        track.enabled =
                            nextVideo;

                    }
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Microphone
    |--------------------------------------------------------------------------
    */

    const handleAudio =
        () => {

            const nextAudio =
                !audio;


            setAudio(
                nextAudio
            );


            if (
                window.localStream
            ) {

                const audioTracks =
                    window.localStream
                        .getAudioTracks();


                audioTracks.forEach(
                    track => {

                        track.enabled =
                            nextAudio;

                    }
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Screen Share
    |--------------------------------------------------------------------------
    */

    const handleScreen =
        async () => {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getDisplayMedia
            ) {

                return;

            }


            if (
                screen
            ) {

                setScreen(false);


                const stream =
                    await createLocalStream(
                        video,
                        audio
                    );


                if (
                    stream
                ) {

                    await replaceLocalStream(
                        stream
                    );

                }


                return;

            }


            try {

                const displayStream =
                    await navigator.mediaDevices.getDisplayMedia(
                        {
                            video: true,
                            audio: true
                        }
                    );


                setScreen(true);


                await replaceLocalStream(
                    displayStream
                );


                const screenTrack =
                    displayStream
                        .getVideoTracks()[0];


                if (
                    screenTrack
                ) {

                    screenTrack.onended =
                        async () => {

                            setScreen(
                                false
                            );


                            const stream =
                                await createLocalStream(
                                    video,
                                    audio
                                );


                            if (
                                stream
                            ) {

                                await replaceLocalStream(
                                    stream
                                );

                            }

                        };

                }

            } catch (screenError) {

                console.log(
                    "Screen sharing cancelled:",
                    screenError
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Send Chat Message
    |--------------------------------------------------------------------------
    */

    const sendMessage =
        () => {

            const cleanMessage =
                message.trim();


            if (
                !cleanMessage ||
                !socketRef.current ||
                !socketRef.current.connected
            ) {

                return;

            }


            socketRef.current.emit(
                "chat-message",
                cleanMessage,
                username
            );


            setMessage("");

        };


    /*
    |--------------------------------------------------------------------------
    | End Meeting
    |--------------------------------------------------------------------------
    */

    const handleEndCall =
        () => {

            try {

                if (
                    window.localStream
                ) {

                    window.localStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }


                if (
                    window.previewStream
                ) {

                    window.previewStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }


            } catch (mediaError) {

                console.log(
                    mediaError
                );

            }


            Object.values(
                connectionsRef.current
            ).forEach(
                peer => {

                    try {

                        peer.close();

                    } catch (
                        closeError
                    ) {

                        console.log(
                            closeError
                        );

                    }

                }
            );


            connectionsRef.current =
                {};


            if (
                socketRef.current
            ) {

                try {

                    socketRef.current.disconnect();

                } catch (
                    disconnectError
                ) {

                    console.log(
                        disconnectError
                    );

                }

            }


            socketRef.current =
                null;


            socketIdRef.current =
                null;


            window.localStream =
                null;


            navigate(
                "/home"
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Copy Meeting Link
    |--------------------------------------------------------------------------
    */

    const copyMeetingLink =
        async () => {

            try {

                await navigator.clipboard.writeText(
                    window.location.href
                );


                setCopied(
                    true
                );


                setTimeout(
                    () => {

                        setCopied(
                            false
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
    | Toggle Chat
    |--------------------------------------------------------------------------
    */

    const toggleChat =
        () => {

            setShowChat(
                previous =>
                    !previous
            );


            setUnreadMessages(
                0
            );

            setShowParticipants(
                false
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Toggle Participants
    |--------------------------------------------------------------------------
    */

    const toggleParticipants =
        () => {

            setShowParticipants(
                previous =>
                    !previous
            );


            setShowChat(
                false
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        return () => {

            try {

                if (
                    window.localStream
                ) {

                    window.localStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }


                if (
                    window.previewStream
                ) {

                    window.previewStream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                }


            } catch (cleanupError) {

                console.log(
                    cleanupError
                );

            }


            Object.values(
                connectionsRef.current
            ).forEach(
                peer => {

                    try {

                        peer.close();

                    } catch (
                        closeError
                    ) {

                        console.log(
                            closeError
                        );

                    }

                }
            );


            if (
                socketRef.current
            ) {

                try {

                    socketRef.current.disconnect();

                } catch (
                    disconnectError
                ) {

                    console.log(
                        disconnectError
                    );

                }

            }

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    const meetingCode =
        getMeetingCode();


    if (
        guestLobby
    ) {

        return (

            <Box
                sx={{
                    minHeight:
                        "100dvh",

                    width:
                        "100%",

                    background:
                        "linear-gradient(135deg,#eef4ff 0%,#f8faff 55%,#ffffff 100%)",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    p: {
                        xs: 2,
                        sm: 3
                    }
                }}
            >

                <Box
                    sx={{
                        width:
                            "100%",

                        maxWidth:
                            1100,

                        display:
                            "grid",

                        gridTemplateColumns:
                            {
                                xs:
                                    "1fr",

                                md:
                                    "1.25fr 0.75fr"
                            },

                        gap:
                            {
                                xs: 2,
                                md: 3
                            }
                    }}
                >

                    {/* Preview */}

                    <Box
                        sx={{
                            position:
                                "relative",

                            width:
                                "100%",

                            aspectRatio:
                                {
                                    xs:
                                        "4 / 3",

                                    sm:
                                        "16 / 10"
                                },

                            borderRadius:
                                {
                                    xs: 3,
                                    sm: 4
                                },

                            overflow:
                                "hidden",

                            background:
                                "#111827",

                            boxShadow:
                                "0 24px 60px rgba(15,23,42,0.14)"
                        }}
                    >

                        <video
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width:
                                    "100%",

                                height:
                                    "100%",

                                objectFit:
                                    "cover",

                                transform:
                                    "scaleX(-1)"
                            }}
                        />


                        <Box
                            sx={{
                                position:
                                    "absolute",

                                left:
                                    16,

                                right:
                                    16,

                                bottom:
                                    16,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                gap:
                                    1
                            }}
                        >

                            <Box
                                sx={{
                                    background:
                                        "rgba(0,0,0,0.55)",

                                    backdropFilter:
                                        "blur(8px)",

                                    color:
                                        "#fff",

                                    borderRadius:
                                        2,

                                    px:
                                        1.5,

                                    py:
                                        0.8
                                }}
                            >

                                <Typography
                                    sx={{
                                        fontSize:
                                            "0.82rem",

                                        fontWeight:
                                            600
                                    }}
                                >
                                    Camera preview
                                </Typography>

                            </Box>


                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    gap:
                                        0.8
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            34,

                                        height:
                                            34,

                                        borderRadius:
                                            "50%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "rgba(0,0,0,0.55)",

                                        color:
                                            "#fff"
                                    }}
                                >

                                    {cameraAvailable ? (
                                        <VideocamIcon
                                            fontSize="small"
                                        />
                                    ) : (
                                        <VideocamOffIcon
                                            fontSize="small"
                                        />
                                    )}

                                </Box>


                                <Box
                                    sx={{
                                        width:
                                            34,

                                        height:
                                            34,

                                        borderRadius:
                                            "50%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "rgba(0,0,0,0.55)",

                                        color:
                                            "#fff"
                                    }}
                                >

                                    {microphoneAvailable ? (
                                        <MicIcon
                                            fontSize="small"
                                        />
                                    ) : (
                                        <MicOffIcon
                                            fontSize="small"
                                        />
                                    )}

                                </Box>

                            </Box>

                        </Box>

                    </Box>


                    {/* Lobby */}

                    <Box
                        sx={{
                            background:
                                "#fff",

                            borderRadius:
                                {
                                    xs: 3,
                                    sm: 4
                                },

                            p:
                                {
                                    xs: 2.5,
                                    sm: 4
                                },

                            display:
                                "flex",

                            flexDirection:
                                "column",

                            justifyContent:
                                "center",

                            boxShadow:
                                "0 18px 50px rgba(15,23,42,0.08)",

                            border:
                                "1px solid rgba(15,23,42,0.06)"
                        }}
                    >

                        <Box
                            sx={{
                                width:
                                    52,

                                height:
                                    52,

                                borderRadius:
                                    2.5,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                background:
                                    "#eaf2ff",

                                color:
                                    "#1976d2",

                                mb:
                                    2
                            }}
                        >

                            <PeopleIcon />

                        </Box>


                        <Typography
                            component="h1"
                            sx={{
                                fontSize:
                                    {
                                        xs:
                                            "1.8rem",

                                        sm:
                                            "2.2rem"
                                    },

                                fontWeight:
                                    800,

                                letterSpacing:
                                    "-0.04em",

                                color:
                                    "#171b2d",

                                mb:
                                    1
                            }}
                        >
                            Ready to join?
                        </Typography>


                        <Typography
                            sx={{
                                color:
                                    "#667085",

                                lineHeight:
                                    1.65,

                                mb:
                                    2.5
                            }}
                        >
                            You're about to join meeting{" "}
                            <strong>
                                {meetingCode}
                            </strong>
                            . Preview your camera and
                            microphone first.
                        </Typography>


                        <TextField
                            fullWidth
                            label="Your name"
                            value={
                                username
                            }
                            onChange={
                                event => {

                                    setUsername(
                                        event.target.value
                                    );

                                    setError(
                                        ""
                                    );

                                }
                            }
                            autoComplete="off"
                            sx={{
                                mb:
                                    1.5,

                                "& .MuiOutlinedInput-root":
                                {
                                    borderRadius:
                                        2.5
                                }
                            }}
                        />


                        {error && (

                            <Typography
                                sx={{
                                    color:
                                        "#d32f2f",

                                    fontSize:
                                        "0.85rem",

                                    mb:
                                        1.5
                                }}
                            >
                                {error}
                            </Typography>

                        )}


                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={
                                startAuthenticatedMeeting
                            }
                            disabled={
                                joining
                            }
                            endIcon={
                                joining
                                    ? (
                                        <CircularProgress
                                            size={18}
                                            color="inherit"
                                        />
                                    )
                                    : (
                                        <ArrowBackIcon
                                            sx={{
                                                transform:
                                                    "rotate(180deg)"
                                            }}
                                        />
                                    )
                            }
                            sx={{
                                py:
                                    1.45,

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
                            {joining
                                ? "Joining..."
                                : "Join Meeting"}
                        </Button>


                        <Box
                            sx={{
                                mt:
                                    2.5,

                                p:
                                    1.6,

                                borderRadius:
                                    2.5,

                                background:
                                    "#f7f9fc"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        "0.8rem",

                                    fontWeight:
                                        700,

                                    color:
                                        "#344054",

                                    mb:
                                        0.5
                                }}
                            >
                                Secure meeting access
                            </Typography>


                            <Typography
                                sx={{
                                    fontSize:
                                        "0.78rem",

                                    color:
                                        "#667085",

                                    lineHeight:
                                        1.5
                                }}
                            >
                                Guests can preview the meeting,
                                but Google sign-in is required
                                before entering the video call.
                            </Typography>

                        </Box>

                    </Box>

                </Box>


                {/* Login Gate */}

                {showLoginGate && (

                    <Box
                        sx={{
                            position:
                                "fixed",

                            inset:
                                0,

                            zIndex:
                                2000,

                            background:
                                "rgba(15,23,42,0.62)",

                            backdropFilter:
                                "blur(8px)",

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            p:
                                2
                        }}
                    >

                        <Box
                            sx={{
                                width:
                                    "100%",

                                maxWidth:
                                    440,

                                background:
                                    "#fff",

                                borderRadius:
                                    4,

                                p:
                                    {
                                        xs: 3,
                                        sm: 4
                                    },

                                textAlign:
                                    "center",

                                boxShadow:
                                    "0 30px 90px rgba(0,0,0,0.22)"
                            }}
                        >

                            <Box
                                sx={{
                                    width:
                                        58,

                                    height:
                                        58,

                                    mx:
                                        "auto",

                                    mb:
                                        2,

                                    borderRadius:
                                        "18px",

                                    background:
                                        "#eef4ff",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center"
                                }}
                            >
                                🔐
                            </Box>


                            <Typography
                                sx={{
                                    fontSize:
                                        "1.65rem",

                                    fontWeight:
                                        800,

                                    color:
                                        "#171b2d",

                                    mb:
                                        1
                                }}
                            >
                                Sign in to join
                            </Typography>


                            <Typography
                                sx={{
                                    color:
                                        "#667085",

                                    lineHeight:
                                        1.65,

                                    mb:
                                        3
                                }}
                            >
                                You're in the meeting lobby.
                                Continue with Google to enter
                                the actual video call.
                            </Typography>


                            {googleLoginLoading ? (

                                <Button
                                    fullWidth
                                    disabled
                                    variant="contained"
                                    sx={{
                                        py:
                                            1.4,

                                        borderRadius:
                                            2.5,

                                        textTransform:
                                            "none"
                                    }}
                                >
                                    <CircularProgress
                                        size={20}
                                        color="inherit"
                                    />
                                </Button>

                            ) : (

                                <Box
                                    sx={{
                                        display:
                                            "flex",

                                        justifyContent:
                                            "center"
                                    }}
                                >

                                    <GoogleLogin
                                        onSuccess={
                                            handleGoogleAuthentication
                                        }
                                        onError={() =>
                                            setError(
                                                "Google login failed. Please try again."
                                            )
                                        }
                                        useOneTap
                                    />

                                </Box>

                            )}


                            <Button
                                fullWidth
                                variant="text"
                                onClick={() =>
                                    setShowLoginGate(
                                        false
                                    )
                                }
                                sx={{
                                    mt:
                                        1.5,

                                    textTransform:
                                        "none"
                                }}
                            >
                                Back to lobby
                            </Button>

                        </Box>

                    </Box>

                )}

            </Box>

        );

    }


    return (

        <Box
            sx={{
                minHeight:
                    "100dvh",

                background:
                    "#0b0f17",

                color:
                    "#fff",

                display:
                    "flex",

                flexDirection:
                    "column",

                overflow:
                    "hidden"
            }}
        >

            {/* Top bar */}

            <Box
                sx={{
                    minHeight:
                        {
                            xs: 56,
                            sm: 64
                        },

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    px:
                        {
                            xs: 1.2,
                            sm: 2
                        },

                    gap:
                        1,

                    background:
                        "#111722",

                    borderBottom:
                        "1px solid rgba(255,255,255,0.07)"
                }}
            >

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            {
                                xs: 0.6,
                                sm: 1
                            },

                        minWidth:
                            0
                    }}
                >

                    <IconButton
                        onClick={
                            handleEndCall
                        }
                        sx={{
                            color:
                                "#fff"
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>


                    <Box
                        sx={{
                            minWidth:
                                0
                        }}
                    >

                        <Typography
                            sx={{
                                fontWeight:
                                    800,

                                fontSize:
                                    {
                                        xs:
                                            "0.95rem",

                                        sm:
                                            "1.05rem"
                                    },

                                whiteSpace:
                                    "nowrap",

                                overflow:
                                    "hidden",

                                textOverflow:
                                    "ellipsis"
                            }}
                        >
                            ApnaaZoom
                        </Typography>


                        <Typography
                            sx={{
                                color:
                                    "#98a2b3",

                                fontSize:
                                    {
                                        xs:
                                            "0.7rem",

                                        sm:
                                            "0.76rem"
                                    },

                                whiteSpace:
                                    "nowrap"
                            }}
                        >
                            Meeting • {meetingCode}
                        </Typography>

                    </Box>

                </Box>


                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            0.5
                    }}
                >

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                            <ContentCopyIcon
                                sx={{
                                    fontSize:
                                        "16px !important"
                                }}
                            />
                        }
                        onClick={
                            copyMeetingLink
                        }
                        sx={{
                            color:
                                "#fff",

                            borderColor:
                                "rgba(255,255,255,0.2)",

                            borderRadius:
                                2,

                            textTransform:
                                "none",

                            display:
                                {
                                    xs:
                                        "none",

                                    sm:
                                        "inline-flex"
                                }
                        }}
                    >
                        {copied
                            ? "Copied"
                            : "Copy link"}
                    </Button>


                    <Badge
                        badgeContent={
                            videos.length + 1
                        }
                        color="primary"
                    >

                        <IconButton
                            onClick={
                                toggleParticipants
                            }
                            sx={{
                                color:
                                    "#fff"
                            }}
                        >
                            <PeopleIcon />
                        </IconButton>

                    </Badge>

                </Box>

            </Box>


            {/* Meeting area */}

            <Box
                sx={{
                    flex:
                        1,

                    minHeight:
                        0,

                    position:
                        "relative",

                    display:
                        "flex"
                }}
            >

                {/* Video area */}

                <Box
                    sx={{
                        flex:
                            1,

                        minWidth:
                            0,

                        minHeight:
                            0,

                        p:
                            {
                                xs:
                                    1,

                                sm:
                                    1.5,

                                md:
                                    2
                            },

                        display:
                            "grid",

                        gridTemplateColumns:
                            {
                                xs:
                                    "1fr",

                                sm:
                                    videos.length <= 1
                                        ? "1fr"
                                        : "repeat(2, minmax(0, 1fr))",

                                md:
                                    videos.length <= 1
                                        ? "1fr"
                                        : videos.length <= 3
                                            ? "repeat(2, minmax(0, 1fr))"
                                            : "repeat(3, minmax(0, 1fr))"
                            },

                        gridAutoRows:
                            "minmax(0, 1fr)",

                        gap:
                            {
                                xs:
                                    1,

                                sm:
                                    1.25,

                                md:
                                    1.5
                            },

                        overflowY:
                            "auto"
                    }}
                >

                    {/* Local video */}

                    <Box
                        sx={{
                            position:
                                "relative",

                            background:
                                "#151b26",

                            borderRadius:
                                {
                                    xs:
                                        2,

                                    sm:
                                        3
                                },

                            overflow:
                                "hidden",

                            minHeight:
                                {
                                    xs:
                                        "220px",

                                    sm:
                                        "260px"
                                },

                            border:
                                "1px solid rgba(255,255,255,0.06)"
                        }}
                    >

                        <video
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width:
                                    "100%",

                                height:
                                    "100%",

                                objectFit:
                                    "cover",

                                transform:
                                    "scaleX(-1)"
                            }}
                        />


                        {!video && (

                            <Box
                                sx={{
                                    position:
                                        "absolute",

                                    inset:
                                        0,

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    background:
                                        "#1b2230"
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            74,

                                        height:
                                            74,

                                        borderRadius:
                                            "50%",

                                        background:
                                            "#2b3444",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        fontSize:
                                            "1.8rem",

                                        fontWeight:
                                            800
                                    }}
                                >
                                    {(
                                        username ||
                                        "U"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </Box>

                            </Box>

                        )}


                        <Box
                            sx={{
                                position:
                                    "absolute",

                                left:
                                    10,

                                bottom:
                                    10,

                                px:
                                    1.2,

                                py:
                                    0.6,

                                borderRadius:
                                    1.5,

                                background:
                                    "rgba(0,0,0,0.55)",

                                backdropFilter:
                                    "blur(8px)"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        {
                                            xs:
                                                "0.75rem",

                                            sm:
                                                "0.82rem"
                                        },

                                    fontWeight:
                                        600
                                }}
                            >
                                {username || "You"}
                            </Typography>

                        </Box>


                        {!audio && (

                            <Box
                                sx={{
                                    position:
                                        "absolute",

                                    top:
                                        10,

                                    right:
                                        10,

                                    width:
                                        32,

                                    height:
                                        32,

                                    borderRadius:
                                        "50%",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    background:
                                        "#ef4444"
                                }}
                            >

                                <MicOffIcon
                                    sx={{
                                        fontSize:
                                            18
                                    }}
                                />

                            </Box>

                        )}

                    </Box>


                    {/* Remote videos */}

                    {videos.map(
                        remoteVideo => (

                            <Box
                                key={
                                    remoteVideo.socketId
                                }
                                sx={{
                                    position:
                                        "relative",

                                    background:
                                        "#151b26",

                                    borderRadius:
                                        {
                                            xs:
                                                2,

                                            sm:
                                                3
                                        },

                                    overflow:
                                        "hidden",

                                    minHeight:
                                        {
                                            xs:
                                                "220px",

                                            sm:
                                                "260px"
                                        },

                                    border:
                                        "1px solid rgba(255,255,255,0.06)"
                                }}
                            >

                                <video
                                    autoPlay
                                    playsInline
                                    ref={
                                        element => {

                                            if (
                                                element &&
                                                remoteVideo.stream
                                            ) {

                                                element.srcObject =
                                                    remoteVideo.stream;

                                            }


                                            videoRefs.current[
                                                remoteVideo.socketId
                                            ] =
                                                element;

                                        }
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        height:
                                            "100%",

                                        objectFit:
                                            "cover"
                                    }}
                                />


                                <Box
                                    sx={{
                                        position:
                                            "absolute",

                                        left:
                                            10,

                                        bottom:
                                            10,

                                        px:
                                            1.2,

                                        py:
                                            0.6,

                                        borderRadius:
                                            1.5,

                                        background:
                                            "rgba(0,0,0,0.55)",

                                        backdropFilter:
                                            "blur(8px)"
                                    }}
                                >

                                    <Typography
                                        sx={{
                                            fontSize:
                                                {
                                                    xs:
                                                        "0.75rem",

                                                    sm:
                                                        "0.82rem"
                                                },

                                            fontWeight:
                                                600
                                        }}
                                    >
                                        Participant
                                    </Typography>

                                </Box>

                            </Box>

                        )
                    )}

                </Box>


                {/* Chat panel */}

                {showChat && (

                    <Box
                        sx={{
                            position:
                                "absolute",

                            right:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            top:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            bottom:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            width:
                                {
                                    xs:
                                        "100%",

                                    sm:
                                        360
                                },

                            background:
                                "#fff",

                            color:
                                "#111827",

                            zIndex:
                                20,

                            display:
                                "flex",

                            flexDirection:
                                "column",

                            borderRadius:
                                {
                                    xs:
                                        0,

                                    sm:
                                        3
                                },

                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.3)",

                            overflow:
                                "hidden"
                        }}
                    >

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                px:
                                    2,

                                py:
                                    1.5,

                                borderBottom:
                                    "1px solid #eaecf0"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontWeight:
                                        800
                                }}
                            >
                                Meeting chat
                            </Typography>


                            <IconButton
                                onClick={
                                    toggleChat
                                }
                            >
                                <CloseIcon />
                            </IconButton>

                        </Box>


                        <Box
                            sx={{
                                flex:
                                    1,

                                overflowY:
                                    "auto",

                                p:
                                    2
                            }}
                        >

                            {messages.length === 0 ? (

                                <Box
                                    sx={{
                                        height:
                                            "100%",

                                        display:
                                            "flex",

                                        flexDirection:
                                            "column",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        textAlign:
                                            "center",

                                        color:
                                            "#98a2b3"
                                    }}
                                >

                                    <ChatIcon
                                        sx={{
                                            fontSize:
                                                42,

                                            mb:
                                                1,

                                            opacity:
                                                0.5
                                        }}
                                    />


                                    <Typography
                                        sx={{
                                            fontWeight:
                                                700,

                                            mb:
                                                0.5
                                        }}
                                    >
                                        No messages yet
                                    </Typography>


                                    <Typography
                                        sx={{
                                            fontSize:
                                                "0.85rem"
                                        }}
                                    >
                                        Start the conversation.
                                    </Typography>

                                </Box>

                            ) : (

                                messages.map(
                                    (
                                        chatMessage,
                                        index
                                    ) => (

                                        <Box
                                            key={
                                                index
                                            }
                                            sx={{
                                                mb:
                                                    2
                                            }}
                                        >

                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",

                                                    justifyContent:
                                                        "space-between",

                                                    gap:
                                                        1,

                                                    mb:
                                                        0.4
                                                }}
                                            >

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.8rem",

                                                        fontWeight:
                                                            700,

                                                        color:
                                                            "#344054"
                                                    }}
                                                >
                                                    {
                                                        chatMessage.sender
                                                    }
                                                </Typography>


                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.7rem",

                                                        color:
                                                            "#98a2b3"
                                                    }}
                                                >
                                                    {
                                                        chatMessage.time
                                                    }
                                                </Typography>

                                            </Box>


                                            <Box
                                                sx={{
                                                    background:
                                                        "#f2f4f7",

                                                    borderRadius:
                                                        "4px 12px 12px 12px",

                                                    p:
                                                        1.2
                                                }}
                                            >

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            "0.9rem",

                                                        color:
                                                            "#1d2939",

                                                        wordBreak:
                                                            "break-word"
                                                    }}
                                                >
                                                    {
                                                        chatMessage.data
                                                    }
                                                </Typography>

                                            </Box>

                                        </Box>

                                    )
                                )

                            )}

                        </Box>


                        <Box
                            sx={{
                                p:
                                    1.5,

                                borderTop:
                                    "1px solid #eaecf0",

                                display:
                                    "flex",

                                gap:
                                    1
                            }}
                        >

                            <TextField
                                fullWidth
                                size="small"
                                value={
                                    message
                                }
                                onChange={
                                    event =>
                                        setMessage(
                                            event.target.value
                                        )
                                }
                                onKeyDown={
                                    event => {

                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {

                                            sendMessage();

                                        }

                                    }
                                }
                                placeholder="Type a message..."
                                sx={{
                                    "& .MuiOutlinedInput-root":
                                    {
                                        borderRadius:
                                            2
                                    }
                                }}
                            />


                            <Button
                                variant="contained"
                                onClick={
                                    sendMessage
                                }
                                sx={{
                                    minWidth:
                                        76,

                                    borderRadius:
                                        2,

                                    textTransform:
                                        "none"
                                }}
                            >
                                Send
                            </Button>

                        </Box>

                    </Box>

                )}


                {/* Participants panel */}

                {showParticipants && (

                    <Box
                        sx={{
                            position:
                                "absolute",

                            right:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            top:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            bottom:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            width:
                                {
                                    xs:
                                        "100%",

                                    sm:
                                        310
                                },

                            background:
                                "#fff",

                            color:
                                "#111827",

                            zIndex:
                                20,

                            borderRadius:
                                {
                                    xs:
                                        0,

                                    sm:
                                        3
                                },

                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.3)",

                            overflow:
                                "hidden"
                        }}
                    >

                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "space-between",

                                px:
                                    2,

                                py:
                                    1.5,

                                borderBottom:
                                    "1px solid #eaecf0"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontWeight:
                                        800
                                }}
                            >
                                Participants
                            </Typography>


                            <IconButton
                                onClick={
                                    toggleParticipants
                                }
                            >
                                <CloseIcon />
                            </IconButton>

                        </Box>


                        <Box
                            sx={{
                                p:
                                    2
                            }}
                        >

                            <Box
                                sx={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        1.2,

                                    p:
                                        1.5,

                                    borderRadius:
                                        2,

                                    background:
                                        "#f2f4f7",

                                    mb:
                                        1
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            38,

                                        height:
                                            38,

                                        borderRadius:
                                            "50%",

                                        background:
                                            "#dbeafe",

                                        color:
                                            "#1d4ed8",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        fontWeight:
                                            800
                                    }}
                                >
                                    {(
                                        username ||
                                        "U"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </Box>


                                <Box>
                                    <Typography
                                        sx={{
                                            fontWeight:
                                                700,

                                            fontSize:
                                                "0.9rem"
                                        }}
                                    >
                                        {username ||
                                            "You"}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color:
                                                "#667085",

                                            fontSize:
                                                "0.75rem"
                                        }}
                                    >
                                        You
                                    </Typography>
                                </Box>

                            </Box>


                            {videos.map(
                                (
                                    participant,
                                    index
                                ) => (

                                    <Box
                                        key={
                                            participant.socketId
                                        }
                                        sx={{
                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            gap:
                                                1.2,

                                            p:
                                                1.5,

                                            borderRadius:
                                                2,

                                            mb:
                                                1,

                                            background:
                                                "#f9fafb"
                                        }}
                                    >

                                        <Box
                                            sx={{
                                                width:
                                                    38,

                                                height:
                                                    38,

                                                borderRadius:
                                                    "50%",

                                                background:
                                                    "#ede9fe",

                                                color:
                                                    "#6d28d9",

                                                display:
                                                    "flex",

                                                alignItems:
                                                    "center",

                                                justifyContent:
                                                    "center",

                                                fontWeight:
                                                    800
                                            }}
                                        >
                                            P
                                        </Box>


                                        <Typography
                                            sx={{
                                                fontWeight:
                                                    600,

                                                fontSize:
                                                    "0.9rem"
                                            }}
                                        >
                                            Participant{" "}
                                            {index +
                                                1}
                                        </Typography>

                                    </Box>

                                )
                            )}

                        </Box>

                    </Box>

                )}

            </Box>


            {/* Bottom controls */}

            <Box
                sx={{
                    minHeight:
                        {
                            xs:
                                72,

                            sm:
                                82
                        },

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    px:
                        {
                            xs:
                                1,

                            sm:
                                2
                        },

                    background:
                        "#111722",

                    borderTop:
                        "1px solid rgba(255,255,255,0.07)"
                }}
            >

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        gap:
                            {
                                xs:
                                    0.5,

                                sm:
                                    1
                            },

                        maxWidth:
                            "100%"
                    }}
                >

                    {/* Mic */}

                    <IconButton
                        onClick={
                            handleAudio
                        }
                        sx={{
                            width:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            height:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            color:
                                "#fff",

                            background:
                                audio
                                    ? "#202938"
                                    : "#ef4444",

                            "&:hover":
                            {
                                background:
                                    audio
                                        ? "#2a3445"
                                        : "#dc2626"
                            }
                        }}
                    >

                        {audio ? (
                            <MicIcon />
                        ) : (
                            <MicOffIcon />
                        )}

                    </IconButton>


                    {/* Camera */}

                    <IconButton
                        onClick={
                            handleVideo
                        }
                        sx={{
                            width:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            height:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            color:
                                "#fff",

                            background:
                                video
                                    ? "#202938"
                                    : "#ef4444",

                            "&:hover":
                            {
                                background:
                                    video
                                        ? "#2a3445"
                                        : "#dc2626"
                            }
                        }}
                    >

                        {video ? (
                            <VideocamIcon />
                        ) : (
                            <VideocamOffIcon />
                        )}

                    </IconButton>


                    {/* Screen share */}

                    {screenAvailable && (

                        <IconButton
                            onClick={
                                handleScreen
                            }
                            sx={{
                                width:
                                    {
                                        xs:
                                            46,

                                        sm:
                                            52
                                    },

                                height:
                                    {
                                        xs:
                                            46,

                                        sm:
                                            52
                                    },

                                color:
                                    "#fff",

                                background:
                                    screen
                                        ? "#1976d2"
                                        : "#202938",

                                "&:hover":
                                {
                                    background:
                                        screen
                                            ? "#1565c0"
                                            : "#2a3445"
                                }
                            }}
                        >

                            {screen ? (
                                <StopScreenShareIcon />
                            ) : (
                                <ScreenShareIcon />
                            )}

                        </IconButton>

                    )}


                    {/* Chat */}

                    <Badge
                        badgeContent={
                            unreadMessages
                        }
                        color="error"
                        max={99}
                    >

                        <IconButton
                            onClick={
                                toggleChat
                            }
                            sx={{
                                width:
                                    {
                                        xs:
                                            46,

                                        sm:
                                            52
                                    },

                                height:
                                    {
                                        xs:
                                            46,

                                        sm:
                                            52
                                    },

                                color:
                                    "#fff",

                                background:
                                    showChat
                                        ? "#1976d2"
                                        : "#202938",

                                "&:hover":
                                {
                                    background:
                                        showChat
                                            ? "#1565c0"
                                            : "#2a3445"
                                }
                            }}
                        >
                            <ChatIcon />
                        </IconButton>

                    </Badge>


                    {/* Participants */}

                    <IconButton
                        onClick={
                            toggleParticipants
                        }
                        sx={{
                            width:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            height:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            color:
                                "#fff",

                            background:
                                showParticipants
                                    ? "#1976d2"
                                    : "#202938",

                            "&:hover":
                            {
                                background:
                                    showParticipants
                                        ? "#1565c0"
                                        : "#2a3445"
                            }
                        }}
                    >
                        <PeopleIcon />
                    </IconButton>


                    {/* End call */}

                    <IconButton
                        onClick={
                            handleEndCall
                        }
                        sx={{
                            width:
                                {
                                    xs:
                                        54,

                                    sm:
                                        60
                                },

                            height:
                                {
                                    xs:
                                        46,

                                    sm:
                                        52
                                },

                            borderRadius:
                                3,

                            color:
                                "#fff",

                            background:
                                "#dc2626",

                            "&:hover":
                            {
                                background:
                                    "#b91c1c"
                            }
                        }}
                    >
                        <CallEndIcon />
                    </IconButton>

                </Box>

            </Box>

        </Box>

    );

}
