import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";

export type TaskDoc = {
  _id?: ObjectId;
  title: string;
  projectId: ObjectId;
  assignedTo?: ObjectId;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};



const COLLECTION = "tasks";



export const createTask = async (payload: {
  title: string;
  projectId: string;
  assignedTo?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date;
}) => {
  const db = getDB();
  const doc: TaskDoc = {
    title: payload.title,
    projectId: new ObjectId(payload.projectId),
    assignedTo: payload.assignedTo ? new ObjectId(payload.assignedTo) : undefined,
    status: "PENDING",
    priority: payload.priority || "MEDIUM",
    dueDate: payload.dueDate,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: r.insertedId };
};


export const findTasksByProjectId = async (projectId: string) => {
  const db = getDB();
  return db.collection(COLLECTION).find({ projectId: new ObjectId(projectId) }).toArray();
};



export const findTaskById = async (taskId: string) => {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(taskId) });
};



export const updateTaskStatus = async (taskId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => {
  const db = getDB();
  const res = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(taskId) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return res.value;
};



export const deleteTasksByProjectId = async (projectId: string) => {
  const db = getDB();
  const res = await db.collection(COLLECTION).deleteMany({ projectId: new ObjectId(projectId) });
  return res.deletedCount;
};