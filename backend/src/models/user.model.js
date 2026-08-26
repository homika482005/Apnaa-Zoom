import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },

        username: {
            type: String,
            required: true,
            unique: true
        },

        email: {
            type: String,
            unique: true,
            sparse: true
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
        }
    }
)

const User = mongoose.model("User", userScheme);

export { User };
