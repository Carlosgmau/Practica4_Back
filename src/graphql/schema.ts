import { gql } from "apollo-server";


export const typeDefs = gql`


  scalar Date


  enum TaskStatus { PENDING IN_PROGRESS COMPLETED }


  enum Priority { LOW MEDIUM HIGH }


  type User {


    _id: ID!


    username: String!


    email: String!


    createdAt: Date


    role: String


  }


  type Project {

    _id: ID!

    name: String!

    description: String

    startDate: Date!

    endDate: Date!

    owner: User!

    members: [User!]!

    tasks: [Task!]!

  }


  type Task {

    _id: ID!

    title: String!

    projectId: ID!

    assignedTo: User

    status: TaskStatus!

    priority: Priority

    dueDate: Date
    createdAt: Date

    updatedAt: Date


  }


  type AuthPayload {

    token: String!

    user: User!

  }


  input RegisterInput {

    username: String!

    email: String!

    password: String!

  }


  input LoginInput {

    email: String!

    password: String!


  }


  input CreateProjectInput {


    name: String!

    description: String

    startDate: Date!


    endDate: Date!

    members: [ID!]

  }


  input UpdateProjectInput {


    name: String

    description: String


    startDate: Date

    endDate: Date

    members: [ID!]


  }


  input TaskInput {

    title: String!

    assignedTo: ID


    priority: Priority


    dueDate: Date


  }


  type Query {


    myProjects: [Project!]!

    projectDetails(projectId: ID!): Project


    users: [User!]!


  }


  type Mutation {


    register(input: RegisterInput!): AuthPayload!

    login(input: LoginInput!): AuthPayload!
    createProject(input: CreateProjectInput!): Project!

    updateProject(id: ID!, input: UpdateProjectInput!): Project!


    addMember(projectId: ID!, userId: ID!): Project!


    createTask(projectId: ID!, input: TaskInput!): Task!

    updateTaskStatus(taskId: ID!, status: TaskStatus!): Task!

    deleteProject(id: ID!): Boolean!


  }


`;
