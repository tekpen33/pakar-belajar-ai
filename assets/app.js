/* ===== GLOBAL TASK STORAGE ===== */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

/* ===== SAVE ===== */
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ===== RECOMMENDATION ===== */
function getRecommendation(task) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const hoursLeft = (deadline - now) / 36e5;

  if (task.isDone) return "Completed";
  if (task.priority === "High" && hoursLeft <= 24) return "Kerjakan Sekarang";
  if (task.priority === "Medium") return "Jadwalkan Hari Ini";
  return "Bisa Ditunda";
}

/* ===== ADD TASK ===== */
function addTask(task) {
  tasks.push(task);
  const order = { High: 1, Medium: 2, Low: 3 };
  tasks.sort((a, b) => order[a.priority] - order[b.priority]);
  saveTasks();
}

/* ===== TOGGLE DONE ===== */
function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.isDone = !t.isDone;
  saveTasks();
}

function aiParseTask(text) {
  const originalText = text;
  text = text.toLowerCase().replace(/[.,!?]/g, "");

  let title = originalText;
  let deadline = new Date();
  let score = 0;
  let reason = [];

  /* ===== PHRASE-BASED PRIORITY RULE ===== */

  // HIGH – kalimat mendesak
  const highPhrases = [
    "harus selesai hari ini",
    "segera kerjakan",
    "sangat penting",
    "tidak boleh terlambat",
    "deadline hari ini"
  ];

  // MEDIUM – kalimat terjadwal
  const mediumPhrases = [
    "kerjakan besok",
    "jadwal rutin",
    "pekerjaan biasa",
    "tidak terlalu penting",
    "sesuai jadwal"
  ];

  // LOW – kalimat fleksibel
  const lowPhrases = [
    "jika sempat",
    "kalau ada waktu",
    "tidak mendesak",
    "bisa ditunda",
    "santai saja"
  ];

  // Deteksi HIGH
  highPhrases.forEach(p => {
    if (text.includes(p)) {
      score += 4;
      reason.push(`Frasa "${p}"`);
    }
  });

  // Deteksi MEDIUM
  mediumPhrases.forEach(p => {
    if (text.includes(p)) {
      score += 1;
      reason.push(`Frasa "${p}"`);
    }
  });

  // Deteksi LOW
  lowPhrases.forEach(p => {
    if (text.includes(p)) {
      score -= 2;
      reason.push(`Frasa "${p}"`);
    }
  });

  /* ===== DATE RULE (BERDASARKAN KALIMAT) ===== */
  if (text.includes("hari ini")) {
    reason.push("Deadline hari ini");
  }

  if (text.includes("besok")) {
    deadline.setDate(deadline.getDate() + 1);
    reason.push("Deadline besok");
  }

  if (text.includes("minggu depan")) {
    deadline.setDate(deadline.getDate() + 7);
    reason.push("Deadline minggu depan");
  }
  /* ===== RELATIVE DAY RULE (7 hari lagi, 3 hari lagi, dll) ===== */
const dayMatch = text.match(/(\d+)\s*hari\s*lagi/);
if (dayMatch) {
  const days = parseInt(dayMatch[1]);
  deadline.setDate(deadline.getDate() + days);
  reason.push(`Deadline ${days} hari lagi`);
}

  /* ===== TIME RULE ===== */
  const timeMatch = text.match(/jam\s(\d{1,2})/);
  if (timeMatch) {
    deadline.setHours(parseInt(timeMatch[1]));
    deadline.setMinutes(0);
    reason.push(`Jam ${timeMatch[1]}`);
  } else {
    deadline.setHours(15);
    deadline.setMinutes(0);
  }

  /* ===== FINAL PRIORITY ===== */
  let priority = "Medium";
  if (score >= 4) priority = "High";
  else if (score <= 0) priority = "Low";

  /* ===== FORMAT DATE ===== */
  const y = deadline.getFullYear();
  const m = String(deadline.getMonth() + 1).padStart(2, "0");
  const d = String(deadline.getDate()).padStart(2, "0");
  const h = String(deadline.getHours()).padStart(2, "0");
  const min = String(deadline.getMinutes()).padStart(2, "0");

  return {
    id: Date.now(),
    title: title.charAt(0).toUpperCase() + title.slice(1),
    priority,
    deadline: `${y}-${m}-${d} ${h}:${min}`,
    isDone: false,
    reason: reason.join(", ")
  };
}

/* ===== CALENDAR HELPERS ===== */

/* Ambil semua task pada tanggal tertentu */
function getTasksByDate(dateStr) {
  return tasks.filter(t => t.deadline.startsWith(dateStr));
}

/* Ambil prioritas tertinggi pada satu tanggal */
function getHighestPriority(taskList) {
  if (taskList.some(t => t.priority === "High")) return "High";
  if (taskList.some(t => t.priority === "Medium")) return "Medium";
  return "Low";
}
