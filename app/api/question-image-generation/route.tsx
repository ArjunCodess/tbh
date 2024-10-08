import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const font = fetch(new URL('../../../public/FONT.ttf', import.meta.url)).then(
    (res) => res.arrayBuffer()
)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question');

    const fontData = await font;

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
                        fontFamily: 'BricolageGrotesque',
                        textAlign: 'center',
                    }}
                >
                    <div tw="flex flex-col w-full h-full pt-60 items-center">
                        <div tw="rounded-lg bg-white text-black shadow-sm w-full max-w-md overflow-hidden flex flex-col" style={{
                            border: '1px solid gray',
                        }}>
                            <div tw="flex bg-black text-white justify-center" style={{
                                backgroundImage: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                            }}>
                                <h2 tw="text-2xl">q&a</h2>
                            </div>
                            <div tw="flex p-5 justify-center text-2xl">
                                <p>{question ? question : "Error. Please try again."}</p>
                            </div>
                        </div>
                        <img
                            alt="Vercel"
                            width={250}
                            height={150}
                            src="https://tbh-tobehonest.vercel.app/tbh.png"
                            tw='absolute bottom-60'
                        />
                        <p tw="text-xl absolute bottom-98 text-white">built by @arjuncodess</p>
                        <p tw="text-xl absolute bottom-90 text-white">https://tbh-link.vercel.app/</p>
                    </div>
                </div>
            ),
            {
                width: 720,
                height: 1480,
                emoji: 'noto',
                fonts: [
                    {
                        name: 'Bricolage Grotesque',
                        data: fontData,
                        style: 'normal',
                    },
                ],
            }
        )
    }

    catch (error: any) {
        console.log(error);
    }
}