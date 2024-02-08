'use client';

import * as z from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { usePathname, useRouter } from "next/navigation";

import { CommentValidation } from "@/lib/validations/thread";
import { addCommentToThread, createThread } from '@/lib/actions/thread.actions';
import Image from 'next/image';

interface Props{
    threadId:string,
    currentUserId:string,
    currentUserImg:string
}

const Comment = ({threadId,currentUserId,currentUserImg}:Props) => {
    const router = useRouter();
    const pathname = usePathname();

    const form = useForm({
        resolver:zodResolver(CommentValidation),
        defaultValues:{
            thread:''
        }
    });


    const onSubmit = async(values : z.infer<typeof CommentValidation>) => 
    {
        await addCommentToThread(threadId,values.thread,JSON.parse(currentUserId),pathname);

        form.reset();
    }



    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="comment-form">
            <FormField
                control={form.control}
                name="thread"
                render={({ field }) => (
                    <FormItem className="flex gap-3 w-full items-center" >
                    <FormLabel>
                        <Image src={currentUserImg} alt='Profile Image' width={48} height={48} className='rounded-full object-cover'/>
                    </FormLabel>
                    <FormControl className='border-none bg-transparent'>
                        <Input
                            type='text'
                            placeholder='Comment...'
                            className='no-focus text-light-1 outline-none'
                            {...field}
                        />
                    </FormControl>
                    </FormItem>
                )}
            />
            <Button type='submit' className='comment-form_btn'>Reply</Button>
            </form>
        </Form>
    )
}

export default Comment;