
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

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

const connection = new TikTokLiveConnection(username, {});

connection.on(WebcastEvent.CHAT, (data) => {
  broadcast({
    type: "chat",
    nickname: data.user?.nickname || data.nickname || "Nguoi xem",
    uniqueId: data.user?.uniqueId || data.uniqueId || "",
    avatar: data.user?.profilePicture?.url || "",
    comment: data.comment || ""
  });
});

connection.on(WebcastEvent.GIFT, (data) => {
  broadcast({
    type: "gift",
    nickname: data.user?.nickname || data.nickname || "Nguoi xem",
    uniqueId: data.user?.uniqueId || data.uniqueId || "",
    avatar: data.user?.profilePicture?.url || "",
    giftName: data.giftDetails?.giftName || data.giftName || "Qua tang",
    repeatCount: data.repeatCount || 1
  });
});

connection.connect()
  .then(() => console.log("Da ket noi TikTok LIVE:", username))
  .catch((error) => console.error("Loi ket noi TikTok:", error));

const port = process.env.PORT || 10000;

server.listen(port, "0.0.0.0", () => {
  console.log("May chu dang chay tai cong " + port);
});
