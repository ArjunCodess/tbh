'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import html2canvas from 'html2canvas';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

export default function Page() {
    const [imageSourceUrl, setImageSourceUrl] = useState("");

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
        const imageUrls = [
            'https://tbh-tobehonest.vercel.app/qna1.png',
            'https://tbh-tobehonest.vercel.app/qna2.png',
            'https://tbh-tobehonest.vercel.app/qna3.png',
            'https://tbh-tobehonest.vercel.app/qna4.png'
        ];

        const randomImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

        const response = await fetch(randomImageUrl);
        const imageBlob = await response.blob();

        setImageSourceUrl(URL.createObjectURL(imageBlob));
    };

    return (
        <section className='min-h-screen w-full flex justify-center items-center flex-col'>
            <div className='pt-20 flex flex-col justify-center'>
                <h1 className='text-4xl font-bold mb-4'>TBH QNA Prompt Image</h1>
                <Button className="flex flex-row gap-x-4 ml-4" variant="outline" onClick={(e) => { e.preventDefault(); addToStory(); }}>
                    Share QNA Image Prompt<ImagePlus className="h-4 w-4" />
                </Button>
            </div>

            {imageSourceUrl && <div className='flex flex-col items-center justify-center flex-1 relative overflow-hidden my-10'>
                <p className='mb-4 text-center'>
                    This is the image you are sharing:
                    <br />
                    (click on the &apos;Share QNA Image Prompt&apos; button &quot;again&quot; to share it.)
                </p>

                {/* @ts-ignore */}
                <Image ref={printRef} src={imageSourceUrl} width={500} height={500} alt="Question Image" />

                <Separator className='mt-10' />
            </div>
            }
        </section>
    )
}