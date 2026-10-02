const mongoose = require("mongoose");

const userDirectorySchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
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
        flatNumber: {
            type: String,
            default: "",
            trim: true
        },
        isAdmin: {
            type: Boolean,
            default: false
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

// Format user object for responses (exclude internal/unneeded fields)
userDirectorySchema.methods.toJSON = function () {
    const obj = this.toObject();
    obj.id = obj._id;
    return obj;
};

const UserDirectory = mongoose.model("UserDirectory", userDirectorySchema, "UserDirectory");

module.exports = UserDirectory;
