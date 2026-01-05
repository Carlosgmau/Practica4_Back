import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";

export type ProjectDoc = {
  _id?: ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  owner: ObjectId;
  members: ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};


const COLLECTION = "projects";


export const createProject = async (payload: {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  ownerId: string;
  members?: string[];
}) => {
  const db = getDB();
  const doc: ProjectDoc = {
    name: payload.name,
    description: payload.description,
    startDate: payload.startDate,
    endDate: payload.endDate,
    owner: new ObjectId(payload.ownerId),
    members: (payload.members || []).map(id => new ObjectId(id)),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const r = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: r.insertedId };
};




export const findProjectsForUser = async (userId: string) => {
  const db = getDB();
  const oid = new ObjectId(userId);
  return db.collection(COLLECTION)
    .find({ $or: [{ owner: oid }, { members: oid }] })
    .toArray();
};



export const findProjectById = async (projectId: string) => {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(projectId) });
};



export const updateProject = async (projectId: string, updates: Partial<ProjectDoc>) => {
  const db = getDB();
  updates.updatedAt = new Date();
  const res = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(projectId) },
    { $set: updates },
    { returnDocument: "after" }
  );
  return res.value;
};



export const addMemberToProject = async (projectId: string, userId: string) => {
  const db = getDB();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(projectId) },
    { $addToSet: { members: new ObjectId(userId) }, $set: { updatedAt: new Date() } }
  );
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(projectId) });
};



export const deleteProjectById = async (projectId: string) => {
  const db = getDB();
  const res = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(projectId) });
  return res.deletedCount === 1;
};
