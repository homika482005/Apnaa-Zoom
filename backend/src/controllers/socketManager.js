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
                    Check actual meeting in MongoDB
                    --------------------------------------------------------------
                    */

                    try {

                        const meeting =
                            await Meeting.findOne({

                                meetingCode:
                                    meetingCode

                            });


                        if (!meeting) {

                            socket.emit(
                                "meeting-error",
                                "Meeting not found"
                            );

                            return;

                        }

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


                    /*
                    --------------------------------------------------------------
                    Use normalized meeting room ID
                    --------------------------------------------------------------
                    */

                    const room =
                        `meeting:${meetingCode}`;


                    /*
                    --------------------------------------------------------------
                    Leave previous room if any
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
                        !connections[room]
                    ) {

                        connections[room] =
                            [];

                    }


                    /*
                    --------------------------------------------------------------
                    Add socket to room
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
                    Notify all participants
                    --------------------------------------------------------------
                    */

                    const roomConnections =
                        connections[
                            room
                        ];


                    for (
                        let i = 0;
                        i <
                        roomConnections.length;
                        i++
                    ) {

                        io.to(
                            roomConnections[i]
                        ).emit(
                            "user-joined",
                            socket.id,
                            roomConnections
                        );

                    }


                    /*
                    --------------------------------------------------------------
                    Send previous chat messages
                    --------------------------------------------------------------
                    */

                    if (
                        messages[
                            room
                        ]
                    ) {

                        for (
                            let i = 0;
                            i <
                            messages[
                                room
                            ].length;
                            i++
                        ) {

                            const chatMessage =
                                messages[
                                    room
                                ][i];


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


                    /*
                    --------------------------------------------------------------
                    Only allow signaling while inside a valid meeting
                    --------------------------------------------------------------
                    */

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
                            String(data)
                                .trim(),

                        "socket-id-sender":
                            socket.id

                    };


                    /*
                    --------------------------------------------------------------
                    Don't store empty messages
                    --------------------------------------------------------------
                    */

                    if (
                        !chatMessage.data
                    ) {

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Basic size protection
                    --------------------------------------------------------------
                    */

                    if (
                        chatMessage.data.length >
                        2000
                    ) {

                        return;

                    }


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
                () => {

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
                        !room ||
                        !connections[
                            room
                        ]
                    ) {

                        return;

                    }


                    /*
                    --------------------------------------------------------------
                    Notify remaining users
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
                    Remove empty room
                    --------------------------------------------------------------
                    */

                    if (
                        connections[
                            room
                        ].length ===
                        0
                    ) {

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
