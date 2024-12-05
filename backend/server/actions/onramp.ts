import axios from "axios";
import QRCode from 'qrcode';

const baseURL = 'https://hopper-onramp-jl29xec9g-thiagorochatrs-projects.vercel.app';

export async function generatePix(amount: string) {
  try {
    const response = await axios.get(`${baseURL}/generate-pix`, {
      params: { amount }
    });

    return {
      brCode: response.data.brCode,
      base64: response.data.base64
    };
  } catch (error) {
    console.error('Erro ao gerar o QR Code:', error);
    throw new Error('Erro ao gerar o código Pix');
  }
}

export async function onchainTransfer(params: {
  chain: string;
  inputCoin: string;
  outputCoin: string;
  to: string;
  value: number;
}) {
  try {
    const response = await axios.post(`${baseURL}/onchain-transfer`, params);
    return response.data;
  } catch (error) {
    console.error('Erro na operação on-chain:', error);
    throw error;
  }
}
