import mongoose, {
    Schema
} from "mongoose";


const meetingSchema =
    new Schema(
        {
            meetingCode: {
                type: String,
                required: true,
                unique: true,
                index: true,
                trim: true
            },

            createdBy: {
                type: String,
                required: true,
                index: true,
                trim: true
            },

            status: {
                type: String,
                enum: [
                    "active",
                    "ended"
                ],
                default: "active",
                index: true
            },

            createdAt: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    );


const Meeting =
    mongoose.model(
        "Meeting",
        meetingSchema
    );


export {
    Meeting
};
