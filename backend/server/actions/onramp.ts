import axios from "axios";
import QRCode from 'qrcode';

export async function generatePix(amount: string) {
  const token = process.env.TOKEN;
  console.log("TOKEN", token);
  console.log("AMOUNT", amount);

  const options = {
    method: 'GET',
    url: `https://api.brla.digital:5567/v1/business/pay-in/br-code?amount=${amount}`,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.request(options);
    const brCode = response.data.brCode;
    const qrCodeDataURL = await QRCode.toDataURL(brCode, { type: 'image/png' });
    const base64 = qrCodeDataURL.split(',')[1];

    return {
      brCode,
      base64,
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
  const token = process.env.TOKEN;

  const options = {
    method: 'POST',
    url: 'https://api.brla.digital:5567/v1/business/on-chain/transfer',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    data: params,
  };
  
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Erro na operação on-chain:', error);
    throw error;
  }
}

