import { polygon } from "viem/chains";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";

const bundlerUrl = `https://bundler.biconomy.io/api/v2/${process.env.CHAIN_ID}/E6qHRjNsR.f48951d9-b86c-4632-aa06-2997c7f39835`;
const paymasterUrl = `https://paymaster.biconomy.io/api/v1/137/E6qHRjNsR.f48951d9-b86c-4632-aa06-2997c7f39835`;

export const USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const names = {
    [USDC]: "USDC",
    [ETH]: "ETH",
}

export const createSmartAccount = async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(`${privateKey as `0x${string}`}`);
    const client = createWalletClient({
        account,
        chain: polygon,
        transport: http(),
    });
    const smartAccount = await createSmartAccountClient({
        signer: client,
        bundlerUrl,
        paymasterUrl,
    });
    const saAddress = await smartAccount.getAccountAddress();
    console.log("SA Address", saAddress);
    return { smartAccount, saAddress, privateKey };
}

export const getSmartAccountBalances = async (privateKey: string) => {
    const account = privateKeyToAccount(`${privateKey as `0x${string}`}`);
    const client = createWalletClient({
        account,
        chain: polygon,
        transport: http(),
    });
    const smartAccount = await createSmartAccountClient({
        signer: client,
        bundlerUrl,
    });
    const balances = await smartAccount.getBalances([USDC]);
    const balancesFormatted = balances.map((balance) => {
        return `${names[balance.address]}: ${balance.formattedAmount}`;
    });
    return balancesFormatted;
}

export const proposeTransactions = async (privateKey: string, txs: any[]) => {

    // Generate EOA from private key using ethers.js
    const account = privateKeyToAccount(`${privateKey as `0x${string}`}`);
    const client = createWalletClient({
        account,
        chain: polygon,
        transport: http(),
    });

    // Create Biconomy Smart Account instance
    const smartWallet = await createSmartAccountClient({
        signer: client,
        bundlerUrl,
        paymasterUrl,
        biconomyPaymasterApiKey: "E6qHRjNsR.f48951d9-b86c-4632-aa06-2997c7f39835",
    });

    const saAddress = await smartWallet.getAccountAddress();
    console.log("SA Address", saAddress);

    // Send the transaction and get the transaction hash
    const userOpResponse = await smartWallet.sendTransaction(txs, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    });
    const { transactionHash } = await userOpResponse.waitForTxHash();
    console.log("Transaction Hash", transactionHash);
    const userOpReceipt = await userOpResponse.wait();
    if (userOpReceipt.success == "true") {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
    }
    return transactionHash;
    //  const hash = await nexusClient.sendTransaction({
    //   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`,
    //     value: parseEther('0'),
    //     kzg: null,
    // })  
}