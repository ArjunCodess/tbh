'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { apiResponse } from '@/types/apiResponse';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/app/lib/models/message.schema';
import { Message } from '@/app/lib/models/message.schema';
import dayjs from 'dayjs';
import puppeteer from 'puppeteer'
import fs from 'fs';
import { randomInt } from 'crypto';

export default function MessagePage() {
    const [messages, setMessages] = useState<MessageData[] | Message[] | any>([]);
    const [imageSourceUrl, setImageSourceUrl] = useState("");

    const params = useParams<{ messageId: string }>();
    const messageId = params.messageId;

    const { toast } = useToast();

    const { data: session } = useSession();

    const fetchMessages = useCallback(async (refresh: boolean = false) => {
        try {
            const response = await axios.get<apiResponse>('/api/get-single-message?messageId=' + messageId);
            setMessages(response.data.messages || []);

            if (refresh) toast({
                title: 'Refreshed Messages',
                description: 'Showing latest messages',
            });
        }

        catch (error) {
            const axiosError = error as AxiosError<apiResponse>;
            toast({
                title: 'Error',
                description: axiosError.response?.data.message ?? 'Failed to fetch messages',
                variant: 'destructive',
            });
        }
    }, [setMessages, toast, messageId]);

    useEffect(() => {
        if (!session || !session.user) return;

        fetchMessages();
    }, [session, toast, fetchMessages]);

    const message = messages[0];

    async function fetchBlob(url: string) {
        const response = await fetch(url);
        return response.blob();
    }

    // const imageSourceUrlNew = "https://res.cloudinary.com/daily-now/image/upload/f_auto,q_auto/v1/posts/e7acd37725c6ccb9f2cd03a4fbacfe15?_a=AQAEuiZ";

    const imageSourceUrl1 = message
        ? `https://tbh-tobehonest.vercel.app/api/og?question=${encodeURIComponent(message.messages.content)}`
        : '';

    const addToStory = async () => {
        downloadImageAndSetSource();

        console.log(`clicked shareImageAsset: ${imageSourceUrl1}`)
        const fetchedImage = await fetch(imageSourceUrl1)
        const blobImage = await fetchedImage.blob()
        const fileName = imageSourceUrl1.split('/').pop()
        const filesArray = [
            new File([blobImage], (fileName as string), {
                type: 'blob.type',
                lastModified: Date.now(),
            }),
        ]
        const shareData = {
            title: fileName,
            files: filesArray,
            url: document.location.origin,
        }
        console.log(shareData)
        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData)
        }
    }

    const downloadImageAndSetSource = async () => {
        const image = await fetchBlob('/api/og?question=' + message.messages.content);
        setImageSourceUrl(URL.createObjectURL(image));
    }

    return (
        <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full animate-blob-1">
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#96ffbf] to-[#ff7575] opacity-50 blur-3xl animate-blob-1" />
                </div>
                <div className="absolute top-0 right-0 w-full h-full animate-blob-2">
                    <div className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-r from-[#373aff] to-[#e74c3c] opacity-50 blur-3xl animate-blob-2" />
                </div>
                <div className="absolute bottom-0 left-0 w-full h-full animate-blob-3">
                    <div className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#2980b9] to-[#ff6cbf] opacity-50 blur-3xl animate-blob-3" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold z-10 text-center">{message?.messages.content}</h1>
                <p className="text-muted-foreground mt-2 z-10">Sent at: {dayjs(message?.messages.createdAt).format('MMM D, YYYY h:mm A')}</p>
                <div className="mt-6 space-x-4 z-10 grid-cols-2">
                    <Button onClick={addToStory}>Add To Story</Button>
                </div>
                {imageSourceUrl && <img src={imageSourceUrl} width={500} height={500}></img>}
            </div>
        </div>
    )
}