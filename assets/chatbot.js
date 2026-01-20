const API_LLM_BASE = "https://text.pollinations.ai/";

const HISTORY_KEY = "chat_history";     // semua chat
const SUMMARY_KEY = "chat_summary";     // ringkasan penting
const SHORT_MEMORY = 4;                 // chat terakhir (ringan)

// ============================
// LOAD CHAT SAAT HALAMAN DIBUKA
// ============================
$(document).ready(function () {
  const history = loadHistory();
  history.forEach(m => appendChat(m.role, m.content));
  scrollChat();
});

// ============================
// EVENT LISTENER
// ============================
$("#send").on("click", sendMessage);

$("#prompt").on("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 🔴 CLEAR CHAT BUTTON
$("#clear").on("click", function () {
  // hapus UI
  $("#chatBox").html(`
    <div class="chat ai">
      <div class="bubble">
        Halo 👋  
        Saya siap membantu. Silakan ketik pertanyaan Anda.
      </div>
    </div>
  `);

  // hapus memory
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(SUMMARY_KEY);

  // reset input
  $("#prompt").val("").focus();
});

// ============================
// SEND MESSAGE
// ============================
function sendMessage() {
  const prompt = $("#prompt").val().trim();
  if (!prompt) return;

  appendChat("user", prompt);
  saveHistory("user", prompt);
  updateSummary(prompt);

  $("#prompt").val("");
  scrollChat();

  const aiId = "ai-" + Date.now();
  $("#chatBox").append(`
    <div class="chat ai">
      <div class="bubble" id="${aiId}">AI sedang mengetik...</div>
    </div>
  `);

  const contextPrompt = buildOptimizedPrompt();

  $.ajax({
    url: API_LLM_BASE + encodeURIComponent(contextPrompt),
    method: "GET",
    success: function (res) {
      $("#" + aiId).text(res);
      saveHistory("ai", res);
      scrollChat();
    },
    error: function () {
      $("#" + aiId).text("❌ Gagal memanggil AI");
    }
  });
}

$(document).ready(function () {
  const history = loadHistory();
  history.forEach(m => appendChat(m.role, m.content));
  scrollChat();

  // ============================
  // AUTO PROMPT DARI HASIL ANGKET
  // ============================
  const autoPrompt = localStorage.getItem("promptChatbot");

  if (autoPrompt) {
    // tampilkan sebagai pesan user
    appendChat("user", autoPrompt);
    saveHistory("user", autoPrompt);

    // hapus agar tidak terkirim dua kali
    localStorage.removeItem("promptChatbot");

    scrollChat();

    // panggil AI otomatis
    const aiId = "ai-" + Date.now();
    $("#chatBox").append(`
      <div class="chat ai">
        <div class="bubble" id="${aiId}">AI sedang menganalisis hasil angket...</div>
      </div>
    `);

    const contextPrompt = buildOptimizedPrompt();

    $.ajax({
      url: API_LLM_BASE + encodeURIComponent(contextPrompt),
      method: "GET",
      success: function (res) {
        $("#" + aiId).text(res);
        saveHistory("ai", res);
        scrollChat();
      },
      error: function () {
        $("#" + aiId).text("❌ Gagal memanggil AI");
      }
    });
  }
});

// ============================
// MEMORY CORE
// ============================
function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
}

function saveHistory(role, content) {
  const history = loadHistory();
  history.push({ role, content });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ============================
// SUMMARY MEMORY (CEPAT)
// ============================
function updateSummary(text) {
  let summary = localStorage.getItem(SUMMARY_KEY) || "";

  if (/nama saya|saya bernama/i.test(text)) {
    summary += `User bernama ${text.split(" ").pop()}. `;
  }
  if (/guru|dosen/i.test(text)) {
    summary += "User berprofesi di bidang pendidikan. ";
  }
  if (/chatbot|ai|llm/i.test(text)) {
    summary += "User sedang mengembangkan chatbot AI. ";
  }

  localStorage.setItem(SUMMARY_KEY, summary.trim());
}

// ============================
// PROMPT OPTIMIZATION
// ============================
function buildOptimizedPrompt() {
  const summary = localStorage.getItem(SUMMARY_KEY) || "Belum ada data penting.";
  const history = loadHistory().slice(-SHORT_MEMORY);

  let prompt = `
KONTEKS PENTING (INGAT SELALU):
${summary}

PERCAKAPAN TERAKHIR:
`;

  history.forEach(m => {
    prompt += `${m.role === "user" ? "User" : "AI"}: ${m.content}\n`;
  });

  prompt += "\nAI:";
  return prompt;
}

// ============================
// UI HELPERS
// ============================
function appendChat(role, text) {
  $("#chatBox").append(`
    <div class="chat ${role}">
      <div class="bubble">${escapeHtml(text)}</div>
    </div>
  `);
}

function scrollChat() {
  const box = document.getElementById("chatBox");
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
