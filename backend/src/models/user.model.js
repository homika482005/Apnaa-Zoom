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
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true
        },

        avatar: {
            type: String
        },

        verificationToken: {
            type: String
        },

        verificationTokenExpires: {
            type: Date
        },

        resetPasswordToken: {
            type: String
        },

        resetPasswordExpires: {
            type: Date
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
)


const User = mongoose.model("User", userScheme);

export { User };
