import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import { getDB } from './db/mongo';
import { ObjectId } from 'mongodb';


dotenv.config();

const SUPER_SECRETO = process.env.JWT_SECRET || process.env.SECRET || "dev_secret";
type TokenPayload = {
  userId: string;
};


export const signToken = (userId: string) => jwt.sign({ userId }, SUPER_SECRETO!, { expiresIn: "8h" });

export const verifyToken = (token: string): TokenPayload | null => {

  try {

    return jwt.verify(token, SUPER_SECRETO!) as TokenPayload;
  } catch (err) {
    return null;
  }

};


export const getUserFromToken = async (token?: string | null) => {

  if (!token) return null;
  const raw = token.startsWith("Bearer ") ? token.slice(7) : token;

  const payload = verifyToken(raw);
  if (!payload) return null;

  const db = getDB();

  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) }, { projection: { password: 0 } });
  return user;

};
