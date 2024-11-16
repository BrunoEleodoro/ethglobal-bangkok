import { checkBlacklist, removeFromBlacklist, addToBlacklist, getThreadId, saveThreadAssociation, saveSmartWalletAssociation } from "../../services/database";
import { createThread, processMessage } from "../../services/openai";
import { sendWhatsAppMessage } from "../../services/whatsapp";
import { createSmartAccount } from "../../actions/biconomy-create-wallet";

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const JWT_TOKEN = process.env.JWT_TOKEN;
const BOT_NAME = process.env.BOT_NAME;

export default eventHandler(async (event) => {
    const body = await readBody(event);
    const keyRemoteJid = body.data.keyRemoteJid;
    const msg = typeof body.data.content === "string" ? body.data.content : body.data.content.text;

    // Early returns for special cases
    if (keyRemoteJid === "status@broadcast") return { res: "transmission list" };
    if (body.data.messageType !== "conversation" && body.data.messageType !== "extendedTextMessage") {
        return { res: "not string" };
    }

    // Check blacklist
    const blacklistCheckResult = await checkBlacklist(keyRemoteJid);
    if (blacklistCheckResult.rowCount > 0) {
        const blacklistedAt = blacklistCheckResult.rows[0].blacklisted_at;
        const timeDiff = Date.now() - new Date(blacklistedAt).getTime();
        const twoHours = 2 * 60 * 60 * 1000;

        if (false) { // Note: keeping your original logic
            await removeFromBlacklist(keyRemoteJid);
        } else {
            return { res: "This number is blacklisted." };
        }
    }

    if (body.data.keyFromMe && blacklistCheckResult.rowCount === 0) {
        await addToBlacklist(keyRemoteJid);
        return { res: "Number blacklisted." };
    }

    // Get or create thread
    const queryResult = await getThreadId(keyRemoteJid);
    let threadId;
    let newUser = false;

    if (queryResult.rowCount > 0) {
        threadId = queryResult.rows[0].thread_id;
    } else {
        const thread = await createThread(msg, keyRemoteJid);
        threadId = thread.id;
        await saveThreadAssociation(keyRemoteJid, threadId);
        newUser = true;
    }

    if(newUser) {
        const smartAccount = await createSmartAccount();
        await saveSmartWalletAssociation(threadId, keyRemoteJid, smartAccount);
    }

    // Process message with OpenAI
    const lastMessageForRun = await processMessage(
        threadId,
        ASSISTANT_ID,
        newUser ? msg + " - metadata: " + body.data : msg
    );

    // Send WhatsApp response
    const responseText = lastMessageForRun.content[0].text.value;
    try {
        let finalConfirmation = JSON.parse(responseText);
        console.log(finalConfirmation);
    } catch(ex) {
        console.log(ex);
    }

    const response = await sendWhatsAppMessage(keyRemoteJid, responseText, BOT_NAME, JWT_TOKEN);
    console.log("a", response.data);
    
    return { nitro: "Is Awesome!", body };
});