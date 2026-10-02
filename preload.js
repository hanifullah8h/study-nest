const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("studyAI", {
    chat: (messages, onToken) => {
        const id = Date.now() + Math.random();
        return new Promise((resolve) => {
            const handler = (_event, data) => {
                if (data.id !== id) return;
                if (data.token !== undefined) onToken(data.token);
                if (data.done) {
                    ipcRenderer.removeListener("ai-token", handler);
                    resolve();
                }
            };
            ipcRenderer.on("ai-token", handler);
            ipcRenderer.send("ask-ai", { id, messages });
        });
    },
    onAIReady: (callback) => ipcRenderer.on("ai-ready", () => callback()),
    clearAI: () => ipcRenderer.send("clear-ai")
});