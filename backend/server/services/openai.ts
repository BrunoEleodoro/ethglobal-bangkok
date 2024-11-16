import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function createThread(message: string, userId: string) {
    return await openai.beta.threads.create({
        messages: [
            {
                role: "user",
                content: message,
            },
        ],
        metadata: {
            user_id: userId,
        },
    });
}

export async function processMessage(threadId: string, assistantId: string, message: string) {
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
    });

    // Create and monitor run
    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

    while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get messages
    const messages = await openai.beta.threads.messages.list(threadId);
    return messages.data
        .filter(message => message.run_id === run.id && message.role === "assistant")
        .pop();
} 