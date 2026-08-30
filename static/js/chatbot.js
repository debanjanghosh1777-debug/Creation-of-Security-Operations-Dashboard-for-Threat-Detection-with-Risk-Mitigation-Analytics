// ===============================================
// CyberShield AI Chatbot
// Part 1/4
// ===============================================

// Elements

const chatToggle = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const closeChat = document.getElementById("close-chat");

const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const clearBtn = document.getElementById("clear-btn");

const messageInput = document.getElementById("message");

const chatBox = document.getElementById("chat-box");

const typing = document.getElementById("typing");

// ===============================================
// Open / Close Chat
// ===============================================

if(chatToggle){

    chatToggle.onclick=function(){

        if(chatWindow.style.display==="flex"){

            chatWindow.style.display="none";

        }

        else{

            chatWindow.style.display="flex";

            messageInput.focus();

        }

    };

}

if(closeChat){

    closeChat.onclick=function(){

        chatWindow.style.display="none";

    };

}

// ===============================================
// Scroll
// ===============================================

function scrollBottom(){

    chatBox.scrollTop=chatBox.scrollHeight;

}

// ===============================================
// User Message
// ===============================================

function addUserMessage(message){

    const div=document.createElement("div");

    div.className="user-message";

    div.innerHTML=message;

    chatBox.appendChild(div);

    scrollBottom();

}

// ===============================================
// Bot Message
// ===============================================

function addBotMessage(message){

    const div=document.createElement("div");

    div.className="bot-message";

    div.innerHTML=message;

    chatBox.appendChild(div);

    scrollBottom();

}
// ===============================================
// Send Message
// ===============================================

function sendMessage(){

    const message = messageInput.value.trim();

    if(message==="") return;

    addUserMessage(message);

    messageInput.value="";

    showTyping();

    fetch("/chatbot",{

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            message:message

        })

    })

    .then(response=>{

        if(!response.ok){

            throw new Error("Server Error");

        }

        return response.json();

    })

    .then(data=>{

        hideTyping();

        addBotMessage(data.reply);

    })

    .catch(error=>{

        console.error(error);

        hideTyping();

        addBotMessage("⚠ Unable to contact CyberShield AI.");

    });

}

// ===============================================
// Send Button
// ===============================================

if(sendBtn){

    sendBtn.onclick=function(){

        sendMessage();

    };

}

// ===============================================
// Enter Key
// ===============================================

if(messageInput){

    messageInput.addEventListener("keypress",function(e){

        if(e.key==="Enter"){

            e.preventDefault();

            sendMessage();

        }

    });

}

// ===============================================
// Suggestions
// ===============================================

function askSuggestion(text){

    messageInput.value=text;

    sendMessage();

}

// Make function available to HTML onclick
window.askSuggestion = askSuggestion;

// ===============================================
// Voice Recognition
// ===============================================

if (voiceBtn) {

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {

        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        voiceBtn.onclick = function () {

            voiceBtn.innerHTML = "🎙️";

            recognition.start();

        };

        recognition.onresult = function (event) {

            const transcript = event.results[0][0].transcript;

            messageInput.value = transcript;

            voiceBtn.innerHTML = "🎤";

            sendMessage();

        };

        recognition.onerror = function () {

            voiceBtn.innerHTML = "🎤";

            addBotMessage("⚠ Voice recognition failed.");

        };

        recognition.onend = function () {

            voiceBtn.innerHTML = "🎤";

        };

    } else {

        voiceBtn.onclick = function () {

            addBotMessage("⚠ Voice recognition is not supported in this browser.");

        };

    }

}

// ===============================================
// Clear Chat
// ===============================================

if (clearBtn) {

    clearBtn.onclick = function () {

        chatBox.innerHTML = "";

        addBotMessage(
            "👋 Hello! I am <b>CyberShield AI</b>.<br><br>" +
            "Ask me anything about:<br>" +
            "• Malware<br>" +
            "• Phishing<br>" +
            "• Trojans<br>" +
            "• Ransomware<br>" +
            "• SQL Injection<br>" +
            "• DDoS<br>" +
            "• Network Security"
        );

    };

}

// ===============================================
// Auto Focus
// ===============================================

if (messageInput) {

    messageInput.addEventListener("click", function () {

        this.focus();

    });

}

// ===============================================
// Auto Scroll on Load
// ===============================================

window.addEventListener("load", function () {

    scrollBottom();

});

// ===============================================
// Welcome Message
// ===============================================

document.addEventListener("DOMContentLoaded", function () {

    if (chatBox.children.length <= 1) {

        setTimeout(function () {

            addBotMessage(
                "💡 Tip: You can ask me questions like:<br><br>" +
                "• What is Malware?<br>" +
                "• Explain Phishing<br>" +
                "• How to prevent ransomware?<br>" +
                "• Explain SQL Injection<br>" +
                "• How do I secure my network?"
            );

        }, 1200);

    }

});

// ===============================================
// Typing Animation Helpers
// ===============================================

function showTyping() {

    typing.style.display = "block";

    scrollBottom();

}

function hideTyping() {

    typing.style.display = "none";

}

// ===============================================
// Keyboard Shortcut
// Ctrl + /
// ===============================================

document.addEventListener("keydown", function (e) {

    if (e.ctrlKey && e.key === "/") {

        if (chatWindow.style.display === "flex") {

            chatWindow.style.display = "none";

        } else {

            chatWindow.style.display = "flex";

            messageInput.focus();

        }

    }

});

// ===============================================
// Save Chat (Current Session)
// ===============================================

function saveChat() {

    sessionStorage.setItem("cybershield_chat", chatBox.innerHTML);

}

function loadChat() {

    const data = sessionStorage.getItem("cybershield_chat");

    if (data) {

        chatBox.innerHTML = data;

        scrollBottom();

    }

}

// Save whenever a new message is added

const originalUser = addUserMessage;

addUserMessage = function (msg) {

    originalUser(msg);

    saveChat();

};

const originalBot = addBotMessage;

addBotMessage = function (msg) {

    originalBot(msg);

    saveChat();

};

// ===============================================
// Initialize
// ===============================================

window.onload = function () {

    loadChat();

    scrollBottom();

    console.log("✅ CyberShield AI Loaded Successfully");

};
