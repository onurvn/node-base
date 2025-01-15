const express = require("express");
const Enum = require("../config/Enum");
const router = express.Router();
const emitter = require("../lib/Emitter");

emitter.addEmitter("notifications");

router.get("/", async (req, res) => {
    res.writeHead(Enum.HTTP_CODES.OK, {
        "content-type": "text/event-stream",
        "connection": "keep-alive",
        "cache-control": "no-cache,no-transform"
    });

    const listener = (data) => {
        res.write("data:" + JSON.stringify(data) + "\n\n");
    }

    emitter.getEmitter("notifications").on("messages", listener);

    req.on("close", () => {
        emitter.getEmitter("notifications").off("messages", listener);
    });
})

module.exports = router;