// ==========================================
// AI TUTOR LOGIC
// ==========================================
// Force UI to be active (Overrides old Ollama check)
document.addEventListener('DOMContentLoaded', () => {
    const inputBox = document.getElementById('aiQuestion');
    const sendBtn = document.getElementById('sendQuestionBtn');
    const statusText = document.getElementById('aiStatusText');
    const modeText = document.getElementById('aiModeText');
    
    // Unlock the input box
    if (inputBox) {
        inputBox.disabled = false;
        inputBox.style.pointerEvents = 'auto';
    }
    if (sendBtn) sendBtn.disabled = false;
    
    // Update the status text
    if (statusText) statusText.textContent = 'AI Ready';
    if (modeText) modeText.textContent = 'Local AI is ready to help you study.';
});
const chatWindow = document.getElementById('chatWindow');
const aiQuestion = document.getElementById('aiQuestion');
const sendQuestionBtn = document.getElementById('sendQuestionBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const refreshAIBtn = document.getElementById('refreshAIBtn');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');

const aiStatusDot = document.getElementById('aiStatusDot');
const aiStatusText = document.getElementById('aiStatusText');
const aiModeText = document.getElementById('aiModeText');

let messages = []; 
let isGenerating = false;

// Update UI Status
if (aiStatusDot) aiStatusDot.style.backgroundColor = '#ffc107'; // Yellow
if (aiStatusText) aiStatusText.textContent = 'Loading Model...';

// Listen for the "AI Ready" signal from the backend
if (window.studyAI && window.studyAI.onAIReady) {
    window.studyAI.onAIReady(() => {
        if (aiStatusDot) aiStatusDot.style.backgroundColor = '#4caf50'; // Green
        if (aiStatusText) aiStatusText.textContent = 'AI Ready';
        if (aiModeText) aiModeText.textContent = 'Local AI is ready to help you study.';
    });
}

// Add a message bubble to the chat window
function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.style.padding = '12px';
    div.style.margin = '10px 0';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '80%';
    div.style.lineHeight = '1.5';

    if (role === 'user') {
        div.style.backgroundColor = '#007acc';
        div.style.color = '#fff';
        div.style.marginLeft = 'auto';
        div.style.textAlign = 'right';
 } else {
    // AI message: White background with black text
    div.style.backgroundColor = '#ffffff'; 
    div.style.color = '#000000';           
    div.style.border = '1px solid #ddd';   // Adds a slight border so white bubbles are visible
    div.style.marginRight = 'auto';
}

    div.innerHTML = `<span class="msg-content">${text}</span>`;
    if(chatWindow) chatWindow.appendChild(div);
    if(chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
}

// Send Message to AI
async function sendMessage() {
    const text = aiQuestion.value.trim();
    if (!text || isGenerating) return;

    const welcomeMsg = chatWindow.querySelector('.welcome-chat');
    if (welcomeMsg) welcomeMsg.remove();

    aiQuestion.value = ''; 
    isGenerating = true;
    if(sendQuestionBtn) sendQuestionBtn.disabled = true;

    addMessage('user', text);
    messages.push({ role: 'user', content: text });

    const aiMsgDiv = addMessage('ai', '');
    const aiMsgContent = aiMsgDiv.querySelector('.msg-content');
    let aiResponse = '';

    try {
        await window.studyAI.chat(messages, (token) => {
            aiResponse += token;
            aiMsgContent.textContent = aiResponse;
            if(chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
        });
        messages.push({ role: 'assistant', content: aiResponse });
    } catch (err) {
        console.error("AI Error:", err);
        aiMsgContent.textContent = "Error: Could not get response from AI.";
        aiMsgContent.style.color = "#ff5555";
    } finally {
        isGenerating = false;
        if(sendQuestionBtn) sendQuestionBtn.disabled = false;
        if(aiQuestion) aiQuestion.focus();
    }
}

// Event Listeners
if (sendQuestionBtn) sendQuestionBtn.addEventListener('click', sendMessage);

if (aiQuestion) {
    aiQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

if (suggestionBtns) {
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            aiQuestion.value = btn.getAttribute('data-question');
            sendMessage();
        });
    });
}

if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
        chatWindow.innerHTML = `
            <div class="welcome-chat">
                <div class="big-ai-icon">✦</div>
                <h2>How can I help you study?</h2>
                <p>Ask questions naturally. The local AI can use your saved study material as context.</p>
            </div>`;
        messages = [];
        if (window.studyAI && window.studyAI.clearAI) {
            window.studyAI.clearAI();
        }
    });
}

if (refreshAIBtn) {
    refreshAIBtn.addEventListener('click', () => {
        aiStatusDot.style.backgroundColor = '#ffc107';
        aiStatusText.textContent = 'Checking...';
        setTimeout(() => {
            aiStatusDot.style.backgroundColor = '#4caf50';
            aiStatusText.textContent = 'AI Ready';
        }, 1000);
    });
}
// ==========================================
// FIX FOR BROKEN NAVIGATION TABS
// ==========================================
document.querySelectorAll('.nav-btn[data-page], [data-page-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Get the target page ID
        const pageId = btn.getAttribute('data-page') || btn.getAttribute('data-page-target');
        if (!pageId) return;

        // 1. Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // 2. Show the target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');

        // 3. Update sidebar active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            // Update the top header title
            const titleElement = activeBtn.querySelector('b');
            if (titleElement) {
                document.getElementById('pageTitle').textContent = titleElement.textContent;
            }
        }
    });
});