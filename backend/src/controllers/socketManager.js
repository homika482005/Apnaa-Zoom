import { Server } from "socket.io";
import { User } from "../models/user.model.js";

let connections = {}
let messages = {}
let timeOnline = {}


export const connectToSocket = (server) => {

    const io = new Server(server, {

        cors: {
            origin: [
                "https://apnaazoom-frontend.onrender.com",
                "http://localhost:3000"
            ],
            methods: ["GET", "POST"],
            credentials: true
        }

    });


    io.use(async (socket, next) => {

        try {

            const token =
                socket.handshake.auth.token;


            if (!token) {

                return next(
                    new Error(
                        "Authentication token is required"
                    )
                )

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
                )

            }


            socket.user = user;

            next();

        } catch (e) {

            console.log(
                "Socket authentication error:",
                e
            );

            return next(
                new Error(
                    "Socket authentication failed"
                )
            )

        }

    });


    io.on("connection", (socket) => {

        console.log(
            "AUTHENTICATED SOCKET CONNECTED:",
            socket.id
        );


        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }


            if (
                !connections[path].includes(
                    socket.id
                )
            ) {

                connections[path].push(
                    socket.id
                )

            }


            timeOnline[socket.id] =
                new Date();


            for (
                let a = 0;
                a < connections[path].length;
                a++
            ) {

                io.to(
                    connections[path][a]
                ).emit(
                    "user-joined",
                    socket.id,
                    connections[path]
                )

            }


            if (messages[path] !== undefined) {

                for (
                    let a = 0;
                    a < messages[path].length;
                    ++a
                ) {

                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    )

                }

            }

        })


        socket.on(
            "signal",
            (toId, message) => {

                if (!toId || !message) {
                    return;
                }

                io.to(toId).emit(
                    "signal",
                    socket.id,
                    message
                );

            }
        )


        socket.on(
            "chat-message",
            (data, sender) => {

                if (!data) {
                    return;
                }


                const [
                    matchingRoom,
                    found
                ] = Object.entries(
                    connections
                )
                    .reduce(
                        (
                            [room, isFound],
                            [roomKey, roomValue]
                        ) => {

                            if (
                                !isFound &&
                                roomValue.includes(
                                    socket.id
                                )
                            ) {

                                return [
                                    roomKey,
                                    true
                                ];

                            }

                            return [
                                room,
                                isFound
                            ];

                        },
                        ['', false]
                    );


                if (found === true) {

                    if (
                        messages[
                            matchingRoom
                        ] === undefined
                    ) {

                        messages[
                            matchingRoom
                        ] = []

                    }


                    messages[
                        matchingRoom
                    ].push({

                        sender: sender,

                        data: data,

                        "socket-id-sender":
                            socket.id

                    })


                    console.log(
                        "message",
                        matchingRoom,
                        ":",
                        sender,
                        data
                    )


                    connections[
                        matchingRoom
                    ].forEach(
                        (elem) => {

                            io.to(elem).emit(
                                "chat-message",
                                data,
                                sender,
                                socket.id
                            )

                        }
                    )

                }

            }
        )


        socket.on(
            "disconnect",
            () => {

                console.log(
                    "SOCKET DISCONNECTED:",
                    socket.id
                );


                delete timeOnline[
                    socket.id
                ];


                for (
                    const [
                        key,
                        value
                    ] of Object.entries(
                        connections
                    )
                ) {

                    if (
                        value.includes(
                            socket.id
                        )
                    ) {

                        for (
                            let a = 0;
                            a < value.length;
                            a++
                        ) {

                            io.to(
                                value[a]
                            ).emit(
                                "user-left",
                                socket.id
                            )

                        }


                        const index =
                            connections[key]
                                .indexOf(
                                    socket.id
                                );


                        if (index !== -1) {

                            connections[key]
                                .splice(
                                    index,
                                    1
                                )

                        }


                        if (
                            connections[key]
                                .length === 0
                        ) {

                            delete connections[
                                key
                            ]

                        }

                    }

                }

            }
        )

    })


    return io;

}
