import mongoose, { Schema } from "mongoose";


const userScheme = new Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true
        },


        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        googleId: {
            type: String,
            required: true,
            unique: true,
            sparse: true
        },


        avatar: {
            type: String
        },


        token: {
            type: String
        },


        tokenExpires: {
            type: Date
        }

    },

    {
        timestamps: true
    }

);


const User =
    mongoose.model(
        "User",
        userScheme
    );


export {
    User
};
