const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
    {
        activityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Activity",
            required: [true, "Activity ID is required"],
            index: true
        },
        activity: {
            type: String,
            required: [true, "Activity name snapshot is required"],
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserDirectory",
            required: [true, "User ID is required"],
            index: true
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true
        },
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
            index: true
        },
        email: {
            type: String,
            default: "",
            trim: true
        },
        society: {
            type: String,
            default: "",
            trim: true
        },
        tower: {
            type: String,
            default: "",
            trim: true
        },
        floor: {
            type: String,
            default: "",
            trim: true
        },
        flatNo: {
            type: String,
            default: "",
            trim: true
        },
        isWithdraw: {
            type: Boolean,
            default: false,
            index: true
        },
        isPerformed: {
            type: Boolean,
            default: false,
            index: true
        },
        isCertificateCollected: {
            type: Boolean,
            default: false,
            index: true
        },
        performedMarkedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserDirectory",
            default: null
        },
        performedDate: {
            type: Date,
            default: null
        },
        certificateCollectedDate: {
            type: Date,
            default: null
        },
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserDirectory",
            default: null
        }
    },
    {
        timestamps: {
            createdAt: "createdDate",
            updatedAt: "modifiedDate"
        },
        versionKey: false
    }
);

// Compound index to help query and avoid duplicate active registrations quickly
participantSchema.index({ activityId: 1, userId: 1 });

participantSchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    return obj;
};

const Participant = mongoose.model("Participant", participantSchema, "Participant");

module.exports = Participant;
