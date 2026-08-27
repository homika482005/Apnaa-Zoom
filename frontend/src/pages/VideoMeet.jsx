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


const serverUrl =
    server;


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
        handleGoogleLogin,
        addToUserHistory
    } =
        React.useContext(
            AuthContext
        );


    /*
    |--------------------------------------------------------------------------
    | Refs
    |--------------------------------------------------------------------------
    */

    const socketRef =
        useRef(null);


    const socketIdRef =
        useRef(null);


    const localVideoRef =
        useRef(null);


    const connectionsRef =
        useRef({});


    /*
    IMPORTANT:
    ICE candidates can arrive before the remote SDP.
    Store them here until setRemoteDescription() completes.
    */

    const pendingIceCandidatesRef =
        useRef({});


    const remoteStreamsRef =
        useRef({});


    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

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


    const [meetingStatus, setMeetingStatus] =
        useState("active");


    /*
    |--------------------------------------------------------------------------
    | Meeting Code
    |--------------------------------------------------------------------------
    */

    const getMeetingCode =
        useCallback(
            () => {

                return String(
                    url || ""
                ).trim();

            },
            [url]
        );


    /*
    |--------------------------------------------------------------------------
    | Auth Check
    |--------------------------------------------------------------------------
    */

    const hasAuthenticationToken =
        () => {

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

        let mounted = true;


        const validateMeeting =
            async () => {

                const meetingCode =
                    getMeetingCode();


                if (!meetingCode) {

                    if (mounted) {

                        setMeetingValid(
                            false
                        );

                        setMeetingChecking(
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
                            `${serverUrl}/api/v1/users/meeting/${encodeURIComponent(
                                meetingCode
                            )}`
                        );


                    let data =
                        {};


                    try {

                        data =
                            await response.json();

                    } catch (
                        jsonError
                    ) {

                        console.error(
                            "Meeting response parsing error:",
                            jsonError
                        );

                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Meeting not found"
                        );

                    }


                    if (mounted) {

                        setMeetingValid(
                            data.valid === true
                        );

                        setMeetingStatus(
                            data.status ||
                            "active"
                        );

                    }

                } catch (
                    validationError
                ) {

                    console.error(
                        "Meeting validation error:",
                        validationError
                    );


                    if (mounted) {

                        setMeetingValid(
                            false
                        );

                        setError(
                            validationError.message ||
                            "Meeting not found"
                        );

                    }

                } finally {

                    if (mounted) {

                        setMeetingChecking(
                            false
                        );

                    }

                }

            };


        validateMeeting();


        return () => {

            mounted = false;

        };

    }, [
        getMeetingCode
    ]);


    /*
    |--------------------------------------------------------------------------
    | Device Permissions
    |--------------------------------------------------------------------------
    */

    const getPermissions =
        useCallback(
            async () => {

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

                    setScreenAvailable(
                        false
                    );

                    return;

                }


                try {

                    const stream =
                        await navigator.mediaDevices.getUserMedia({
                            video:
                                true
                        });


                    setCameraAvailable(
                        true
                    );


                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                } catch (
                    cameraError
                ) {

                    console.log(
                        "Camera unavailable:",
                        cameraError
                    );


                    setCameraAvailable(
                        false
                    );

                }


                try {

                    const stream =
                        await navigator.mediaDevices.getUserMedia({
                            audio:
                                true
                        });


                    setMicrophoneAvailable(
                        true
                    );


                    stream
                        .getTracks()
                        .forEach(
                            track =>
                                track.stop()
                        );

                } catch (
                    microphoneError
                ) {

                    console.log(
                        "Microphone unavailable:",
                        microphoneError
                    );


                    setMicrophoneAvailable(
                        false
                    );

                }


                setScreenAvailable(
                    Boolean(
                        navigator.mediaDevices.getDisplayMedia
                    )
                );

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

                /*
                Stop old local stream.
                */

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
                    null;


                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current.srcObject =
                        null;

                }


                /*
                User can join with both devices off.
                */

                if (
                    !includeVideo &&
                    !includeAudio
                ) {

                    return null;

                }


                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    return null;

                }


                const wantVideo =
                    includeVideo &&
                    cameraAvailable;


                const wantAudio =
                    includeAudio &&
                    microphoneAvailable;


                /*
                Nothing available.
                Still allow meeting entry.
                */

                if (
                    !wantVideo &&
                    !wantAudio
                ) {

                    return null;

                }


                let stream =
                    null;


                try {

                    stream =
                        await navigator.mediaDevices.getUserMedia({

                            video:
                                wantVideo,

                            audio:
                                wantAudio

                        });

                } catch (
                    combinedError
                ) {

                    console.log(
                        "Combined media request failed:",
                        combinedError
                    );


                    const tracks = [];


                    if (
                        wantVideo
                    ) {

                        try {

                            const cameraStream =
                                await navigator.mediaDevices.getUserMedia({
                                    video:
                                        true
                                });


                            tracks.push(
                                ...cameraStream.getVideoTracks()
                            );

                        } catch (
                            cameraError
                        ) {

                            console.log(
                                "Camera fallback failed:",
                                cameraError
                            );

                        }

                    }


                    if (
                        wantAudio
                    ) {

                        try {

                            const microphoneStream =
                                await navigator.mediaDevices.getUserMedia({
                                    audio:
                                        true
                                });


                            tracks.push(
                                ...microphoneStream.getAudioTracks()
                            );

                        } catch (
                            microphoneError
                        ) {

                            console.log(
                                "Microphone fallback failed:",
                                microphoneError
                            );

                        }

                    }


                    if (
                        tracks.length > 0
                    ) {

                        stream =
                            new MediaStream(
                                tracks
                            );

                    }

                }


                if (!stream) {

                    return null;

                }


                /*
                Apply current enabled/disabled state.
                */

                stream
                    .getVideoTracks()
                    .forEach(
                        track => {

                            track.enabled =
                                includeVideo;

                        }
                    );


                stream
                    .getAudioTracks()
                    .forEach(
                        track => {

                            track.enabled =
                                includeAudio;

                        }
                    );


                window.localStream =
                    stream;


                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current.srcObject =
                        stream;

                }


                return stream;

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
    | Stop Preview
    |--------------------------------------------------------------------------
    */

    const stopPreview =
        () => {

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


            window.previewStream =
                null;

        };


    /*
    |--------------------------------------------------------------------------
    | Preview Audio Toggle
    |--------------------------------------------------------------------------
    */

    const togglePreviewAudio =
        () => {

            const next =
                !audio;


            setAudio(
                next
            );


            if (
                window.previewStream
            ) {

                window.previewStream
                    .getAudioTracks()
                    .forEach(
                        track => {

                            track.enabled =
                                next;

                        }
                    );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Preview Video Toggle
    |--------------------------------------------------------------------------
    */

    const togglePreviewVideo =
        () => {

            const next =
                !video;


            setVideo(
                next
            );


            if (
                window.previewStream
            ) {

                window.previewStream
                    .getVideoTracks()
                    .forEach(
                        track => {

                            track.enabled =
                                next;

                        }
                    );

            }

        };


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


        let mounted =
            true;


        const startPreview =
            async () => {

                await getPermissions();


                if (!mounted) {

                    return;

                }


                /*
                Both OFF = no camera preview needed.
                */

                if (
                    !video &&
                    !audio
                ) {

                    if (
                        localVideoRef.current
                    ) {

                        localVideoRef.current.srcObject =
                            null;

                    }


                    return;

                }


                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    return;

                }


                let preview =
                    null;


                try {

                    preview =
                        await navigator.mediaDevices.getUserMedia({

                            video:
                                cameraAvailable &&
                                video,

                            audio:
                                microphoneAvailable &&
                                audio

                        });

                } catch (
                    previewError
                ) {

                    console.log(
                        "Preview request failed:",
                        previewError
                    );


                    /*
                    Try camera only.
                    */

                    if (
                        cameraAvailable &&
                        video
                    ) {

                        try {

                            preview =
                                await navigator.mediaDevices.getUserMedia({
                                    video:
                                        true
                                });

                        } catch (
                            cameraError
                        ) {

                            console.log(
                                "Camera preview failed:",
                                cameraError
                            );

                        }

                    }


                    /*
                    Try microphone only.
                    */

                    if (
                        !preview &&
                        microphoneAvailable &&
                        audio
                    ) {

                        try {

                            preview =
                                await navigator.mediaDevices.getUserMedia({
                                    audio:
                                        true
                                });

                        } catch (
                            microphoneError
                        ) {

                            console.log(
                                "Microphone preview failed:",
                                microphoneError
                            );

                        }

                    }

                }


                if (
                    !mounted
                ) {

                    if (preview) {

                        preview
                            .getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );

                    }

                    return;

                }


                if (
                    preview
                ) {

                    window.previewStream =
                        preview;


                    preview
                        .getVideoTracks()
                        .forEach(
                            track => {

                                track.enabled =
                                    video;

                            }
                        );


                    preview
                        .getAudioTracks()
                        .forEach(
                            track => {

                                track.enabled =
                                    audio;

                            }
                        );


                    if (
                        localVideoRef.current
                    ) {

                        localVideoRef.current.srcObject =
                            preview;

                    }

                }

            };


        startPreview();


        return () => {

            mounted =
                false;

        };

    }, [
        meetingChecking,
        meetingValid,
        guestLobby
    ]);


    /*
    |--------------------------------------------------------------------------
    | Send Signal
    |--------------------------------------------------------------------------
    */

    const sendSignal =
        useCallback(
            (
                targetId,
                data
            ) => {

                if (
                    !socketRef.current ||
                    !socketRef.current.connected
                ) {

                    return;

                }


                socketRef.current.emit(
                    "signal",
                    targetId,
                    JSON.stringify(
                        data
                    )
                );

            },
            []
        );


    /*
    |--------------------------------------------------------------------------
    | Create Peer Connection
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


                pendingIceCandidatesRef.current[
                    remoteId
                ] =
                    pendingIceCandidatesRef.current[
                        remoteId
                    ] || [];


                /*
                ICE candidate
                */

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


                /*
                Remote track
                */

                peer.ontrack =
                    event => {

                        const stream =
                            event.streams[0];


                        if (!stream) {

                            return;

                        }


                        remoteStreamsRef.current[
                            remoteId
                        ] =
                            stream;


                        setVideos(
                            previous => {

                                const existing =
                                    previous.find(
                                        item =>
                                            item.socketId ===
                                            remoteId
                                    );


                                if (
                                    existing
                                ) {

                                    return previous.map(
                                        item => {

                                            if (
                                                item.socketId !==
                                                remoteId
                                            ) {

                                                return item;

                                            }


                                            return {

                                                ...item,

                                                stream:
                                                    stream

                                            };

                                        }
                                    );

                                }


                                return [

                                    ...previous,

                                    {

                                        socketId:
                                            remoteId,

                                        stream:
                                            stream

                                    }

                                ];

                            }
                        );

                    };


                /*
                Peer connection monitoring
                */

                peer.onconnectionstatechange =
                    () => {

                        console.log(
                            "Peer",
                            remoteId,
                            "connection state:",
                            peer.connectionState
                        );


                        /*
                        Do NOT immediately destroy a peer on
                        temporary "disconnected" state.
                        */

                        if (
                            peer.connectionState ===
                            "failed"
                        ) {

                            try {

                                peer.restartIce();

                            } catch (
                                restartError
                            ) {

                                console.log(
                                    "ICE restart failed:",
                                    restartError
                                );

                            }

                        }

                    };


                /*
                ICE connection monitoring
                */

                peer.oniceconnectionstatechange =
                    () => {

                        console.log(
                            "Peer",
                            remoteId,
                            "ICE state:",
                            peer.iceConnectionState
                        );


                        if (
                            peer.iceConnectionState ===
                                "failed"
                        ) {

                            try {

                                peer.restartIce();

                            } catch (
                                restartError
                            ) {

                                console.log(
                                    "ICE restart error:",
                                    restartError
                                );

                            }

                        }

                    };


                /*
                Add current local tracks.
                */

                if (
                    window.localStream
                ) {

                    window.localStream
                        .getTracks()
                        .forEach(
                            track => {

                                try {

                                    peer.addTrack(
                                        track,
                                        window.localStream
                                    );

                                } catch (
                                    trackError
                                ) {

                                    console.error(
                                        "Unable to add local track:",
                                        trackError
                                    );

                                }

                            }
                        );

                }


                return peer;

            },
            [
                sendSignal
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | Add Pending ICE Candidates
    |--------------------------------------------------------------------------
    */

    const addPendingIceCandidates =
        useCallback(
            async (
                remoteId,
                peer
            ) => {

                const queue =
                    pendingIceCandidatesRef.current[
                        remoteId
                    ] || [];


                if (
                    queue.length ===
                    0
                ) {

                    return;

                }


                pendingIceCandidatesRef.current[
                    remoteId
                ] =
                    [];


                for (
                    const candidate of queue
                ) {

                    try {

                        await peer.addIceCandidate(
                            new RTCIceCandidate(
                                candidate
                            )
                        );

                    } catch (
                        candidateError
                    ) {

                        console.error(
                            "Queued ICE candidate error:",
                            candidateError
                        );

                    }

                }

            },
            []
        );


    /*
    |--------------------------------------------------------------------------
    | Handle Incoming Signal
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


                    /*
                    ----------------------------------------------------------
                    SDP
                    ----------------------------------------------------------
                    */

                    if (
                        signal.sdp
                    ) {

                        await peer.setRemoteDescription(
                            new RTCSessionDescription(
                                signal.sdp
                            )
                        );


                        /*
                        Now it is safe to add candidates
                        that arrived before the SDP.
                        */

                        await addPendingIceCandidates(
                            fromId,
                            peer
                        );


                        /*
                        ------------------------------------------------------
                        Incoming offer
                        ------------------------------------------------------
                        */

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


                    /*
                    ----------------------------------------------------------
                    ICE
                    ----------------------------------------------------------
                    */

                    if (
                        signal.ice
                    ) {

                        /*
                        If remote description is not ready,
                        store the ICE candidate.
                        */

                        if (
                            !peer.remoteDescription ||
                            !peer.remoteDescription.type
                        ) {

                            pendingIceCandidatesRef.current[
                                fromId
                            ] =
                                pendingIceCandidatesRef.current[
                                    fromId
                                ] || [];


                            pendingIceCandidatesRef.current[
                                fromId
                            ].push(
                                signal.ice
                            );


                        } else {

                            try {

                                await peer.addIceCandidate(
                                    new RTCIceCandidate(
                                        signal.ice
                                    )
                                );

                            } catch (
                                iceError
                            ) {

                                console.error(
                                    "ICE candidate error:",
                                    iceError
                                );

                            }

                        }

                    }

                } catch (
                    signalError
                ) {

                    console.error(
                        "Signal handling error:",
                        signalError
                    );

                }

            },
            [
                createPeerConnection,
                addPendingIceCandidates,
                sendSignal
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | Create Offer
    |--------------------------------------------------------------------------
    */

    const createOffer =
        useCallback(
            async (
                targetId
            ) => {

                const peer =
                    connectionsRef.current[
                        targetId
                    ] ||
                    createPeerConnection(
                        targetId
                    );


                if (!peer) {

                    return;

                }


                try {

                    /*
                    Avoid duplicate offers.
                    */

                    if (
                        peer.signalingState !==
                            "stable"
                    ) {

                        return;

                    }


                    const offer =
                        await peer.createOffer();


                    await peer.setLocalDescription(
                        offer
                    );


                    sendSignal(
                        targetId,
                        {
                            sdp:
                                peer.localDescription
                        }
                    );

                } catch (
                    offerError
                ) {

                    console.error(
                        "Create offer error:",
                        offerError
                    );

                }

            },
            [
                createPeerConnection,
                sendSignal
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
                    previous => [

                        ...previous,

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


                    setGuestLobby(
                        true
                    );


                    return false;

                }


                /*
                Clean previous socket.
                */

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
                    io(
                        serverUrl,
                        {

                            auth: {
                                token
                            },

                            transports: [
                                "websocket",
                                "polling"
                            ],

                            reconnection:
                                true,

                            reconnectionAttempts:
                                5

                        }
                    );


                socketRef.current =
                    socket;


                /*
                --------------------------------------------------------------
                Connection error
                --------------------------------------------------------------
                */

                socket.on(
                    "connect_error",
                    socketError => {

                        console.error(
                            "Socket connection error:",
                            socketError
                        );


                        setError(
                            socketError.message ||
                            "Unable to connect to meeting."
                        );


                        setJoining(
                            false
                        );

                    }
                );


                /*
                --------------------------------------------------------------
                Meeting validation error
                --------------------------------------------------------------
                */

                socket.on(
                    "meeting-error",
                    meetingError => {

                        console.error(
                            "Meeting error:",
                            meetingError
                        );


                        setError(
                            meetingError ||
                            "Unable to join meeting."
                        );


                        socket.disconnect();


                        setGuestLobby(
                            true
                        );


                        setJoining(
                            false
                        );

                    }
                );


                /*
                --------------------------------------------------------------
                Signal
                --------------------------------------------------------------
                */

                socket.on(
                    "signal",
                    gotMessageFromServer
                );


                /*
                --------------------------------------------------------------
                Chat
                --------------------------------------------------------------
                */

                socket.on(
                    "chat-message",
                    addMessage
                );


                /*
                --------------------------------------------------------------
                Connected
                --------------------------------------------------------------
                */

                socket.on(
                    "connect",
                    () => {

                        socketIdRef.current =
                            socket.id;


                        console.log(
                            "Socket connected:",
                            socket.id
                        );


                        /*
                        Join room.
                        */

                        socket.emit(
                            "join-call",
                            window.location.href
                        );


                        /*
                        ------------------------------------------------------
                        User joined
                        ------------------------------------------------------
                        */

                        socket.on(
                            "user-joined",
                            async (
                                joinedId,
                                clients
                            ) => {

                                console.log(
                                    "User joined:",
                                    joinedId,
                                    clients
                                );


                                /*
                                Create peer objects for everyone
                                currently in the room.
                                */

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


                                /*
                                The newly joined client creates
                                offers to the existing clients.
                                */

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


                        /*
                        ------------------------------------------------------
                        User left
                        ------------------------------------------------------
                        */

                        socket.on(
                            "user-left",
                            remoteId => {

                                console.log(
                                    "User left:",
                                    remoteId
                                );


                                const peer =
                                    connectionsRef.current[
                                        remoteId
                                    ];


                                if (
                                    peer
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

                                }


                                delete connectionsRef.current[
                                    remoteId
                                ];


                                delete pendingIceCandidatesRef.current[
                                    remoteId
                                ];


                                delete remoteStreamsRef.current[
                                    remoteId
                                ];


                                setVideos(
                                    previous =>
                                        previous.filter(
                                            item =>
                                                item.socketId !==
                                                remoteId
                                        )
                                );

                            }
                        );

                    }
                );


                return true;

            },
            [
                addMessage,
                createOffer,
                createPeerConnection,
                gotMessageFromServer
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | Save History
    |--------------------------------------------------------------------------
    */

    const saveJoinedMeetingHistory =
        async () => {

            try {

                const meetingCode =
                    getMeetingCode();


                if (
                    meetingCode
                ) {

                    await addToUserHistory(
                        meetingCode
                    );

                }

            } catch (
                historyError
            ) {

                console.error(
                    "History save error:",
                    historyError
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Start Meeting
    |--------------------------------------------------------------------------
    */

    const startAuthenticatedMeeting =
        async () => {

            const cleanUsername =
                username.trim();


            if (!cleanUsername) {

                setError(
                    "Please enter your name."
                );

                return;

            }


            setUsername(
                cleanUsername
            );


            setError("");


            /*
            Authentication gate.
            */

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


            /*
            Media is optional.
            */

            await createLocalStream(
                video,
                audio
            );


            await saveJoinedMeetingHistory();


            setGuestLobby(
                false
            );


            const connected =
                await connectToSocketServer();


            if (!connected) {

                setJoining(
                    false
                );

                return;

            }


            setJoining(
                false
            );

        };


    /*
    |--------------------------------------------------------------------------
    | Google Login Then Join
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


                /*
                Media optional.
                */

                await createLocalStream(
                    video,
                    audio
                );


                await saveJoinedMeetingHistory();


                setGuestLobby(
                    false
                );


                const connected =
                    await connectToSocketServer();


                if (!connected) {

                    setJoining(
                        false
                    );

                    return;

                }


                setJoining(
                    false
                );

            } catch (
                googleError
            ) {

                console.error(
                    "Google login error:",
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
    | Camera Toggle
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

                window.localStream
                    .getVideoTracks()
                    .forEach(
                        track => {

                            track.enabled =
                                nextVideo;

                        }
                    );


                return;

            }


            if (
                nextVideo
            ) {

                await createLocalStream(
                    true,
                    audio
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Microphone Toggle
    |--------------------------------------------------------------------------
    */

    const handleAudio =
        async () => {

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


                return;

            }


            if (
                nextAudio
            ) {

                await createLocalStream(
                    video,
                    true
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Replace Local Track
    |--------------------------------------------------------------------------
    */

    const replaceLocalStream =
        async (
            newStream
        ) => {

            const oldStream =
                window.localStream;


            window.localStream =
                newStream ||
                null;


            if (
                localVideoRef.current
            ) {

                localVideoRef.current.srcObject =
                    newStream ||
                    null;

            }


            /*
            Replace existing senders.
            */

            for (
                const remoteId in
                connectionsRef.current
            ) {

                const peer =
                    connectionsRef.current[
                        remoteId
                    ];


                if (!peer) {

                    continue;

                }


                const senders =
                    peer.getSenders();


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


                const newVideoTrack =
                    newStream
                        ?.getVideoTracks()[0] ||
                    null;


                const newAudioTrack =
                    newStream
                        ?.getAudioTracks()[0] ||
                    null;


                if (
                    videoSender
                ) {

                    await videoSender.replaceTrack(
                        newVideoTrack
                    );

                }


                if (
                    audioSender
                ) {

                    await audioSender.replaceTrack(
                        newAudioTrack
                    );

                }

            }


            /*
            If no previous sender existed, add new tracks.
            */

            if (
                newStream
            ) {

                for (
                    const remoteId in
                    connectionsRef.current
                ) {

                    const peer =
                        connectionsRef.current[
                            remoteId
                        ];


                    if (!peer) {

                        continue;

                    }


                    const existingKinds =
                        peer
                            .getSenders()
                            .filter(
                                sender =>
                                    sender.track
                            )
                            .map(
                                sender =>
                                    sender.track.kind
                            );


                    newStream
                        .getTracks()
                        .forEach(
                            track => {

                                if (
                                    !existingKinds.includes(
                                        track.kind
                                    )
                                ) {

                                    try {

                                        peer.addTrack(
                                            track,
                                            newStream
                                        );

                                    } catch (
                                        addTrackError
                                    ) {

                                        console.log(
                                            "Track add error:",
                                            addTrackError
                                        );

                                    }

                                }

                            }
                        );

                }

            }


            if (
                oldStream
            ) {

                oldStream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
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

                setError(
                    "Screen sharing is not supported by this browser."
                );

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


                await replaceLocalStream(
                    stream
                );


                return;

            }


            try {

                const displayStream =
                    await navigator.mediaDevices.getDisplayMedia({

                        video:
                            true,

                        audio:
                            true

                    });


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


                            await replaceLocalStream(
                                stream
                            );

                        };

                }

            } catch (
                screenError
            ) {

                console.log(
                    "Screen sharing cancelled:",
                    screenError
                );

            }

        };


    /*
    |--------------------------------------------------------------------------
    | Chat Send
    |--------------------------------------------------------------------------
    */

    const sendMessage =
        () => {

            const cleanMessage =
                message.trim();


            if (
                !cleanMessage
            ) {

                return;

            }


            if (
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
    | Copy Link
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

            } catch (
                copyError
            ) {

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

            /*
            Stop local media.
            */

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


            /*
            Close peer connections.
            */

            Object.keys(
                connectionsRef.current
            ).forEach(
                remoteId => {

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

                }
            );


            connectionsRef.current =
                {};


            pendingIceCandidatesRef.current =
                {};


            remoteStreamsRef.current =
                {};


            setVideos(
                []
            );


            /*
            Disconnect Socket.IO.
            */

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


            window.previewStream =
                null;


            navigate(
                "/home"
            );

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


            setShowParticipants(
                false
            );


            setUnreadMessages(
                0
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
    | Component Cleanup
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        return () => {

            /*
            Stop streams.
            */

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


            /*
            Close peers.
            */

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


            /*
            Disconnect socket.
            */

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


            window.localStream =
                null;


            window.previewStream =
                null;

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Loading
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
                        "#f7f9fc"
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

                    p:
                        3,

                    background:
                        "linear-gradient(135deg,#f7faff,#eef4ff)"
                }}
            >

                <Box
                    sx={{
                        width:
                            "100%",

                        maxWidth:
                            440,

                        p:
                            {
                                xs:
                                    3,

                                sm:
                                    4
                            },

                        textAlign:
                            "center",

                        background:
                            "#fff",

                        borderRadius:
                            4,

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
                                "1.45rem",

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
                            "This meeting does not exist."}
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
    | Lobby
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
                        },

                    background:
                        "linear-gradient(135deg,#eef4ff,#ffffff)"
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
                            3
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

                            overflow:
                                "hidden",

                            borderRadius:
                                4,

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


                        {(
                            !video ||
                            !window.previewStream
                        ) && (

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
                                        "#111827",

                                    zIndex:
                                        2
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            78,

                                        height:
                                            78,

                                        borderRadius:
                                            "50%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "#293344",

                                        color:
                                            "#fff",

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
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()}
                                </Box>

                            </Box>

                        )}


                        {/* Preview controls */}

                        <Box
                            sx={{
                                position:
                                    "absolute",

                                left:
                                    "50%",

                                bottom:
                                    16,

                                transform:
                                    "translateX(-50%)",

                                display:
                                    "flex",

                                gap:
                                    1,

                                zIndex:
                                    10
                            }}
                        >

                            <IconButton
                                onClick={
                                    togglePreviewAudio
                                }
                                sx={{
                                    width:
                                        46,

                                    height:
                                        46,

                                    color:
                                        "#fff",

                                    background:
                                        audio
                                            ? "rgba(17,23,34,.78)"
                                            : "#dc2626",

                                    backdropFilter:
                                        "blur(8px)"
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
                                    togglePreviewVideo
                                }
                                sx={{
                                    width:
                                        46,

                                    height:
                                        46,

                                    color:
                                        "#fff",

                                    background:
                                        video
                                            ? "rgba(17,23,34,.78)"
                                            : "#dc2626",

                                    backdropFilter:
                                        "blur(8px)"
                                }}
                            >

                                {video ? (
                                    <VideocamIcon />
                                ) : (
                                    <VideocamOffIcon />
                                )}

                            </IconButton>

                        </Box>


                        <Box
                            sx={{
                                position:
                                    "absolute",

                                top:
                                    16,

                                left:
                                    16,

                                px:
                                    1.5,

                                py:
                                    0.8,

                                borderRadius:
                                    2,

                                background:
                                    "rgba(0,0,0,.55)",

                                color:
                                    "#fff",

                                zIndex:
                                    5
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        ".8rem",

                                    fontWeight:
                                        700
                                }}
                            >
                                Camera preview
                            </Typography>

                        </Box>

                    </Box>


                    {/* Lobby card */}

                    <Box
                        sx={{
                            background:
                                "#fff",

                            borderRadius:
                                4,

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
                                "0 18px 50px rgba(15,23,42,.08)"
                        }}
                    >

                        <Box
                            sx={{
                                width:
                                    54,

                                height:
                                    54,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                borderRadius:
                                    2.5,

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
                                fontWeight:
                                    800,

                                fontSize:
                                    {
                                        xs:
                                            "1.8rem",

                                        sm:
                                            "2.2rem"
                                    },

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
                                        ".84rem",

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
                                    : null
                            }
                            sx={{
                                py:
                                    1.4,

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
                                    2,

                                p:
                                    1.5,

                                background:
                                    "#f7f9fc",

                                borderRadius:
                                    2.5
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        ".8rem",

                                    fontWeight:
                                        700,

                                    color:
                                        "#344054",

                                    mb:
                                        .4
                                }}
                            >
                                Secure meeting access
                            </Typography>


                            <Typography
                                sx={{
                                    fontSize:
                                        ".77rem",

                                    color:
                                        "#667085",

                                    lineHeight:
                                        1.5
                                }}
                            >
                                You can preview as a guest.
                                Google sign-in is required
                                before entering the call.
                            </Typography>

                        </Box>


                        <Typography
                            sx={{
                                mt:
                                    1.5,

                                fontSize:
                                    ".75rem",

                                color:
                                    meetingStatus ===
                                    "active"
                                        ? "#15803d"
                                        : "#667085"
                            }}
                        >
                            ●{" "}
                            {meetingStatus ===
                            "active"
                                ? "Meeting available"
                                : "Meeting can be reopened"}
                        </Typography>

                    </Box>

                </Box>


                {/* Login gate */}

                {showLoginGate && (

                    <Box
                        sx={{
                            position:
                                "fixed",

                            inset:
                                0,

                            zIndex:
                                1000,

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            p:
                                2,

                            background:
                                "rgba(15,23,42,.62)",

                            backdropFilter:
                                "blur(8px)"
                        }}
                    >

                        <Box
                            sx={{
                                width:
                                    "100%",

                                maxWidth:
                                    440,

                                p:
                                    {
                                        xs:
                                            3,

                                        sm:
                                            4
                                    },

                                textAlign:
                                    "center",

                                background:
                                    "#fff",

                                borderRadius:
                                    4,

                                boxShadow:
                                    "0 30px 90px rgba(0,0,0,.22)"
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        "1.6rem",

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
                                        1.6,

                                    mb:
                                        3
                                }}
                            >
                                Continue with Google to
                                enter the video call.
                            </Typography>


                            {error && (

                                <Typography
                                    sx={{
                                        color:
                                            "#d32f2f",

                                        fontSize:
                                            ".82rem",

                                        mb:
                                            1.5
                                    }}
                                >
                                    {error}
                                </Typography>

                            )}


                            {googleLoginLoading ? (

                                <CircularProgress />

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
                                onClick={() =>
                                    setShowLoginGate(
                                        false
                                    )
                                }
                                sx={{
                                    mt:
                                        2,

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
    | Meeting UI
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

            {/* Header */}

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
                                1,

                            sm:
                                2
                        },

                    background:
                        "#111722",

                    borderBottom:
                        "1px solid rgba(255,255,255,.07)"
                }}
            >

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            .5,

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
                                    800
                            }}
                        >
                            ApnaaZoom
                        </Typography>


                        <Typography
                            sx={{
                                color:
                                    "#98a2b3",

                                fontSize:
                                    ".72rem",

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
                            "center"
                    }}
                >

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                            <ContentCopyIcon />
                        }
                        onClick={
                            copyMeetingLink
                        }
                        sx={{
                            display:
                                {
                                    xs:
                                        "none",

                                    sm:
                                        "inline-flex"
                                },

                            color:
                                "#fff",

                            borderColor:
                                "rgba(255,255,255,.2)",

                            borderRadius:
                                2,

                            textTransform:
                                "none"
                        }}
                    >
                        {copied
                            ? "Copied"
                            : "Copy link"}
                    </Button>


                    <IconButton
                        onClick={
                            toggleParticipants
                        }
                        sx={{
                            color:
                                "#fff"
                        }}
                    >
                        <Badge
                            badgeContent={
                                videos.length + 1
                            }
                            color="primary"
                        >
                            <PeopleIcon />
                        </Badge>
                    </IconButton>

                </Box>

            </Box>


            {/* Video area */}

            <Box
                sx={{
                    flex:
                        1,

                    minHeight:
                        0,

                    position:
                        "relative"
                }}
            >

                <Box
                    className={
                        styles.conferenceView
                    }
                >

                    {/* Local */}

                    <Box
                        sx={{
                            position:
                                "relative",

                            background:
                                "#151b26",

                            overflow:
                                "hidden"
                        }}
                    >

                        <video
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
                            className={
                                styles.meetUserVideo
                            }
                        />


                        {(
                            !video ||
                            !window.localStream
                        ) && (

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
                                        "#1b2230",

                                    zIndex:
                                        2
                                }}
                            >

                                <Box
                                    sx={{
                                        width:
                                            76,

                                        height:
                                            76,

                                        borderRadius:
                                            "50%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        background:
                                            "#2b3444",

                                        fontWeight:
                                            800,

                                        fontSize:
                                            "1.7rem"
                                    }}
                                >
                                    {(
                                        username ||
                                        "U"
                                    )
                                        .charAt(
                                            0
                                        )
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
                                    .6,

                                background:
                                    "rgba(0,0,0,.55)",

                                borderRadius:
                                    1.5,

                                zIndex:
                                    3
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize:
                                        ".8rem",

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

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    borderRadius:
                                        "50%",

                                    background:
                                        "#ef4444",

                                    zIndex:
                                        3
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


                    {/* Remote participants */}

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

                                    overflow:
                                        "hidden"
                                }}
                            >

                                <video
                                    autoPlay
                                    playsInline
                                    ref={
                                        element => {

                                            if (
                                                element &&
                                                remoteVideo.stream &&
                                                element.srcObject !==
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

                                        minHeight:
                                            "220px",

                                        objectFit:
                                            "cover",

                                        display:
                                            "block"
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
                                            .6,

                                        background:
                                            "rgba(0,0,0,.55)",

                                        borderRadius:
                                            1.5
                                    }}
                                >

                                    <Typography
                                        sx={{
                                            fontSize:
                                                ".8rem",

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


                {/* Chat */}

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
                                        1.5
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

                                {messages.length ===
                                0 ? (

                                    <Box
                                        sx={{
                                            height:
                                                "100%",

                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            justifyContent:
                                                "center",

                                            flexDirection:
                                                "column",

                                            color:
                                                "#98a2b3"
                                        }}
                                    >

                                        <ChatIcon
                                            sx={{
                                                fontSize:
                                                    40,

                                                mb:
                                                    1
                                            }}
                                        />


                                        <Typography>
                                            No messages yet
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
                                                        1.5
                                                }}
                                            >

                                                <Typography
                                                    sx={{
                                                        fontSize:
                                                            ".78rem",

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


                                                <Box
                                                    sx={{
                                                        mt:
                                                            .4,

                                                        p:
                                                            1.2,

                                                        background:
                                                            "#f2f4f7",

                                                        borderRadius:
                                                            2,

                                                        color:
                                                            "#1d2939",

                                                        wordBreak:
                                                            "break-word"
                                                    }}
                                                >

                                                    <Typography
                                                        sx={{
                                                            fontSize:
                                                                ".9rem"
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


                {/* Participants */}

                {showParticipants && (

                    <Box
                        sx={{
                            position:
                                "absolute",

                            top:
                                {
                                    xs:
                                        0,

                                    sm:
                                        16
                                },

                            right:
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
                                    1.5
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
                                    p:
                                        1.5,

                                    mb:
                                        1,

                                    borderRadius:
                                        2,

                                    background:
                                        "#f2f4f7"
                                }}
                            >

                                <Typography
                                    sx={{
                                        fontWeight:
                                            700
                                    }}
                                >
                                    {username ||
                                        "You"}
                                </Typography>


                                <Typography
                                    sx={{
                                        fontSize:
                                            ".75rem",

                                        color:
                                            "#667085"
                                    }}
                                >
                                    You
                                </Typography>

                            </Box>


                            {videos.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <Box
                                        key={
                                            item.socketId
                                        }
                                        sx={{
                                            p:
                                                1.5,

                                            mb:
                                                1,

                                            borderRadius:
                                                2,

                                            background:
                                                "#f9fafb"
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                fontWeight:
                                                    600
                                            }}
                                        >
                                            Participant{" "}
                                            {index + 1}
                                        </Typography>

                                    </Box>

                                )
                            )}

                        </Box>

                    </Box>

                )}

            </Box>


            {/* Controls */}

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
                                : "#ef4444"
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
                                : "#ef4444"
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
                                    : "#202938"
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
                            3
                    }}
                >
                    <CallEndIcon />
                </IconButton>

            </Box>

        </Box>

    );

}
