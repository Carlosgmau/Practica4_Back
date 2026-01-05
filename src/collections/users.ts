import { getDB } from "../db/mongo";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";


export type User = {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
  role?: "USER" | "ADMIN";
};


const COLLECTION = "users";



export const createUser = async (user: { username: string; email: string; password: string; role?: "USER" | "ADMIN" }) => {
  const db = getDB();
  const hashed = await bcrypt.hash(user.password, 10);
  const doc = {
    username: user.username,
    email: user.email,
    password: hashed,
    createdAt: new Date(),
    role: user.role || "USER"
  };
  const res = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: res.insertedId };
};



export const findUserByEmail = async (email: string) => {
  const db = getDB();
  return db.collection<User>(COLLECTION).findOne({ email });
};



export const findUserById = async (id: string) => {
  const db = getDB();
  return db.collection<User>(COLLECTION).findOne({ _id: new ObjectId(id) });
};



export const listUsers = async () => {
  const db = getDB();
  return db.collection<User>(COLLECTION).find().project({ password: 0 }).toArray();
};



export const validateUserCredentials = async (email: string, plainPassword: string) => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(plainPassword, user.password);
  if (!ok) return null;

  const { password, ...rest } = user as any;
  return rest;
};
