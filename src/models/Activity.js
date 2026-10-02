const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        activity: {
            type: String,
            required: [true, "Activity name is required"],
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        venue: {
            type: String,
            required: [true, "Venue is required"],
            trim: true
        },
        startDateTime: {
            type: Date,
            required: [true, "Start date and time is required"]
        },
        endDateTime: {
            type: Date,
            required: [true, "End date and time is required"],
            validate: {
                validator: function (value) {
                    if (!this.startDateTime || !value) return true;
                    return new Date(value) >= new Date(this.startDateTime);
                },
                message: "End date and time cannot be earlier than start date and time"
            }
        },
        audioVideoLink: {
            type: String,
            default: "",
            trim: true
        },
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserDirectory",
            default: null
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: {
            createdAt: "createdOn",
            updatedAt: "modifiedOn"
        },
        versionKey: false
    }
);

activitySchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    return obj;
};

const Activity = mongoose.model("Activity", activitySchema, "Activity");

module.exports = Activity;
