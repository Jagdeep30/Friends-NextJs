"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import { model } from "mongoose";

interface Params{
    text:string,
    author:string,
    communityId:string | null,
    path:string
}

export const createThread = async({text,author,communityId,path}:Params) => {
    try {
        connectToDB();
        const createdThread = await Thread.create(
            {
                text,
                author,
                community:null
            });

        //updating user
        await User.findByIdAndUpdate(author,{
            $push:{threads:createdThread._id}
        })
        revalidatePath(path);
    } 
    catch (error:any) {
        throw new Error(`Failed to create a new thread : ${error.message}`)
    }
}


export const fetchPosts = async(pageNumber=1, pageSize=20) => {
    try {
        connectToDB();

        let skipAmount = (pageNumber-1)*pageSize;
        const postsQuery = Thread.find({parentId:{$in:[null,undefined]}}).sort({createAt:'desc'}).skip(skipAmount).limit(pageSize).populate({path:'author',model:User}).populate({
            path:'children',
            populate:{
                path:'author',
                model:User,
                select:'_id name parentId image'
            }
        })

        
        
        const totalPostsCount = await Thread.countDocuments({parent:{$in:[null,undefined]}});
        
        const posts = await postsQuery.exec();
        // console.log(posts);
        
        const isNext = totalPostsCount > skipAmount+pageSize;

        return {posts,isNext};
    } 
    catch (error:any) {
        throw new Error(`Failed to fetch posts : ${error.message}`)
    }
}


export const fetchThreadById = async(id:string) => {
    connectToDB();

    try {
        
        const thread = Thread.findById(id).populate({path:'author',model:User,select:'_id id name image'}).populate({
            path:'children',
            populate:[
                {
                    path:'author',
                    model:User,
                    select:'_id id name parentId image'
                },
                {
                    path:'children',
                    model:Thread,
                    populate:{
                        path:'author',
                        model:User,
                        select:'_id id name image parentId'
                    }
                }
            ]
        }).exec();

        return thread;

    } catch (error:any) {
        throw new Error(`Error fetching the thread: ${error.message}`)
    }

}


export const addCommentToThread = async( threadId:string,commentText:string,userId:string,path:string) => {

    connectToDB();

    try {
        
        const originalThread = await Thread.findById(threadId);

        if(!originalThread)throw new Error('Original thread not found');

        const commentThread = await Thread.create({
            text:commentText,
            parentId:threadId,
            author:userId
        });

        originalThread.children.push(commentThread._id);
        await originalThread.save();
        revalidatePath(path);

    } catch (error:any) {
        throw new Error(`Error adding comment to thread : ${error.message}`)
    }
}