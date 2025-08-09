'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import { apiResponse } from '@/types/apiResponse';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/lib/models/message.schema';
import { Message } from '@/lib/models/message.schema';
import dayjs from 'dayjs';
import html2canvas from "html2canvas";
import Image from 'next/image';

export default function MessagePage() {
    const [messages, setMessages] = useState<MessageData[] | Message[] | any>([]);
    const [imageSourceUrl, setImageSourceUrl] = useState("");

    const params = useParams<{ messageId: string }>();
    const messageId = params.messageId;


    const { data: session } = useSession();

    const fetchMessages = useCallback(async (refresh: boolean = false) => {
        try {
            const response = await axios.get<apiResponse>('/api/get-single-message?messageId=' + messageId);
            setMessages(response.data.messages || []);

            if (refresh) toast('Refreshed Messages', { description: 'Showing latest messages' });
        }

        catch (error) {
            const axiosError = error as AxiosError<apiResponse>;
            toast.error('Error', { description: axiosError.response?.data.message ?? 'Failed to fetch messages' });
        }
    }, [setMessages, messageId]);

    useEffect(() => {
        if (!session || !session.user) return;

        fetchMessages();
    }, [session, fetchMessages]);

    const message = messages[0];

    async function fetchBlob(url: string) {
        const response = await fetch(url);
        return response.blob();
    }

    const printRef = React.useRef<HTMLInputElement>(null);
    const shareImage = async () => {
        const element = printRef.current;
        const canvas = await html2canvas(element!);

        const data = canvas.toDataURL();

        const blob = await (await fetch(data)).blob();
        const file = new File([blob], "question.png", { type: blob.type });

        navigator.share({
            title: "Share TBH Question",
            text: "Check out this question sent to me anonymously on TBH.",
            files: [file],
        });
    };

    const addToStory = async () => {
        downloadImageAndSetSource();
        shareImage();
    }

    const downloadImageAndSetSource = async () => {
        const image = await fetchBlob('/api/question-image-generation?question=' + message.messages.content);
        setImageSourceUrl(URL.createObjectURL(image));
    }

    return (
        <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-col items-center justify-center flex-1 px-6 py-20 relative overflow-hidden">
                <h1 className="text-4xl md:text-6xl font-bold z-10 text-center">{message?.messages.content}</h1>
                <p className="text-muted-foreground mt-2 z-10">Sent at: {dayjs(message?.messages.createdAt).format('MMM D, YYYY h:mm A')}</p>
                <div className="mt-6 space-x-4 z-10 grid-cols-2">
                    <Button onClick={addToStory}>Add To Story</Button>
                </div>
            </div>
            <div className='flex flex-col items-center justify-center flex-1 relative overflow-hidden mb-20'>
                {imageSourceUrl && <p className='mb-4'>This is the image you are sharing:</p>}

                {/* @ts-ignore */}
                {imageSourceUrl && <Image ref={printRef} src={imageSourceUrl} width={500} height={500} alt="Question Image" />}
            </div>
        </div>
    )
}