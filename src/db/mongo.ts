import { MongoClient, Db } from "mongodb";


import dotenv from "dotenv";


dotenv.config();


const MONGO_URI = process.env.MONGO_URI!;


let client: MongoClient;


let db: Db;


export const connectToMongoDB = async () => {


  try {


    client = new MongoClient(MONGO_URI);


    await client.connect();


    db = client.db("06gql");


    console.log("Conectado a MongoDB Atlas");


  } catch (error) {


    console.error("Error al conectar a MongoDB:", error);


    process.exit(1);


  }


};


export const getDB = (): Db => {


  if (!db) {


    throw new Error("MongoDB no está conectado. Llama a connectToMongoDB primero.");


  }


  return db;


};
