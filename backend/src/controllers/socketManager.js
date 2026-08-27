import {
    Server
} from "socket.io";

import {
    User
} from "../models/user.model.js";

import {
    Meeting
} from "../models/meeting.model.js";


const connections = {};

const messages = {};

const timeOnline = {};


/*
|--------------------------------------------------------------------------
| Get Meeting Code From URL
|--------------------------------------------------------------------------
*/

const getMeetingCodeFromPath = (
    path
) => {

    try {

        if (!path) {

            return null;

        }


        const parsedUrl =
            new URL(
                path
            );


        const pathParts =
            parsedUrl
                .pathname
                .split("/")
                .filter(
                    part =>
                        part
                );


        const meetingIndex =
            pathParts.indexOf(
                "meeting"
            );


        if (
            meetingIndex === -1 ||
            !pathParts[
                meetingIndex + 1
            ]
        ) {

            return null;

        }


        return decodeURIComponent(
            pathParts[
                meetingIndex + 1
            ]
        ).trim();


    } catch (error) {

        console.error(
            "Meeting URL parsing error:",
            error
        );


        return null;

    }

};


/*
|--------------------------------------------------------------------------
| Socket Server
|--------------------------------------------------------------------------
*/

export const connectToSocket = (
    server
) => {

    const io =
        new Server(
            server,
            {
                cors: {

                    origin: [
                        "https://apnaazoom-frontend.onrender.com",
                        "http://localhost:3000"
                    ],

                    methods: [
                        "GET",
                        "POST"
                    ],

                    credentials:
                        true

                }

            }
        );


    /*
    |--------------------------------------------------------------------------
    | Socket Authentication
    |--------------------------------------------------------------------------
    */

    io.use(
        async (
            socket,
            next
        ) => {

            try {

                const token =
                    socket
                        .handshake
                        .auth
                        ?.token;


                if (!token) {

                    return next(
                        new Error(
                            "Authentication required"
                        )
                    );

                }


                const user =
                    await User.findOne({

                        token:
                            token,

                        tokenExpires: {
                            $gt:
                                new Date()
                        }

                    });


                if (!user) {

                    return next(
                        new Error(
                            "Invalid or expired session"
                        )
                    );

                }


                socket.user =
                    user;


                next();


            } catch (error) {

                console.error(
                    "Socket authentication error:",
                    error
                );


                next(
                    new Error(
                        "Socket authentication failed"
                    )
                );

            }

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Authenticated Connection
    |--------------------------------------------------------------------------
    */

    io.on(
        "connection",
        (
            socket
        ) => {

            console.log(
                "Authenticated socket connected:",
                socket.id,
                "User:",
                socket.user?.email
            );


            /*
            |--------------------------------------------------------------------------
            | Join Call
            |--------------------------------------------------------------------------
            */

            socket.on(
                "join-call",
                async (
                    path
                ) => {

                    if (!path) {

                        socket.emit(
                            "meeting-error",
                            "Invalid meeting link"
                        );

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Extract meeting code
                    --------------------------------------------------------------
                    */

                    const meetingCode =
                        getMeetingCodeFromPath(
                            path
                        );


                    if (!meetingCode) {

                        socket.emit(
                            "meeting-error",
                            "Invalid meeting link"
                        );

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Find meeting
                    --------------------------------------------------------------
                    */

                    let meeting;


                    try {

                        meeting =
                            await Meeting.findOne({

                                meetingCode:
                                    meetingCode

                            });


                    } catch (meetingError) {

                        console.error(
                            "Meeting lookup error:",
                            meetingError
                        );


                        socket.emit(
                            "meeting-error",
                            "Unable to verify meeting"
                        );

                        return;

                    }


                    if (!meeting) {

                        socket.emit(
                            "meeting-error",
                            "Meeting not found"
                        );

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Re-activate an existing meeting when somebody joins again.
                    --------------------------------------------------------------
                    */

                    if (
                        meeting.status !==
                        "active"
                    ) {

                        try {

                            meeting.status =
                                "active";


                            await meeting.save();

                        } catch (
                            statusError
                        ) {

                            console.error(
                                "Meeting status update error:",
                                statusError
                            );

                        }

                    }


                    /*
                    --------------------------------------------------------------
                    Room ID
                    --------------------------------------------------------------
                    */

                    const room =
                        `meeting:${meetingCode}`;


                    /*
                    --------------------------------------------------------------
                    Leave previous room
                    --------------------------------------------------------------
                    */

                    if (
                        socket.currentRoom &&
                        socket.currentRoom !==
                            room
                    ) {

                        const previousRoom =
                            socket.currentRoom;


                        socket.leave(
                            previousRoom
                        );


                        if (
                            connections[
                                previousRoom
                            ]
                        ) {

                            connections[
                                previousRoom
                            ] =
                                connections[
                                    previousRoom
                                ].filter(
                                    socketId =>
                                        socketId !==
                                        socket.id
                                );


                            if (
                                connections[
                                    previousRoom
                                ].length ===
                                0
                            ) {

                                delete connections[
                                    previousRoom
                                ];

                                delete messages[
                                    previousRoom
                                ];

                            }

                        }

                    }


                    socket.currentRoom =
                        room;


                    /*
                    --------------------------------------------------------------
                    Create room
                    --------------------------------------------------------------
                    */

                    if (
                        !connections[
                            room
                        ]
                    ) {

                        connections[
                            room
                        ] =
                            [];

                    }


                    /*
                    --------------------------------------------------------------
                    Add socket
                    --------------------------------------------------------------
                    */

                    if (
                        !connections[
                            room
                        ].includes(
                            socket.id
                        )
                    ) {

                        connections[
                            room
                        ].push(
                            socket.id
                        );

                    }


                    socket.join(
                        room
                    );


                    timeOnline[
                        socket.id
                    ] =
                        new Date();


                    /*
                    --------------------------------------------------------------
                    Notify room participants
                    --------------------------------------------------------------
                    */

                    const roomConnections =
                        connections[
                            room
                        ];


                    roomConnections.forEach(
                        (
                            socketId
                        ) => {

                            io.to(
                                socketId
                            ).emit(
                                "user-joined",
                                socket.id,
                                roomConnections
                            );

                        }
                    );


                    /*
                    --------------------------------------------------------------
                    Send previous messages
                    --------------------------------------------------------------
                    */

                    if (
                        messages[
                            room
                        ]
                    ) {

                        messages[
                            room
                        ].forEach(
                            chatMessage => {

                                io.to(
                                    socket.id
                                ).emit(

                                    "chat-message",

                                    chatMessage.data,

                                    chatMessage.sender,

                                    chatMessage[
                                        "socket-id-sender"
                                    ]

                                );

                            }
                        );

                    }

                }
            );


            /*
            |--------------------------------------------------------------------------
            | WebRTC Signalling
            |--------------------------------------------------------------------------
            */

            socket.on(
                "signal",
                (
                    toId,
                    message
                ) => {

                    if (
                        !toId ||
                        !message
                    ) {

                        return;

                    }


                    if (
                        !socket.currentRoom ||
                        !connections[
                            socket.currentRoom
                        ]
                    ) {

                        return;

                    }


                    if (
                        !connections[
                            socket.currentRoom
                        ].includes(
                            toId
                        )
                    ) {

                        return;

                    }


                    io.to(
                        toId
                    ).emit(
                        "signal",
                        socket.id,
                        message
                    );

                }
            );


            /*
            |--------------------------------------------------------------------------
            | Chat
            |--------------------------------------------------------------------------
            */

            socket.on(
                "chat-message",
                (
                    data,
                    sender
                ) => {

                    if (!data) {

                        return;

                    }


                    const room =
                        socket.currentRoom;


                    if (
                        !room ||
                        !connections[
                            room
                        ]
                    ) {

                        return;

                    }


                    if (
                        !connections[
                            room
                        ].includes(
                            socket.id
                        )
                    ) {

                        return;

                    }


                    const cleanMessage =
                        String(
                            data
                        ).trim();


                    if (!cleanMessage) {

                        return;

                    }


                    if (
                        cleanMessage.length >
                        2000
                    ) {

                        return;

                    }


                    if (
                        messages[
                            room
                        ] === undefined
                    ) {

                        messages[
                            room
                        ] =
                            [];

                    }


                    const chatMessage = {

                        sender:
                            sender ||
                            socket.user?.name ||
                            "User",

                        data:
                            cleanMessage,

                        "socket-id-sender":
                            socket.id

                    };


                    messages[
                        room
                    ].push(
                        chatMessage
                    );


                    connections[
                        room
                    ].forEach(
                        (
                            socketId
                        ) => {

                            io.to(
                                socketId
                            ).emit(

                                "chat-message",

                                chatMessage.data,

                                chatMessage.sender,

                                socket.id

                            );

                        }
                    );

                }
            );


            /*
            |--------------------------------------------------------------------------
            | Disconnect
            |--------------------------------------------------------------------------
            */

            socket.on(
                "disconnect",
                async () => {

                    console.log(
                        "Socket disconnected:",
                        socket.id
                    );


                    delete timeOnline[
                        socket.id
                    ];


                    const room =
                        socket.currentRoom;


                    if (
                        !room
                    ) {

                        return;

                    }


                    if (
                        !connections[
                            room
                        ]
                    ) {

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Notify remaining participants
                    --------------------------------------------------------------
                    */

                    connections[
                        room
                    ].forEach(
                        (
                            socketId
                        ) => {

                            if (
                                socketId !==
                                socket.id
                            ) {

                                io.to(
                                    socketId
                                ).emit(
                                    "user-left",
                                    socket.id
                                );

                            }

                        }
                    );


                    /*
                    --------------------------------------------------------------
                    Remove socket
                    --------------------------------------------------------------
                    */

                    connections[
                        room
                    ] =
                        connections[
                            room
                        ].filter(
                            socketId =>
                                socketId !==
                                socket.id
                        );


                    /*
                    --------------------------------------------------------------
                    If nobody remains:
                    mark meeting as ended.
                    --------------------------------------------------------------
                    */

                    if (
                        connections[
                            room
                        ].length ===
                        0
                    ) {

                        const meetingCode =
                            room.replace(
                                "meeting:",
                                ""
                            );


                        try {

                            await Meeting.findOneAndUpdate(

                                {
                                    meetingCode:
                                        meetingCode
                                },

                                {
                                    $set: {
                                        status:
                                            "ended"
                                    }
                                }

                            );

                        } catch (
                            statusError
                        ) {

                            console.error(
                                "Unable to end meeting:",
                                statusError
                            );

                        }


                        delete connections[
                            room
                        ];

                        delete messages[
                            room
                        ];

                    }


                    socket.currentRoom =
                        null;

                }
            );

        }
    );


    return io;

};
