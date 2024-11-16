import axios from "axios";

export async function sendWhatsAppMessage(number: string, text: string, botName: string, jwtToken: string) {
    const data = JSON.stringify({
        number: number,
        options: {
            delay: 1200,
            presence: "composing",
        },
        textMessage: {
            text: text,
        },
    });

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `http://127.0.0.1:8084/message/sendText/${botName}`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
        },
        data: data,
    };

    return await axios.request(config);
}

export async function sendWhatsAppMedia(
    number: string,
    mediaUrl: string,
    botName: string,
    jwtToken: string,
) {
    const data = JSON.stringify({
        number: number,
        mediaMessage: {
            mediatype: 'image',
            media: mediaUrl
        }
    });

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `http://127.0.0.1:8084/message/sendMedia/${botName}`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
        },
        data: data,
    };

    return await axios.request(config);
}
