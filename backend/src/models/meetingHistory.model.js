import mongoose, {
    Schema
} from "mongoose";


const meetingHistorySchema =
    new Schema(
        {
            user_id: {
                type: String,
                required: true,
                index: true
            },

            meeting: {
                type: Schema.Types.ObjectId,
                ref: "Meeting",
                required: true,
                index: true
            },

            meetingCode: {
                type: String,
                required: true,
                trim: true,
                index: true
            },

            action: {
                type: String,
                enum: [
                    "created",
                    "joined"
                ],
                required: true
            },

            date: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    );


const MeetingHistory =
    mongoose.model(
        "MeetingHistory",
        meetingHistorySchema
    );


export {
    MeetingHistory
};
