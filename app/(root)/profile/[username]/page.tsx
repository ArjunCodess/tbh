import MessageForm from "@/components/MessageForm"

export async function generateMetadata({ params }: { params: { username: string } }) {
  return {
    title: `Send an anonymous message to @${params.username}`,
    description: `Write and send an anonymous message to @${params.username}. Your message will be delivered privately.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params;

  return (
    <main className="min-h-[calc(100dvh-0px)] w-full px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 md:p-8">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Send an anonymous message</h1>
            <p className="mt-1 text-sm text-muted-foreground">to @{username}</p>

            <div className="mt-6">
              <MessageForm username={username} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}