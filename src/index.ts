import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "apollo-server";
import { connectToMongoDB } from "./db/mongo";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { getUserFromToken } from "./auth";


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function start() {
  
  await connectToMongoDB();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const auth = req.headers.authorization || req.headers.Authorization || "";
      const user = await getUserFromToken(auth as string);
      return { user };
    },
  });

  const { url } = await server.listen({ port: PORT });
  console.log(`Server ready at ${url}`);
}


start().catch(err => {
  console.error(err);
  process.exit(1);
});
