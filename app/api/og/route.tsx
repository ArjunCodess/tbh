import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const question = searchParams.get('question');

    try {
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: 'linear-gradient(to bottom, black, #0f172b)',
                        textAlign: 'center',
                    }}
                >
                    <div tw="flex flex-col w-full h-full pt-60 items-center">
                        <div tw="rounded-lg bg-white text-black shadow-sm w-full max-w-md overflow-hidden flex flex-col border border-neutral-950" style={{
                            border: '1px solid gray',
                        }}>
                            <div tw="flex bg-black text-white justify-center" style={{
                                backgroundImage: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                            }}>
                                <h2 tw="text-2xl">q&a</h2>
                            </div>
                            <div tw="flex p-5 justify-center text-2xl">
                                <p>{question || "Error. Please try again."}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 720,
                height: 1480,
            }
        )
    }

    catch (error: any) {
        console.log(error);
    }
}