import { ArrowDown, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SparklesText from "@/components/magicui/sparkles-text";

export default function Hero() {
    return (
        <main className="bg-neutral-950">
            <div className="rounded-3xl py-20 sm:py-30 md:py-40 h-[90vh] flex flex-col items-center justify-center text-center bg-linear-to-tr from-yellow-500 via-orange-500 to-violet-500 mx-3 md:mx-5">
                <div className="max-w-5xl">
                    <SparklesText text="real friends." className="text-5xl sm:text-7xl md:text-9xl text-white" />
                    <SparklesText text="real fun!" className="text-5xl sm:text-7xl md:text-9xl text-white" />
                </div>

                <button className="cursor-default bg-transparent absolute bottom-20 animate-bounce rounded-full border-transparent"><ArrowDown height={30} width={30} /></button>
            </div>
            <div className="py-20 sm:py-30 md:py-40 max-w-5xl mx-auto">
                <div className="m-auto flex h-full w-full flex-col gap-8 px-4 py-4 md:px-6 md:py-10 text-center">
                    <h1 style={{ lineHeight: 1.5 }} className="text-3xl font-extrabold tracking-tight md:text-6xl text-white">
                        not just a{" "}
                        <Image
                            className="my-auto -mt-3 inline w-16 md:-mt-6 md:w-32"
                            width={100}
                            height={100}
                            src="/ngl.link.PNG"
                            alt="NGL Link Logo"
                        />{" "}
                        clone — this is{" "}
                        <Image
                            className="my-auto -mt-3 inline w-16 md:-mt-6 md:w-36 sm:w-28"
                            width={100}
                            height={100}
                            src="/tbh.png"
                            alt="Special Image Capabilities"
                        />{" "}
                        just better!
                    </h1>
                    <div className="md:w-11/12 flex md:flex-row flex-col md:space-x-5 space-y-3 md:space-y-0 space-x-0 w-full mx-auto">
                        <Link href={"/sign-up"} className="md:w-1/2 md:text-base bg-linear-to-tr from-yellow-500 via-orange-500 to-violet-500 rounded-full">
                            <button className="h-10 px-4 py-2 text-white">
                                Create an account <ArrowRight className="w-5 h-5 inline" />
                            </button>
                        </Link>
                        <Link href={"/dashboard"} className="border md:w-1/2 md:text-base rounded-full">
                            <button className="h-10 px-4 py-2 text-white">
                                Go to your dashboard <ArrowRight className="w-5 h-5 inline" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};