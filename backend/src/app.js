import express from "express";
import { createServer } from "node:http";

import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";


/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

dotenv.config();


/*
|--------------------------------------------------------------------------
| Express Application
|--------------------------------------------------------------------------
*/

const app =
    express();


/*
|--------------------------------------------------------------------------
| HTTP Server
|--------------------------------------------------------------------------
*/

const server =
    createServer(
        app
    );


/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

connectToSocket(
    server
);


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const PORT =
    process.env.PORT ||
    8000;


/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin: [
            "https://apnaazoom-frontend.onrender.com",
            "http://localhost:3000"
        ],

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        credentials:
            true
    })
);


app.use(
    express.json({
        limit:
            "40kb"
    })
);


app.use(
    express.urlencoded({

        limit:
            "40kb",

        extended:
            true

    })
);


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    (
        req,
        res
    ) => {

        return res.status(
            200
        ).json({

            success:
                true,

            message:
                "ApnaaZoom backend is running",

            timestamp:
                new Date()
                    .toISOString()

        });

    }
);


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api/v1/users",
    userRoutes
);


/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    (
        req,
        res
    ) => {

        return res.status(
            200
        ).json({

            success:
                true,

            message:
                "Welcome to ApnaaZoom API"

        });

    }
);


/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(
    (
        req,
        res
    ) => {

        return res.status(
            404
        ).json({

            success:
                false,

            message:
                "API endpoint not found"

        });

    }
);


/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            error
        );


        return res.status(
            500
        ).json({

            success:
                false,

            message:
                "Internal server error"

        });

    }
);


/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const start =
    async () => {

        try {

            /*
            --------------------------------------------------------------
            Validate MongoDB configuration
            --------------------------------------------------------------
            */

            if (
                !process.env.MONGO_URL
            ) {

                throw new Error(
                    "MONGO_URL is not configured"
                );

            }


            /*
            --------------------------------------------------------------
            Connect MongoDB
            --------------------------------------------------------------
            */

            const connectionDb =
                await mongoose.connect(
                    process.env.MONGO_URL
                );


            console.log(
                `MONGO Connected DB Host: ${connectionDb.connection.host}`
            );


            /*
            --------------------------------------------------------------
            Start HTTP server
            --------------------------------------------------------------
            */

            server.listen(
                PORT,
                () => {

                    console.log(
                        `ApnaaZoom server listening on port ${PORT}`
                    );

                }
            );

        } catch (
            error
        ) {

            console.error(
                "Server startup failed:",
                error
            );


            process.exit(
                1
            );

        }

    };


start();
