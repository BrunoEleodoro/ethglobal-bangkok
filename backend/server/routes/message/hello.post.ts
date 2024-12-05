import { checkBlacklist, removeFromBlacklist, addToBlacklist, getThreadId, saveThreadAssociation, saveSmartWalletAssociation, getSmartWalletAssociation } from "../../services/database";
import { normalize } from 'viem/ens'
import { createThread, processMessage } from "../../services/openai";
import { sendWhatsAppMedia, sendWhatsAppMessage } from "../../services/whatsapp";
import { getSmartAccountBalances, createSmartAccount, proposeTransactions, USDC, reverseNames, BRLA } from "../../actions/biconomy";
import { createPublicClient, encodeFunctionData, erc20Abi, parseEther } from "viem";
import { http, } from "viem";
import { mainnet } from "viem/chains";
import { parseUnits } from "viem";
import { generatePix, onchainTransfer } from "../../actions/onramp";
import { uploadBase64File } from "../../services/s3-aws";
import { getSwapQuote } from "../../actions/swap-tokens";

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const JWT_TOKEN = process.env.JWT_TOKEN;
const BOT_NAME = process.env.BOT_NAME;

export const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
})

export default eventHandler(async (event) => {
    const body = await readBody(event);
    const keyRemoteJid = body.data.keyRemoteJid;
    let msg = typeof body.data.content === "string" ? body.data.content : body.data.content.text;

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
    let walletAddress;
    let privateKey;
    let newUser = false;

    if (queryResult.rowCount > 0) {
        threadId = queryResult.rows[0].thread_id;
        const smartWalletAssociation = await getSmartWalletAssociation(threadId);
        walletAddress = smartWalletAssociation.rows[0].wallet_address;
        privateKey = smartWalletAssociation.rows[0].private_key;
    } else {
        const thread = await createThread(msg, keyRemoteJid);
        threadId = thread.id;
        await saveThreadAssociation(keyRemoteJid, threadId);
        newUser = true;
    }

    if (newUser) {
        const smartAccount = await createSmartAccount();
        await saveSmartWalletAssociation(keyRemoteJid, threadId, smartAccount.saAddress, smartAccount.privateKey);
        privateKey = smartAccount.privateKey;
    }
    const balances = await getSmartAccountBalances(privateKey);
    console.log("balances", balances);
    msg += `\n[User info]\nWallet address: ${walletAddress} \n Balances: ${balances}`;
    // Process message with OpenAI
    const lastMessageForRun = await processMessage(
        threadId,
        ASSISTANT_ID,
        msg
    );


    // Send WhatsApp response
    const responseText = lastMessageForRun.content[0].text.value;
    try {
        console.log("FINAL CONFIRMATION, letss goo");
        let finalConfirmation = JSON.parse(responseText);
        if (finalConfirmation.action && finalConfirmation.action === "pix") {
            const pix = await generatePix(finalConfirmation.amount);
            const timestamp = Date.now();
            const imageUrl = await uploadBase64File(pix.base64, `pix-${timestamp}.png`, "image/png");
            console.log("imageUrl", imageUrl);
            await sendWhatsAppMessage(keyRemoteJid, pix.brCode, BOT_NAME, JWT_TOKEN);
            await sendWhatsAppMedia(keyRemoteJid, imageUrl, BOT_NAME, JWT_TOKEN);
            setTimeout(async () => {
                await onchainTransfer({
                    "chain": "Polygon",
                    "inputCoin": "BRLA",
                    "outputCoin": "BRLA",
                    "to": walletAddress,
                    "value": parseInt(finalConfirmation.amount) * 100
                });
                await sendWhatsAppMessage(keyRemoteJid, `checking onchain transfer...`, BOT_NAME, JWT_TOKEN);
            }, 80000);
            return;
        }
        let swap = []
        if (finalConfirmation.action && finalConfirmation.action === "swap") {
            
        }
        const transferItems = finalConfirmation.batchTransactions.filter((item: any) => item.action === 'transfer');
        const ensAddresses = await Promise.all(
            transferItems.map(async (item: any) => {
                return await publicClient.getEnsAddress({
                    name: normalize(item.to),
                });
            })
        );

        const swaps = finalConfirmation.batchTransactions.filter((item: any) => item.action === 'swap');
        const swapCalls = await Promise.all(swaps.map(async (item: any) => {
            const swapQuote = await getSwapQuote({
                fromChain: 137,
                toChain: 137,
                fromToken:reverseNames[item.fromToken],
                toToken: reverseNames[item.toToken],
                fromAddress: walletAddress,
                fromAmount: parseUnits(item.fromAmount, 18).toString()
            });
            console.log("swapQuote", swapQuote);
            return [{
                to: USDC,
                data: encodeApproveData(swapQuote.transactionRequest.to, item.fromAmount, 18),
                nonce: 0
            },{
                to: swapQuote.transactionRequest.to,
                data: swapQuote.transactionRequest.data,
                value: parseEther('0'),
                gasLimit: swapQuote.transactionRequest.gasLimit,
                gasPrice: swapQuote.transactionRequest.gasPrice,
            }]
        }));

        // Modified to create USDC transfer calls
        const calls = transferItems.map((item: any, index) => ({
            to: reverseNames[item.asset], // USDC contract address
            data: encodeTransferData(ensAddresses[index], item.amount, item.decimals),
            value: parseEther('0'), // No ETH value for ERC20 transfers
        })).concat(...swapCalls);

        console.log(calls);
        const transactionHash = await proposeTransactions(privateKey, calls);
        await sendWhatsAppMessage(keyRemoteJid, `Transaction sent https://polygon.blockscout.com/tx/${transactionHash}`, BOT_NAME, JWT_TOKEN);
        console.log(finalConfirmation);
    } catch (ex) {
        console.log("error", ex);
        console.log("not final confirmation");
        const response = await sendWhatsAppMessage(keyRemoteJid, responseText, BOT_NAME, JWT_TOKEN);
        console.log("a", response.data);
    }

    return { nitro: "Is Awesome!", body };
});
// Helper functions to encode transfer and approve data
function encodeTransferData(to: string, amount: string, decimals: number) {
    // USDC has 6 decimals
    const value = parseUnits(amount, decimals);

    // Encode the transfer function call
    // transfer(address,uint256) function signature: 0xa9059cbb
    return `0xa9059cbb${to.slice(2).padStart(64, '0')}${value.toString(16).padStart(64, '0')}`;
}

function encodeApproveData(spender: string, amount: string, decimals: number) {
    // Convert amount to proper decimals
    // const value = parseUnits(amount, decimals);
    const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseUnits(amount, decimals)]
      })
      return data;
    // // Encode the approve function call
    // // approve(address,uint256) function signature: 0x095ea7b3
    // return `0x095ea7b3${spender.slice(2).padStart(64, '0')}${value.toString(16).padStart(64, '0')}`;
}