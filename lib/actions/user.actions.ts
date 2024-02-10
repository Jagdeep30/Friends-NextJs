"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

export const updateUser = async(
    {
        userId,name,username,bio,image,path
    }:
    {
    userId:string,name:string,username:string,bio:string,image:string,path:string
    }):
    Promise<void> => {
    connectToDB();

    try {
        await User.findOneAndUpdate({id:userId},{
            name,
            username:username.toLowerCase(),
            bio,
            image,
            onboarded:true
        },
        {upsert:true});

        if(path === '/profile/edit')revalidatePath(path);
    } catch (error:any) {
        throw new Error(`Failed to create/update user : ${error.message}`);
    }
}

export const fetchUser = async (userId:string) => {
    try {
        connectToDB();
        return User.findOne({id:userId})
        // .populate({
        //     path:'communities',
        //     model:'Community'
        // })
    } catch (error:any) {
        throw new Error(`Failed to fetch user : ${error.message}`);
    }
}


export const fetchUserPosts = async(userId:string) => {
    try {
        connectToDB();

        const threads = await User.findOne({id:userId})
        .populate({
            path:'threads',
            model:Thread,
            populate:{
                path:'children',
                model:Thread,
                populate:{
                    path:'author',
                    model:User,
                    select:'name image id'
                }
            }
        }); 
        return threads;
    } catch (error:any) {
        throw new Error(`Failed to fetch user posts : ${error.message}`);
    }
}


export const fetchUsers = async({
    userId,
    searchString="",
    pageNumber=1,
    pageSize=20,
    sortBy="desc"
}:{
    userId:string,
    searchString?:string,
    pageNumber?:number,
    pageSize?:number,
    sortBy?:SortOrder
}) => {

    try {
        connectToDB();

        const skipAmount = (pageNumber-1) * pageSize;

        const regex = new RegExp(searchString,'i');

        const query: FilterQuery<typeof User> = {
            id:{$ne:userId}
        }

        if(searchString.trim() !== ''){
            query.$or = [
                {name:{$regex:regex}},
                {username:{$regex:regex}}
            ]
        }

        const sortOptions = {
            createdAt:sortBy
        }

        const usersQuery = User.find(query).sort(sortOptions).skip(skipAmount).limit(pageSize);

        const totalUsersCount = await User.countDocuments(query);

        const isNext = totalUsersCount > skipAmount+pageSize;

        const users = await usersQuery.exec();

        return {users,isNext};
    } catch (error:any) {
        throw new Error(`Failed fetching the users : ${error.message}`)
    }
}


export const getActivity = async(userId:string) => {
    try {
        connectToDB();

        //get all the threads of current user
        const userThreads = await Thread.find({author:userId});
        
        //collect all the child thread ids from the children field of the fetched users
        const childThreadIds = userThreads.reduce((acc,userThread)=>{
            return acc.concat(userThread.children);
        },[])

        const replies = await Thread.find(
            {
                _id:{$in:childThreadIds},
                author:{$ne:userId}
            }
        ).populate({
            path:'author',
            model:User,
            select:'name image _id'
        }).sort({createdAt:'desc'});

        return replies;

    } catch (error:any) {
        throw new Error(`Failed to fetch user activity : ${error.message}`)
    }
}