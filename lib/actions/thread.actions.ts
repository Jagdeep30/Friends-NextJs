import Thread from "../models/thread.model";
import { connectToDB } from "../mongoose"

interface Params{
    text:string,
    author:string,
    communityId:string | null,
    path:string
}

export const createThread = async({text,author,communityId,path}:Params) => {
    try {
        connectToDB();
        const createdThread = await Thread.create({text,author,community:communityId});
    } catch (error:any) {
        throw new Error(`Failed to create a new thread : ${error.message}`)
    }
}