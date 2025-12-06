import { IResolvers } from "@graphql-tools/utils";
import { ObjectId } from "mongodb";
import { createUser, findUserByEmail, findUserById, listUsers, validateUserCredentials } from "../collections/users";
import { createProject, findProjectsForUser, findProjectById, updateProject, addMemberToProject, deleteProjectById } from "../collections/projects";
import { createTask, findTasksByProjectId, findTaskById, updateTaskStatus, deleteTasksByProjectId } from "../collections/tasks";
import { signToken } from "../auth";
import { getDB } from "../db/mongo";
import bcrypt from "bcryptjs";
export const resolvers: IResolvers = {


  Date: {


    __serialize(value: any) { return value; },


    __parseValue(value: any) { return new Date(value); },


    __parseLiteral(ast: any) { return new Date(ast.value); }


  } as any,


  Query: {


    myProjects: async (_parent, _args, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const projects = await findProjectsForUser(ctx.user._id.toString());


      const db = getDB();


      return Promise.all(projects.map(async p => {


        const owner = await db.collection("users").findOne({ _id: p.owner }, { projection: { password: 0 } });


        const members = await db.collection("users").find({ _id: { $in: p.members || [] } }).project({ password: 0 }).toArray();


        return { ...p, owner, members };


      }));


    },


    projectDetails: async (_parent, { projectId }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const project = await findProjectById(projectId);


      if (!project) throw new Error("Project not found");


      const uid = new ObjectId(ctx.user._id);


      const isOwner = project.owner.toString() === uid.toString();


      const isMember = (project.members || []).some((m: ObjectId) => m.toString() === uid.toString());


      if (!isOwner && !isMember) throw new Error("Not authorized to view this project");


      const db = getDB();


      const owner = await db.collection("users").findOne({ _id: project.owner }, { projection: { password: 0 } });


      const members = await db.collection("users").find({ _id: { $in: project.members || [] } }).project({ password: 0 }).toArray();


      return { ...project, owner, members };


    },


    users: async (_parent, _args, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      return listUsers();


    }


  },


  Project: {


    tasks: async (parent, _args, _ctx) => {


      const tasks = await findTasksByProjectId(parent._id.toString());


      const db = getDB();


      return Promise.all(tasks.map(async t => {


        const assigned = t.assignedTo ? await db.collection("users").findOne({ _id: t.assignedTo }, { projection: { password: 0 } }) : null;


        return { ...t, assignedTo: assigned };


      }));


    }


  },


  Mutation: {


    register: async (_parent, { input }) => {


      const { username, email, password } = input;


      const db = getDB();


      const exists = await db.collection("users").findOne({ $or: [{ email }, { username }] });


      if (exists) throw new Error("Username or email already exists");


      const user = await createUser({ username, email, password });


      const token = signToken(user._id!.toString());


      const { password: _, ...userNoPass } = user as any;


      return { token, user: userNoPass };


    },


    login: async (_parent, { input }) => {


      const { email, password } = input;


      const db = getDB();


      const user = await db.collection("users").findOne({ email });


      if (!user) throw new Error("Invalid credentials");


      const ok = await bcrypt.compare(password, user.password);


      if (!ok) throw new Error("Invalid credentials");


      const token = signToken(user._id!.toString());


      const { password: _, ...userNoPass } = user as any;


      return { token, user: userNoPass };


    },


    createProject: async (_parent, { input }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const { name, description, startDate, endDate, members } = input;


      if (new Date(endDate) <= new Date(startDate)) throw new Error("endDate must be after startDate");


      const project = await createProject({


        name,


        description,


        startDate: new Date(startDate),


        endDate: new Date(endDate),


        ownerId: ctx.user._id.toString(),


        members


      });


      const db = getDB();


      const owner = await db.collection("users").findOne({ _id: project.owner }, { projection: { password: 0 } });


      const populatedMembers = await db.collection("users").find({ _id: { $in: project.members || [] } }).project({ password: 0 }).toArray();


      return { ...project, owner, members: populatedMembers };


    },


    updateProject: async (_parent, { id, input }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const project = await findProjectById(id);


      if (!project) throw new Error("Project not found");


      if (project.owner.toString() !== ctx.user._id.toString()) throw new Error("Only owner can edit");


      if (input.startDate && input.endDate && new Date(input.endDate) <= new Date(input.startDate))


        throw new Error("endDate must be after startDate");


      const updates: any = {};


      if (input.name !== undefined) updates.name = input.name;


      if (input.description !== undefined) updates.description = input.description;


      if (input.startDate !== undefined) updates.startDate = new Date(input.startDate);


      if (input.endDate !== undefined) updates.endDate = new Date(input.endDate);


      if (input.members !== undefined) updates.members = (input.members || []).map((m: string) => new ObjectId(m));


      const updated = await updateProject(id, updates);


      const db = getDB();


      const owner = await db.collection("users").findOne({ _id: updated.owner }, { projection: { password: 0 } });


      const members = await db.collection("users").find({ _id: { $in: updated.members || [] } }).project({ password: 0 }).toArray();


      return { ...updated, owner, members };


    },


    addMember: async (_parent, { projectId, userId }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const project = await findProjectById(projectId);


      if (!project) throw new Error("Project not found");


      if (project.owner.toString() !== ctx.user._id.toString()) throw new Error("Only owner can add members");


      const updated = await addMemberToProject(projectId, userId);


      const db = getDB();


      const owner = await db.collection("users").findOne({ _id: updated.owner }, { projection: { password: 0 } });


      const members = await db.collection("users").find({ _id: { $in: updated.members || [] } }).project({ password: 0 }).toArray();


      return { ...updated, owner, members };


    },


    createTask: async (_parent, { projectId, input }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const project = await findProjectById(projectId);


      if (!project) throw new Error("Project not found");


      const uid = ctx.user._id.toString();


      const isMemberOrOwner = (project.owner.toString() === uid) || ((project.members || []).some((m: ObjectId) => m.toString() === uid));


      if (!isMemberOrOwner) throw new Error("Only project members or owner can create tasks");


      const created = await createTask({


        title: input.title,


        projectId,


        assignedTo: input.assignedTo,


        priority: input.priority,


        dueDate: input.dueDate ? new Date(input.dueDate) : undefined


      });


      const db = getDB();


      const assigned = created.assignedTo ? await db.collection("users").findOne({ _id: created.assignedTo }, { projection: { password: 0 } }) : null;


      return { ...created, assignedTo: assigned };


    },


    updateTaskStatus: async (_parent, { taskId, status }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const task = await findTaskById(taskId);


      if (!task) throw new Error("Task not found");


      const project = await findProjectById(task.projectId.toString());


      const uid = ctx.user._id.toString();


      const isMemberOrOwner = (project.owner.toString() === uid) || ((project.members || []).some((m: ObjectId) => m.toString() === uid));


      if (!isMemberOrOwner) throw new Error("Not authorized to update task status");


      const updated = await updateTaskStatus(taskId, status);


      const db = getDB();


      const assigned = updated.assignedTo ? await db.collection("users").findOne({ _id: updated.assignedTo }, { projection: { password: 0 } }) : null;


      return { ...updated, assignedTo: assigned };


    },


    deleteProject: async (_parent, { id }, ctx) => {


      if (!ctx.user) throw new Error("Not authenticated");


      const project = await findProjectById(id);


      if (!project) throw new Error("Project not found");


      if (project.owner.toString() !== ctx.user._id.toString()) throw new Error("Only owner can delete project");


      await deleteTasksByProjectId(id);


      const ok = await deleteProjectById(id);


      return ok;


    }


  }


};
