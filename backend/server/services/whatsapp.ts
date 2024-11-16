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
    mediaPath: string,
    caption: string,
    mediatype: string,
    botName: string,
    jwtToken: string,
) {
    // Fetch the media file and convert to base64
    const response = await axios.get(mediaPath, { responseType: 'arraybuffer' });
    const base64Media = Buffer.from(response.data, 'binary').toString('base64');
    
    const formData = new FormData();
    formData.append('number', number);
    formData.append('caption', caption);
    formData.append('attachment', base64Media);
    formData.append('mediatype', mediatype);
    formData.append('presence', 'composing');
    formData.append('delay', '1200');

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `http://127.0.0.1:8084/message/sendMediaFile/${botName}`,
        headers: {
            Authorization: `Bearer ${jwtToken}`,
        },
        data: formData,
    };

    return await axios.request(config);
}
