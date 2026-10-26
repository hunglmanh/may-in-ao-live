import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import {
  TikTokLiveConnection,
  WebcastEvent
} from "tiktok-live-connector";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.redirect("/printer.html");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(process.cwd()));

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

const username = (
  process.env.TIKTOK_USERNAME || "hehevuimaban"
).replace(/^@/, "");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function registerEvents(connection) {
  connection.on(WebcastEvent.CHAT, (data) => {
    broadcast({
      type: "chat",
      nickname:
        data.user?.nickname || data.nickname || "Nguoi xem",
      uniqueId:
        data.user?.uniqueId || data.uniqueId || "",
      avatar:
        data.user?.profilePicture?.url || "",
      comment: data.comment || ""
    });
  });

  connection.on(WebcastEvent.GIFT, (data) => {
    broadcast({
      type: "gift",
      nickname:
        data.user?.nickname || data.nickname || "Nguoi xem",
      uniqueId:
        data.user?.uniqueId || data.uniqueId || "",
      avatar:
        data.user?.profilePicture?.url || "",
      giftName:
        data.giftDetails?.giftName ||
        data.giftName ||
        "Qua tang",
      repeatCount: data.repeatCount || 1
    });
  });
}

async function connectTikTokWithRetry() {
  while (true) {
    const connection = new TikTokLiveConnection(
      username,
      {}
    );

    registerEvents(connection);

    try {
      console.log(
        "Dang thu ket noi TikTok LIVE:",
        username
      );

      await connection.connect();

      console.log(
        "Da ket noi TikTok LIVE:",
        username
      );

      return;
    } catch (error) {
      console.error(
        "Loi ket noi TikTok:",
        error?.message || error
      );

      console.log(
        "Se thu ket noi lai sau 30 giay."
      );

      await sleep(30000);
    }
  }
}

const port = process.env.PORT || 10000;

server.listen(port, "0.0.0.0", () => {
  console.log(
    "May chu dang chay tai cong " + port
  );

  connectTikTokWithRetry().catch((error) => {
    console.error(
      "Loi khoi dong ket noi TikTok:",
      error?.message || error
    );
  });
});