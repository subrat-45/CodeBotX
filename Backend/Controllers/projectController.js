import mongoose from "mongoose";
import projectModel from "../Models/projectModel.js";
import * as projectService from "../Services/projectService.js";
import userModel from "../Models/userModel.js";
import { validationResult } from "express-validator";

export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        const { name } = req.body;
        const sanitizedProjectName = name.trim();
        const userEmail = req.user.email.trim().toLowerCase();

        const loggedInUser = await userModel.findOne({ email: userEmail });

        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const userId = loggedInUser._id;

        const existingProject = await projectModel.findOne({
            name: sanitizedProjectName,
            users: userId,
        });

        if (existingProject) {
            return res.status(409).json({ error: "Project already exists" });
        }

        const project = await projectService.createProject({
            name: sanitizedProjectName,
            userId,
        });

        return res.status(201).json({
            message: "Project created successfully",
            project,
            createdBy: {
                id: loggedInUser._id,
                email: loggedInUser.email,
            },
        });
    } catch (error) {
        console.error("Project creation error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllProject = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        const userEmail = req.user.email.trim().toLowerCase();
        const loggedInUser = await userModel.findOne({ email: userEmail });

        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const allUserProjects = await projectService.getAllProjectByUserId({
            userId: loggedInUser._id,
        });

        return res.status(200).json({ projects: allUserProjects });
    } catch (err) {
        console.error("Get projects error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }
    
    try {
        const { projectId, users } = req.body;

        const userEmail = req.user.email.trim().toLowerCase();
        const loggedInUser = await userModel.findOne({ email: userEmail });

        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const project = await projectService.addUserToProject({
            projectId,
            users,
            userId: loggedInUser._id,
        });

        return res.status(200).json({ project });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    try {
        const project = await projectService.getProjectById({ projectId });
        return res.status(200).json({ project });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
    }
};