"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

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