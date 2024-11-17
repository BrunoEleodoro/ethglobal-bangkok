export async function getSwapQuote(params: {
  fromChain: number,
  toChain: number, 
  fromToken: string,
  toToken: string,
  fromAddress: string,
  fromAmount: string
}) {
//   const url = `https://li.quest/v1/quote?fromChain=${params.fromChain}&toChain=${params.toChain}&fromToken=${params.fromToken}&toToken=${params.toToken}&fromAddress=${params.fromAddress}&fromAmount=${params.fromAmount}`;
const url = `https://li.quest/v1/quote?fromChain=137&toChain=137&fromToken=0xE6A537a407488807F0bbeb0038B79004f19DDDFb&toToken=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&fromAddress=${params.fromAddress}&fromAmount=1000000000000000`;

    console.log(url);
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  };
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log("data", data);
    return data;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error;
  }
}