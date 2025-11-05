import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        }
    ]
}, {
    timestamps: true
});

projectSchema.index({ name: 1, "users.0": 1 }, { unique: true });

const Project = mongoose.model('project', projectSchema);
export default Project;