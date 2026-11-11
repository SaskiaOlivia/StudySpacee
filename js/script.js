// =====================================
// STUDYSPACE - STUDENT DASHBOARD
// =====================================

const $ = (id) => document.getElementById(id);

function getData(key, fallback) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

let tasks = getData("ss_tasks", []);
let schedules = getData("ss_schedules", []);
let notes = getData("ss_notes", []);

let profile = getData("ss_profile", {
    name: "Saskia Olivia",
    className: "XI RPL 2",
    school: "SMK SWASTA PRAMA ARTHA"
});

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function todayString() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function updateProfileDisplay() {
    if ($("welcomeName")) $("welcomeName").textContent = profile.name;
    if ($("sideName")) $("sideName").textContent = profile.name;
    if ($("sideClass")) $("sideClass").textContent = profile.className;
    if ($("sideAvatar")) $("sideAvatar").textContent = profile.name.charAt(0).toUpperCase();
    if ($("profileName")) $("profileName").value = profile.name;
    if ($("profileClass")) $("profileClass").value = profile.className;
    if ($("profileSchool")) $("profileSchool").value = profile.school;
}

function updateDate() {
    if ($("todayDate")) {
        $("todayDate").textContent = new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }
}

// =====================================
// NAVIGATION
// =====================================

function showPage(pageId) {
    const target = $(pageId);
    if (!target || !target.classList.contains("page")) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === pageId);
    });

    const titles = {
        dashboard: "Dashboard",
        tasks: "Tugas Saya",
        schedule: "Jadwal Pelajaran",
        notes: "Catatan Digital",
        calendar: "Kalender",
        focus: "Focus Timer"
    };

    if ($("pageTitle")) $("pageTitle").textContent = titles[pageId] || "Dashboard";

    if (location.hash !== "#" + pageId) {
        history.replaceState(null, "", "#" + pageId);
    }

    if ($("sidebar")) $("sidebar").classList.remove("open");

    renderAll();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.goto);
    });
});

if ($("menuToggle")) {
    $("menuToggle").addEventListener("click", () => {
        $("sidebar").classList.toggle("open");
    });
}

// =====================================
// TASKS
// =====================================

function addTask(task) {
    tasks.unshift({
        id: Date.now().toString(),
        title: task.title,
        subject: task.subject,
        deadline: task.deadline,
        priority: task.priority,
        description: task.description,
        completed: false,
        createdAt: new Date().toISOString()
    });

    saveData("ss_tasks", tasks);
}

function taskHTML(task) {
    const done = task.completed ? "done" : "";
    const checked = task.completed ? "checked" : "";

    return `
        <div class="task-item ${done}">
            <input class="task-check" type="checkbox"
                data-action="toggle-task"
                data-id="${escapeHTML(task.id)}" ${checked}>
            <div class="task-info">
                <strong>${escapeHTML(task.title)}</strong>
                <small>${escapeHTML(task.subject)} · Deadline: ${formatDate(task.deadline)}</small>
            </div>
            <span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span>
            <div class="task-actions">
                <button class="icon-button" data-action="delete-task"
                    data-id="${escapeHTML(task.id)}" title="Hapus">✕</button>
            </div>
        </div>
    `;
}

function renderTasks() {
    const dashboardContainer = $("dashboardTasks");
    const allContainer = $("allTasks");

    const recent = tasks.slice(0, 4);

    if (dashboardContainer) {
        dashboardContainer.innerHTML = recent.length
            ? recent.map(taskHTML).join("")
            : '<div class="empty-state">Belum ada tugas. Yuk, tambahkan tugas pertamamu!</div>';
    }

    if (allContainer) {
        const search = ($("taskSearch")?.value || "").toLowerCase();
        const filter = $("taskFilter")?.value || "all";

        const filtered = tasks.filter(task => {
            const matchSearch =
                task.title.toLowerCase().includes(search) ||
                task.subject.toLowerCase().includes(search);

            const matchFilter =
                filter === "all" ||
                (filter === "completed" && task.completed) ||
                (filter === "pending" && !task.completed);

            return matchSearch && matchFilter;
        });

        allContainer.innerHTML = filtered.length
            ? filtered.map(taskHTML).join("")
            : '<div class="empty-state">Tidak ada tugas yang ditemukan.</div>';
    }
}

document.addEventListener("change", event => {
    const checkbox = event.target.closest('[data-action="toggle-task"]');
    if (!checkbox) return;

    const task = tasks.find(item => item.id === checkbox.dataset.id);
    if (!task) return;

    task.completed = checkbox.checked;
    saveData("ss_tasks", tasks);
    renderAll();
});

document.addEventListener("click", event => {
    const deleteButton = event.target.closest('[data-action="delete-task"]');
    if (!deleteButton) return;

    const confirmed = confirm("Yakin ingin menghapus tugas ini?");
    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== deleteButton.dataset.id);
    saveData("ss_tasks", tasks);
    renderAll();
});

if ($("taskSearch")) {
    $("taskSearch").addEventListener("input", renderTasks);
}

if ($("taskFilter")) {
    $("taskFilter").addEventListener("change", renderTasks);
}

// Form tambah tugas
if ($("taskForm")) {
    const deadlineInput = $("taskDeadline");
    if (deadlineInput) deadlineInput.min = todayString();

    $("taskForm").addEventListener("submit", event => {
        event.preventDefault();

        addTask({
            title: $("taskName").value.trim(),
            subject: $("taskSubject").value.trim(),
            deadline: $("taskDeadline").value,
            priority: $("taskPriority").value,
            description: $("taskDescription").value.trim()
        });

        alert("Tugas berhasil ditambahkan!");
        window.location.href = "index.html#tasks";
    });
}

// =====================================
// SCHEDULE
// =====================================

function renderSchedules() {
    const dashboardContainer = $("dashboardSchedule");
    const allContainer = $("allSchedule");

    const today = days[new Date().getDay()];

    const todayItems = schedules
        .filter(item => item.day === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    if (dashboardContainer) {
        dashboardContainer.innerHTML = todayItems.length
            ? todayItems.map(item => `
                <div class="schedule-row">
                    <div><strong>${escapeHTML(item.subject)}</strong><br>
                    <small>${escapeHTML(item.day)}</small></div>
                    <small>${escapeHTML(item.time)}</small>
                </div>
            `).join("")
            : '<div class="empty-state">Belum ada jadwal untuk hari ini.</div>';
    }

    if (allContainer) {
        const sorted = [...schedules].sort((a, b) => {
            const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
            return dayOrder || a.time.localeCompare(b.time);
        });

        allContainer.innerHTML = sorted.length
            ? sorted.map(item => `
                <div class="schedule-card">
                    <div>
                        <strong>${escapeHTML(item.subject)}</strong>
                        <small>${escapeHTML(item.day)} · ${escapeHTML(item.time)}</small>
                    </div>
                    <button class="icon-button" data-action="delete-schedule"
                        data-id="${escapeHTML(item.id)}">✕</button>
                </div>
            `).join("")
            : '<div class="empty-state">Belum ada jadwal pelajaran.</div>';
    }
}

if ($("scheduleForm")) {
    $("scheduleForm").addEventListener("submit", event => {
        event.preventDefault();

        schedules.push({
            id: Date.now().toString(),
            subject: $("subjectName").value.trim(),
            day: $("subjectDay").value,
            time: $("subjectTime").value
        });

        saveData("ss_schedules", schedules);
        $("scheduleForm").reset();
        renderAll();
    });
}

document.addEventListener("click", event => {
    const button = event.target.closest('[data-action="delete-schedule"]');
    if (!button) return;

    schedules = schedules.filter(item => item.id !== button.dataset.id);
    saveData("ss_schedules", schedules);
    renderAll();
});

// =====================================
// NOTES
// =====================================

function renderNotes() {
    const dashboardContainer = $("dashboardNotes");
    const allContainer = $("allNotes");

    if (dashboardContainer) {
        dashboardContainer.innerHTML = notes.length
            ? notes.slice(0, 3).map(note => `
                <div class="note-preview-item">
                    <strong>${escapeHTML(note.title)}</strong>
                    <small>${formatDate(note.date)}</small>
                </div>
            `).join("")
            : '<div class="empty-state">Belum ada catatan.</div>';
    }

    if (allContainer) {
        allContainer.innerHTML = notes.length
            ? notes.map(note => `
                <div class="note-card">
                    <h3>${escapeHTML(note.title)}</h3>
                    <p>${escapeHTML(note.content)}</p>
                    <small>${formatDate(note.date)}</small>
                    <button class="icon-button" data-action="delete-note"
                        data-id="${escapeHTML(note.id)}">Hapus catatan</button>
                </div>
            `).join("")
            : '<div class="empty-state">Belum ada catatan. Buat catatan pertamamu!</div>';
    }
}

if ($("noteForm")) {
    $("noteForm").addEventListener("submit", event => {
        event.preventDefault();

        notes.unshift({
            id: Date.now().toString(),
            title: $("noteTitle").value.trim(),
            content: $("noteContent").value.trim(),
            date: todayString()
        });

        saveData("ss_notes", notes);
        $("noteForm").reset();
        renderAll();
        alert("Catatan berhasil disimpan!");
    });
}

document.addEventListener("click", event => {
    const button = event.target.closest('[data-action="delete-note"]');
    if (!button) return;

    notes = notes.filter(note => note.id !== button.dataset.id);
    saveData("ss_notes", notes);
    renderAll();
});

// =====================================
// DASHBOARD STATISTICS
// =====================================

function renderStats() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;
    const percent = tasks.length
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    if ($("totalTasks")) $("totalTasks").textContent = tasks.length;
    if ($("completedTasks")) $("completedTasks").textContent = completed;
    if ($("pendingTasks")) $("pendingTasks").textContent = pending;
    if ($("todaySchedule")) {
        const today = days[new Date().getDay()];
        $("todaySchedule").textContent =
            schedules.filter(item => item.day === today).length;
    }

    if ($("progressPercent")) $("progressPercent").textContent = percent + "%";

    if ($("progressCircle")) {
        $("progressCircle").style.background =
            `conic-gradient(var(--green) ${percent}%, #e9eee5 ${percent}%)`;
    }

    if ($("progressCaption")) {
        $("progressCaption").textContent = tasks.length
            ? `${completed} dari ${tasks.length} tugas sudah selesai.`
            : "Mulai kerjakan tugas pertamamu!";
    }
}

// =====================================
// CALENDAR
// =====================================

let calendarDate = new Date();

function renderCalendar() {
    if (!$("calendarGrid")) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    $("calendarTitle").textContent = calendarDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = todayString();

    let html = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
        .map(day => `<div class="calendar-cell day-name">${day}</div>`)
        .join("");

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-cell"></div>';
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const hasDeadline = tasks.some(task => task.deadline === date && !task.completed);
        const isToday = date === today;

        html += `
            <div class="calendar-cell ${hasDeadline ? "has-deadline" : ""} ${isToday ? "today" : ""}">
                ${day}
            </div>
        `;
    }

    $("calendarGrid").innerHTML = html;

    const upcoming = [...tasks]
        .filter(task => !task.completed && task.deadline)
        .sort((a, b) => a.deadline.localeCompare(b.deadline));

    $("deadlineList").innerHTML = upcoming.length
        ? upcoming.map(task => `
            <div class="deadline-item">
                <strong>${escapeHTML(task.title)}</strong>
                <small>${escapeHTML(task.subject)} · ${formatDate(task.deadline)}</small>
            </div>
        `).join("")
        : '<div class="empty-state">Tidak ada deadline yang menunggu.</div>';
}

if ($("prevMonth")) {
    $("prevMonth").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
}

if ($("nextMonth")) {
    $("nextMonth").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });
}

// =====================================
// POMODORO TIMER
// =====================================

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let currentMinutes = 25;
let sessions = Number(localStorage.getItem("ss_sessions") || 0);

function updateTimerDisplay() {
    if (!$("timerDisplay")) return;

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    $("timerDisplay").textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    if ($("startTimer")) $("startTimer").textContent = "Mulai";
}

function resetTimer() {
    stopTimer();
    timerSeconds = currentMinutes * 60;
    updateTimerDisplay();
}

if ($("startTimer")) {
    $("startTimer").addEventListener("click", () => {
        if (timerRunning) {
            stopTimer();
            return;
        }

        timerRunning = true;
        $("startTimer").textContent = "Jeda";

        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 0) {
                stopTimer();

                if (currentMinutes === 25) {
                    sessions++;
                    localStorage.setItem("ss_sessions", sessions);
                    $("sessionCount").textContent = sessions;
                }

                alert("Waktu selesai! Bagus, kamu sudah menyelesaikan sesi.");
                resetTimer();
            }
        }, 1000);
    });
}

if ($("resetTimer")) {
    $("resetTimer").addEventListener("click", resetTimer);
}

document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".mode-button").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        currentMinutes = Number(button.dataset.minutes);
        $("timerMode").textContent = button.dataset.mode;
        resetTimer();
    });
});

// =====================================
// PROFILE
// =====================================

if ($("editProfile")) {
    $("editProfile").addEventListener("click", () => {
        updateProfileDisplay();
        $("profileModal").classList.add("show");
    });
}

if ($("closeProfile")) {
    $("closeProfile").addEventListener("click", () => {
        $("profileModal").classList.remove("show");
    });
}

if ($("profileModal")) {
    $("profileModal").addEventListener("click", event => {
        if (event.target === $("profileModal")) {
            $("profileModal").classList.remove("show");
        }
    });
}

if ($("profileForm")) {
    $("profileForm").addEventListener("submit", event => {
        event.preventDefault();

        profile = {
            name: $("profileName").value.trim(),
            className: $("profileClass").value.trim(),
            school: $("profileSchool").value.trim()
        };

        saveData("ss_profile", profile);
        updateProfileDisplay();
        $("profileModal").classList.remove("show");
    });
}

// =====================================
// DARK MODE
// =====================================

const savedTheme = localStorage.getItem("ss_theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

function updateThemeButton() {
    if (!$("themeButton")) return;

    $("themeButton").innerHTML = document.body.classList.contains("dark")
        ? "☀ <span>Mode Terang</span>"
        : "☾ <span>Mode Gelap</span>";
}

if ($("themeButton")) {
    updateThemeButton();

    $("themeButton").addEventListener("click", () => {
        document.body.classList.toggle("dark");

        const theme = document.body.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("ss_theme", theme);
        updateThemeButton();
    });
}

// =====================================
// RENDER ALL
// =====================================

function renderAll() {
    renderTasks();
    renderSchedules();
    renderNotes();
    renderStats();
    renderCalendar();
    updateProfileDisplay();
}

updateDate();
updateProfileDisplay();

if ($("sessionCount")) {
    $("sessionCount").textContent = sessions;
}

if ($("timerDisplay")) {
    updateTimerDisplay();
}

renderAll()