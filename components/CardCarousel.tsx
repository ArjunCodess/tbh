"use client";

import Image from "next/image";
import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function CardCarousel() {
    const cards = data.map((card, index) => (
        <Card key={card.src} card={card} index={index} />
    ));

    return <Carousel items={cards} />
}

const Content0 = () => {
    return (
        <>
            <>
                <div
                    key={"content" + data[0].index}
                    className="p-8 md:p-14 rounded-3xl"
                >
                    <Image
                        src={data[0].src}
                        alt="image"
                        height="500"
                        width="500"
                        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain rounded-xl"
                    />
                </div>
            </>
        </>
    );
};

const Content1 = () => {
    return (
        <>
            <>
                <div
                    key={"content" + data[1].index}
                    className="p-8 md:p-14 rounded-3xl"
                >
                    <Image
                        src={data[1].src}
                        alt="image"
                        height="500"
                        width="500"
                        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain rounded-xl"
                    />
                </div>
            </>
        </>
    );
};

const Content2 = () => {
    return (
        <>
            <>
                <div
                    key={"content" + data[2].index}
                    className="p-8 md:p-14 rounded-3xl"
                >
                    <Image
                        src={data[2].src}
                        alt="image"
                        height="500"
                        width="500"
                        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain rounded-xl"
                    />
                </div>
            </>
        </>
    );
};

const Content3 = () => {
    return (
        <>
            <>
                <div
                    key={"content" + data[3].index}
                    className="p-8 md:p-14 rounded-3xl"
                >
                    <Image
                        src={data[3].src}
                        alt="image"
                        height="500"
                        width="500"
                        className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain rounded-xl"
                    />
                </div>
            </>
        </>
    );
};

const data = [
    {
        index: 1,
        category: "uncover the truth",
        title: "play q&a games.",
        src: "/card1.jfif",
        content: <Content0 />,
    },
    {
        index: 2,
        category: "get to know",
        title: "about your friends.",
        src: "/card4.jfif",
        content: <Content1 />,
    },
    {
        index: 3,
        category: "flood your inbox",
        title: "its just like magic.",
        src: "/card2.jfif",
        content: <Content2 />,
    },
    {
        index: 4,
        category: "be honest",
        title: "speak freely.",
        src: "/card3.jfif",
        content: <Content3 />,
    },
];
