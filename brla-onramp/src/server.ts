import fastify from "fastify";
import cors from "@fastify/cors";
import axios from "axios";
import dotenv from 'dotenv';
import QRCode from 'qrcode';

dotenv.config();

const app = fastify();

app.register(cors, {
  origin: "*", // == true
});

app.get("/", async (request, reply) => {
  return { hello: "world" };
});

app.get('/generate-pix', async (request, reply) => {
  const { amount } = request.query as { amount: string };

  const token = process.env.TOKEN;
  
  const options = {
    method: 'GET',
    url: `https://api.brla.digital:5567/v1/business/pay-in/br-code`,
    params: { amount },
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
    reply.status(500).send({ error: 'Erro ao gerar o código Pix' });
  }
});

app.post('/onchain-transfer', async (request, reply) => {
  const { chain, inputCoin, outputCoin, to, value } = request.body as {
    chain: string; inputCoin: string; outputCoin: string; to: string; value: number
  };

  const token = process.env.TOKEN;

  const options = {
    method: 'POST',
    url: 'https://api.brla.digital:5567/v1/business/on-chain/transfer',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    data: {
      chain,
      inputCoin,
      outputCoin,
      to,
      value
    },
  };
  
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Erro na operação on-chain:', error);
  }
});

app.listen({ port: 3333 }).then(() => {
  console.log(`Server is running on port 3333`);
});