import { Server } from "socket.io";
import { User } from "../models/user.model.js";


const connections = {};
const messages = {};
const timeOnline = {};


export const connectToSocket = (server) => {

    const io = new Server(server, {

        cors: {
            origin: [
                "https://apnaazoom-frontend.onrender.com",
                "http://localhost:3000"
            ],
            methods: [
                "GET",
                "POST"
            ],
            credentials: true
        }

    });


    /*
    |--------------------------------------------------------------------------
    | Socket Authentication
    |--------------------------------------------------------------------------
    */

    io.use(async (socket, next) => {

        try {

            const token =
                socket.handshake.auth?.token;


            if (!token) {

                return next(
                    new Error(
                        "Authentication required"
                    )
                );

            }


            const user =
                await User.findOne({

                    token: token,

                    tokenExpires: {
                        $gt: new Date()
                    }

                });


            if (!user) {

                return next(
                    new Error(
                        "Invalid or expired session"
                    )
                );

            }


            socket.user = user;

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

    });


    /*
    |--------------------------------------------------------------------------
    | Authenticated Connection
    |--------------------------------------------------------------------------
    */

    io.on(
        "connection",
        (socket) => {

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
                (path) => {

                    if (!path) {
                        return;
                    }


                    if (
                        connections[path] ===
                        undefined
                    ) {

                        connections[path] = [];

                    }


                    if (
                        !connections[path].includes(
                            socket.id
                        )
                    ) {

                        connections[path].push(
                            socket.id
                        );

                    }


                    timeOnline[socket.id] =
                        new Date();


                    for (
                        let i = 0;
                        i < connections[path].length;
                        i++
                    ) {

                        io.to(
                            connections[path][i]
                        ).emit(
                            "user-joined",
                            socket.id,
                            connections[path]
                        );

                    }


                    if (
                        messages[path] !==
                        undefined
                    ) {

                        for (
                            let i = 0;
                            i < messages[path].length;
                            i++
                        ) {

                            io.to(
                                socket.id
                            ).emit(
                                "chat-message",

                                messages[path][i].data,

                                messages[path][i].sender,

                                messages[path][i][
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


                    const entries =
                        Object.entries(
                            connections
                        );


                    let matchingRoom =
                        null;


                    for (
                        let i = 0;
                        i < entries.length;
                        i++
                    ) {

                        const [
                            room,
                            roomConnections
                        ] =
                            entries[i];


                        if (
                            roomConnections.includes(
                                socket.id
                            )
                        ) {

                            matchingRoom =
                                room;

                            break;

                        }

                    }


                    if (
                        matchingRoom ===
                        null
                    ) {

                        return;

                    }


                    if (
                        messages[
                            matchingRoom
                        ] === undefined
                    ) {

                        messages[
                            matchingRoom
                        ] = [];

                    }


                    const chatMessage = {

                        sender:
                            sender ||
                            socket.user?.name ||
                            "User",

                        data:
                            String(data),

                        "socket-id-sender":
                            socket.id

                    };


                    messages[
                        matchingRoom
                    ].push(
                        chatMessage
                    );


                    connections[
                        matchingRoom
                    ].forEach(
                        (socketId) => {

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


                    for (
                        const [
                            room,
                            roomConnections
                        ] of Object.entries(
                            connections
                        )
                    ) {

                        if (
                            !roomConnections.includes(
                                socket.id
                            )
                        ) {

                            continue;

                        }


                        roomConnections.forEach(
                            (socketId) => {

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


                        const index =
                            roomConnections.indexOf(
                                socket.id
                            );


                        if (
                            index !== -1
                        ) {

                            roomConnections.splice(
                                index,
                                1
                            );

                        }


                        if (
                            roomConnections.length ===
                            0
                        ) {

                            delete connections[
                                room
                            ];

                            delete messages[
                                room
                            ];

                        }

                    }

                }
            );

        }
    );


    return io;

};
