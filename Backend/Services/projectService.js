import mongoose from "mongoose";
import projectModel from "../Models/projectModel.js";

export const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error("Name is required");
    }
    if (!userId) {
        throw new Error("User is required");
    }

    const project = await projectModel.create({
        name,
        users: [userId],
    });

    return project;
};

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error("User id is required");
    }

    const allUserProject = await projectModel.find({
        users: userId,
    });

    return allUserProject;
};

export const addUserToProject = async ({ projectId, users, userId }) => {
    if (!projectId) {
        throw new Error("Project ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid Project ID");
    }

    if (!users) {
        throw new Error("Users are required");
    }

    if (!Array.isArray(users) || users.length === 0) {
        throw new Error("Users array is required and must contain at least one user");
    }

    if (!userId) {
        throw new Error("User Id is required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId");
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId,
    });

    if (!project) {
        throw new Error("User not belong to this project");
    }

    const updatedProject = await projectModel.findOneAndUpdate(
        { _id: projectId },
        {
            $addToSet: {
                users: { $each: users },
            },
        },
        { new: true }
    );

    return updatedProject;
};

export const getProjectById = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("Project id required");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId");
    }

    const project = await projectModel.findOne({
        _id: projectId,
    }).populate("users");

    return project;
};