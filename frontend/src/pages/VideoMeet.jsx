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
    useNavigate,
    useParams
} from "react-router-dom";

import {
    AuthContext
} from "../contexts/AuthContext";

import server from "../environment";

import styles from "../styles/videoComponent.module.css";


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

    const {
        url
    } = useParams();


    const navigate =
        useNavigate();


    const {
        handleGoogleLogin
    } =
        React.useContext(
            AuthContext
        );


    const socketRef =
        useRef(null);


    const socketIdRef =
        useRef(null);


    const localVideoRef =
        useRef(null);


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


    const [meetingValid, setMeetingValid] =
        useState(false);


    const [meetingChecking, setMeetingChecking] =
        useState(true);


    /*
    |--------------------------------------------------------------------------
    | Meeting Code
    |--------------------------------------------------------------------------
    */

    const getMeetingCode = useCallback(() => {

        return String(
            url || ""
        ).trim();

    }, [url]);


    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    const hasAuthenticationToken = () => {

        return Boolean(
            localStorage.getItem(
                "token"
            )
        );

    };


    /*
    |--------------------------------------------------------------------------
    | Validate Meeting
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let active = true;


        const validateMeeting = async () => {

            const meetingCode =
                getMeetingCode();


            if (!meetingCode) {

                if (active) {

                    setMeetingChecking(
                        false
                    );

                    setMeetingValid(
                        false
                    );

                    setError(
                        "Meeting code is missing."
                    );

                }

                return;

            }


            try {

                setMeetingChecking(
                    true
                );

                setError("");


                const response =
                    await fetch(
                        `${serverUrl}/api/v1/users/meeting/${encodeURIComponent(meetingCode)}`
                    );


                let data = {};


                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    data = {};

                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Meeting not found"
                    );

                }


                if (active) {

                    setMeetingValid(
                        data.valid === true
                    );

                }


            } catch (validationError) {

                console.error(
                    "Meeting validation error:",
                    validationError
                );


                if (active) {

                    setMeetingValid(
                        false
                    );

                    setError(
                        validationError.message ||
                        "Meeting not found"
                    );

                }

            } finally {

                if (active) {

                    setMeetingChecking(
                        false
                    );

                }

            }

        };


        validateMeeting();


        return () => {

            active = false;

        };

    }, [
        getMeetingCode
    ]);


    /*
    |--------------------------------------------------------------------------
    | Permissions
    |--------------------------------------------------------------------------
    */

    const getPermissions =
        useCallback(
            async () => {

                try {

                    if (
                        !navigator.mediaDevices ||
                        !navigator.mediaDevices.getUserMedia
                    ) {

                        setCameraAvailable(
                            false
                        );

                        setMicrophoneAvailable(
                            false
                        );

                        return;

                    }


                    try {

                        const videoStream =
                            await navigator.mediaDevices.getUserMedia({
                                video:
                                    true
                            });


                        setCameraAvailable(
                            true
                        );


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


                        setCameraAvailable(
                            false
                        );

                    }


                    try {

                        const audioStream =
                            await navigator.mediaDevices.getUserMedia({
                                audio:
                                    true
                            });


                        setMicrophoneAvailable(
                            true
                        );


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


                        setMicrophoneAvailable(
                            false
                        );

                    }


                    setScreenAvailable(
                        Boolean(
                            navigator.mediaDevices
                                .getDisplayMedia
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
    | Create Local Stream
    |--------------------------------------------------------------------------
    */

    const createLocalStream =
        useCallback(
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
    | Guest Preview
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            meetingChecking ||
            !meetingValid ||
            !guestLobby
        ) {

            return;

        }


        let active = true;


        const startPreview =
            async () => {

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

                                video:
                                    true,

                                audio:
                                    true

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
        guestLobby,
        meetingChecking,
        meetingValid
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
    | Replace Local Stream
    |--------------------------------------------------------------------------
    */

    const replaceLocalStream =
        async (
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
                    const peerId in
                    connectionsRef.current
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
                                sender.track.kind ===
                                    "video"
                        );


                    const audioSender =
                        senders.find(
                            sender =>
                                sender.track &&
                                sender.track.kind ===
                                    "audio"
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
    | Signaling
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
                JSON.stringify(
                    data
                )
            );

        }

    };


    /*
    |--------------------------------------------------------------------------
    | Create Offer
    |--------------------------------------------------------------------------
    */

    const createOffer =
        async (
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
    | Peer Connection
    |--------------------------------------------------------------------------
    */

    const createPeerConnection =
        useCallback(
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
                ] =
                    peer;


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
                            state === "failed" ||
                            state === "closed"
                        ) {

                            try {

                                peer.close();

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


                            setVideos(
                                currentVideos =>
                                    currentVideos.filter(
                                        item =>
                                            item.socketId !==
                                            remoteId
                                    )
                            );

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

    const gotMessageFromServer =
        useCallback(
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
    | Chat
    |--------------------------------------------------------------------------
    */

    const addMessage =
        useCallback(
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
    | Socket
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


                    setGuestLobby(
                        true
                    );


                    return;

                }


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
                    "chat-message",
                    addMessage
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


            setJoining(
                true
            );


            stopPreview();


            const stream =
                await createLocalStream(
                    video,
                    audio
                );


            if (!stream) {

                setJoining(
                    false
                );

                return;

            }


            setGuestLobby(
                false
            );


            await connectToSocketServer();


            setJoining(
                false
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Google Login
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


                setJoining(
                    true
                );


                stopPreview();


                const stream =
                    await createLocalStream(
                        video,
                        audio
                    );


                if (!stream) {

                    setJoining(
                        false
                    );

                    return;

                }


                setGuestLobby(
                    false
                );


                await connectToSocketServer();


                setJoining(
                    false
                );


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
        () => {

            const nextVideo =
                !video;


            setVideo(
                nextVideo
            );


            if (
                window.localStream
            ) {

                window.localStream
                    .getVideoTracks()
                    .forEach(
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

                window.localStream
                    .getAudioTracks()
                    .forEach(
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


                return;

            }


            try {

                const displayStream =
                    await navigator.mediaDevices.getDisplayMedia(
                        {
                            video:
                                true,

                            audio:
                                true
                        }
                    );


                setScreen(
                    true
                );


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
    | End Call
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
    | Panels
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
    | Checking Meeting
    |--------------------------------------------------------------------------
    */

    if (
        meetingChecking
    ) {

        return (

            <Box
                sx={{
                    minHeight:
                        "100dvh",

                    display:
                        "flex",

                    flexDirection:
                        "column",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    background:
                        "#f7f9fc",

                    p:
                        3
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
                    Checking meeting...
                </Typography>

            </Box>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Invalid Meeting
    |--------------------------------------------------------------------------
    */

    if (
        !meetingValid
    ) {

        return (

            <Box
                sx={{
                    minHeight:
                        "100dvh",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    background:
                        "linear-gradient(135deg,#f7faff,#eef4ff)",

                    p:
                        3
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
                                xs:
                                    3,

                                sm:
                                    4
                            },

                        textAlign:
                            "center",

                        boxShadow:
                            "0 20px 60px rgba(15,23,42,0.10)"
                    }}
                >

                    <Typography
                        sx={{
                            fontSize:
                                "3rem",

                            fontWeight:
                                800,

                            color:
                                "#1976d2",

                            mb:
                                1
                        }}
                    >
                        404
                    </Typography>


                    <Typography
                        sx={{
                            fontSize:
                                "1.5rem",

                            fontWeight:
                                800,

                            color:
                                "#171b2d",

                            mb:
                                1
                        }}
                    >
                        Meeting not found
                    </Typography>


                    <Typography
                        sx={{
                            color:
                                "#667085",

                            lineHeight:
                                1.6,

                            mb:
                                3
                        }}
                    >
                        {error ||
                            "This meeting code is invalid or the meeting does not exist."}
                    </Typography>


                    <Button
                        variant="contained"
                        onClick={() =>
                            navigate(
                                "/"
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
                        Back to Home
                    </Button>

                </Box>

            </Box>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Guest Lobby
    |--------------------------------------------------------------------------
    */

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

                    p:
                        {
                            xs:
                                2,

                            sm:
                                3
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
                                xs:
                                    2,

                                md:
                                    3
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
                                    xs:
                                        3,

                                    sm:
                                        4
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

                        </Box>

                    </Box>


                    {/* Lobby */}

                    <Box
                        sx={{
                            background:
                                "#fff",

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
                                        2.5,

                                    sm:
                                        4
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
                            Meeting code:{" "}
                            <strong>
                                {getMeetingCode()}
                            </strong>
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


                {/* Google login gate */}

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
                                        xs:
                                            3,

                                        sm:
                                            4
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
                                        "center",

                                    fontSize:
                                        "28px"
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


    /*
    |--------------------------------------------------------------------------
    | Actual Meeting
    |--------------------------------------------------------------------------
    */

    return (

        <Box
            className={
                styles.meetVideoContainer
            }
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

            {/* =====================================================
                HEADER
            ====================================================== */}

            <Box
                sx={{
                    minHeight:
                        {
                            xs:
                                56,

                            sm:
                                64
                        },

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    px:
                        {
                            xs:
                                1.2,

                            sm:
                                2
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
                            0.7,

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
                                    }
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
                                    "nowrap",

                                overflow:
                                    "hidden",

                                textOverflow:
                                    "ellipsis"
                            }}
                        >
                            Meeting • {getMeetingCode()}
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


            {/* =====================================================
                MEETING CONTENT
            ====================================================== */}

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

                <Box
                    className={
                        styles.conferenceView
                    }
                    sx={{
                        flex:
                            1,

                        minWidth:
                            0,

                        minHeight:
                            0
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
                                        220,

                                    sm:
                                        260
                                }
                        }}
                    >

                        <video
                            className={
                                styles.meetUserVideo
                            }
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
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
                                    "rgba(0,0,0,0.55)"
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
                                {username ||
                                    "You"}
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
                                                220,

                                            sm:
                                                260
                                        }
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
                                            "rgba(0,0,0,0.55)"
                                    }}
                                >

                                    <Typography
                                        sx={{
                                            fontSize:
                                                "0.8rem",

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


                {/* =================================================
                    CHAT
                ================================================== */}

                {showChat && (

                    <Box
                        className={
                            styles.chatRoom
                        }
                    >

                        <Box
                            className={
                                styles.chatContainer
                            }
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
                                className={
                                    styles.chattingDisplay
                                }
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
                                className={
                                    styles.chattingArea
                                }
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

                    </Box>

                )}


                {/* =================================================
                    PARTICIPANTS
                ================================================== */}

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
                                30,

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


            {/* =====================================================
                CONTROL BAR
            ====================================================== */}

            <Box
                className={
                    styles.buttonContainers
                }
            >

                <IconButton
                    onClick={
                        handleAudio
                    }
                    sx={{
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


                <IconButton
                    onClick={
                        handleVideo
                    }
                    sx={{
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


                {screenAvailable && (

                    <IconButton
                        onClick={
                            handleScreen
                        }
                        sx={{
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
                            color:
                                "#fff",

                            background:
                                showChat
                                    ? "#1976d2"
                                    : "#202938"
                        }}
                    >

                        <ChatIcon />

                    </IconButton>

                </Badge>


                <IconButton
                    onClick={
                        toggleParticipants
                    }
                    sx={{
                        color:
                            "#fff",

                        background:
                            showParticipants
                                ? "#1976d2"
                                : "#202938"
                    }}
                >

                    <PeopleIcon />

                </IconButton>


                <IconButton
                    onClick={
                        handleEndCall
                    }
                    sx={{
                        color:
                            "#fff",

                        background:
                            "#dc2626",

                        width:
                            58,

                        borderRadius:
                            3,

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

    );

}
