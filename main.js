const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let llamaSession = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadFile("index.html");
}

async function initAI() {
const isDev = !app.isPackaged;
let modelPath;

if (isDev) {
    // In development (npm start)
    modelPath = path.join(__dirname, "models", "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf");
} else {
    // In production (installed app). The models folder is in the resources directory.
    modelPath = path.join(process.resourcesPath, "models", "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf");
}
    console.log("Loading AI Model in Electron... Please wait.");
    try {
        const { getLlama, LlamaChatSession } = await import("node-llama-cpp");
        const llama = await getLlama({ gpu: false });
        const model = await llama.loadModel({ modelPath });
       const context = await model.createContext();
llamaSession = new LlamaChatSession({ 
    contextSequence: context.getSequence(),
    systemPrompt: "You are a helpful study tutor. Answer simply and briefly."
});
        
        console.log("AI Model loaded successfully in Electron! ✅");
        // Tell the UI the AI is ready
        if (mainWindow) mainWindow.webContents.send("ai-ready");
    } catch (error) {
        console.error("Failed to load AI model:", error);
    }
}

ipcMain.on("ask-ai", async (event, { id, messages }) => {
    if (!llamaSession) {
        event.sender.send("ai-token", { id, token: "AI is still loading. Please wait...", done: true });
        return;
    }

    const lastMessage = messages[messages.length - 1].content;

    try {
        await llamaSession.prompt(lastMessage, {
            onTextChunk: (chunk) => {
                event.sender.send("ai-token", { id, token: chunk, done: false });
            }
        });
        event.sender.send("ai-token", { id, done: true });
    } catch (error) {
        console.error("AI Error:", error);
        event.sender.send("ai-token", { id, token: "\n[Error generating response]", done: true });
    }
});

// Handle clearing the AI's memory
ipcMain.on("clear-ai", async () => {
    if (llamaSession) {
        const { LlamaChatSession } = await import("node-llama-cpp");
        // We need to keep the context to create a new session
        const context = llamaSession.contextSequence?.context || llamaSession._context;
        if (context) {
             llamaSession = new LlamaChatSession({ contextSequence: context.getSequence() });
             console.log("AI Chat Memory Cleared! 🧹");
        }
    }
});

app.whenReady().then(async () => {
    createWindow();
    await initAI();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});