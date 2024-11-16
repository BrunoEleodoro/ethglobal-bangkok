import {
    Hex,
    createWalletClient,
    encodeFunctionData,
    http,
    parseAbi,
    zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createSmartAccountClient } from "@biconomy/account";

const bundlerUrl = `https://bundler.biconomy.io/api/v3/${process.env.CHAIN_ID}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44`;

export const createSmartAccount = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
  const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(`EOA address: ${eoa}`);

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client,
    bundlerUrl,
  });
  smartAccount.getBalances();
  const saAddress = await smartAccount.getAccountAddress();
  console.log("SA Address", saAddress);

  return saAddress;
};
