/* eMaktab — ilova mantiqi */
(function () {
  var CLASSES = ["7-A", "7-B", "8-A", "9-B"];
  var SUBJECTS = ["Jahon tarixi", "Adabiyot", "Ona tili", "Matematika", "Tarix"];

  // Demo akkauntlar. studentId o‘quvchi ma’lumotlariga bog‘laydi.
  var ACCOUNTS = {
    oquvchi: { password: "1234", role: "student", studentId: 0, name: "Bunyodbek Xatamqulov", short: "B" },
    admin:   { password: "admin123", role: "admin", name: "Administrator", short: "A" }
  };

  // O‘quvchilar va ularning baholari (xotirada saqlanadi)
  var students = [
    { id: 0, name: "Bunyodbek Xatamqulov", cls: "7-B", grades: [
        { subject: "Jahon tarixi", score: 7, date: "2026-11-21", type: "Joriy" },
        { subject: "Adabiyot",     score: 8, date: "2026-11-19", type: "Joriy" },
        { subject: "Ona tili",     score: 8, date: "2026-11-19", type: "Yozma" },
        { subject: "Ona tili",     score: 7, date: "2026-11-13", type: "Test" }
    ]},
    { id: 1, name: "Ali Valiyev",      cls: "7-A", grades: [ { subject: "Ona tili", score: 9, date: "2026-11-19", type: "Yozma" }, { subject: "Adabiyot", score: 9, date: "2026-11-20", type: "Joriy" } ] },
    { id: 2, name: "Malika Karimova",  cls: "8-A", grades: [ { subject: "Ona tili", score: 7, date: "2026-11-19", type: "Joriy" } ] },
    { id: 3, name: "Jasur Rahmonov",   cls: "9-B", grades: [ { subject: "Matematika", score: 5, date: "2026-11-18", type: "Test" } ] },
    { id: 4, name: "Nilufar Sobirova", cls: "7-B", grades: [ { subject: "Adabiyot", score: 9, date: "2026-11-21", type: "Joriy" } ] }
  ];
  var nextId = students.length;

  var role = "student";
  var currentStudentId = null;
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // ---------- yordamchi funksiyalar ----------
  function gradeClass(s) {
    if (s >= 9) return "g-hi";
    if (s >= 7) return "g-mid";
    if (s >= 5) return "g-lo";
    return "g-bad";
  }
  function avgOf(list) {
    if (!list.length) return 0;
    return list.reduce(function (a, g) { return a + g.score; }, 0) / list.length;
  }
  function avgFor(st) { return avgOf(st.grades); }
  function avgSubject(st, subject) {
    return avgOf(st.grades.filter(function (g) { return g.subject === subject; }));
  }
  function statusOf(avg) {
    if (!avg) return '<span class="pill p-warn">Baho yo‘q</span>';
    if (avg >= 8) return '<span class="pill p-ok">Yaxshi</span>';
    if (avg >= 6) return '<span class="pill p-warn">O‘rtacha</span>';
    return '<span class="pill p-bad">Diqqat</span>';
  }
  function fillSelect(el, items, allLabel) {
    el.innerHTML = (allLabel ? '<option value="">' + allLabel + '</option>' : "") +
      items.map(function (x) { return "<option>" + x + "</option>"; }).join("");
  }
  function fmtDate(iso) {
    var p = iso.split("-");
    return p[2] + "." + p[1] + "." + p[0];
  }
  function chip(score) {
    return '<span class="gchip ' + gradeClass(score) + '">' + score + '</span>';
  }

  // Selectlarni to‘ldirish
  fillSelect($("gSubject"), SUBJECTS);
  fillSelect($("gClass"), CLASSES, "Barcha sinflar");
  fillSelect($("sFilter"), CLASSES, "Barcha sinflar");
  fillSelect($("nCls"), CLASSES);

  // ---------- LOGIN ----------
  $$("#seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      role = b.getAttribute("data-role");
      $$("#seg button").forEach(function (x) { x.classList.toggle("on", x === b); });
      $("seg").classList.toggle("admin", role === "admin");
      $("err").textContent = "";
    });
  });

  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var login = $("lg").value.trim();
    var pass = $("ps").value;
    var acc = ACCOUNTS[login];

    if (!login || !pass) { $("err").textContent = "Login va parolni kiriting."; return; }
    if (!acc || acc.password !== pass) { $("err").textContent = "Login yoki parol noto‘g‘ri."; return; }
    if (acc.role !== role) {
      $("err").textContent = role === "admin"
        ? "Bu akkaunt administrator emas. “O‘quvchi” ni tanlang."
        : "Bu akkaunt o‘quvchi emas. “Administrator” ni tanlang.";
      return;
    }
    openApp(acc);
  });

  function openApp(acc) {
    $("login").classList.add("hide");
    $("app").classList.remove("hide");
    $("meName").textContent = acc.name;
    $("meAv").textContent = acc.short;
    var isAdmin = acc.role === "admin";
    $("meRole").textContent = isAdmin ? "Administrator" : "O‘quvchi · 7-B";
    $("navStudent").classList.toggle("hide", isAdmin);
    $("navAdmin").classList.toggle("hide", !isAdmin);

    if (isAdmin) {
      renderAdminAll();
      go("a-home");
    } else {
      currentStudentId = acc.studentId;
      renderStudentAll();
      go("s-home");
    }
  }

  $("logout").addEventListener("click", function () {
    $("app").classList.add("hide");
    $("login").classList.remove("hide");
    $("loginForm").reset();
    $("err").textContent = "";
    $("seg").classList.remove("admin");
    role = "student";
    $$("#seg button").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-role") === "student"); });
  });

  // ---------- NAVIGATSIYA ----------
  function go(id) {
    $$(".view").forEach(function (v) { v.classList.toggle("hide", v.id !== id); });
    $$(".nav-btn").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-go") === id); });
  }
  $$(".nav-btn").forEach(function (b) {
    b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
  });

  // ========== STUDENT ==========
  function myStudent() { return students[currentStudentId]; }

  function renderStudentAll() {
    var st = myStudent();
    var avg = avgFor(st);
    $("sHello").textContent = "Salom, " + st.name.split(" ")[0] + "! 👋";
    $("sAvgChip").textContent = "O‘rtacha: " + (avg ? avg.toFixed(1) : "—");

    // So‘nggi baholar (eng yangi 4 ta)
    var recent = st.grades.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 4);
    $("sRecent").innerHTML = recent.length ? recent.map(function (g, i) {
      return '<div class="gr c' + ((i % 4) + 1) + '"><div class="s">' + g.score + '</div><div class="n">' +
        g.subject + '</div><div class="d">' + fmtDate(g.date) + '</div></div>';
    }).join("") : '<p class="info">Hozircha baholar yo‘q.</p>';

    // Fanlar bo‘yicha o‘rtacha
    var subjectsHave = SUBJECTS.filter(function (s) { return avgSubject(st, s) > 0; });
    $("sBars").innerHTML = subjectsHave.length ? subjectsHave.map(function (s) {
      var a = avgSubject(st, s);
      return '<div class="bar-row"><div class="lab">' + s + '</div><div class="track"><div class="fill" style="width:' +
        (a * 10) + '%"></div></div><div class="val">' + a.toFixed(1) + '</div></div>';
    }).join("") : '<p class="info">Hozircha baholar yo‘q.</p>';

    // Barcha baholar jadvali
    var all = st.grades.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    $("sCount").textContent = all.length + " ta baho";
    $("sTable").innerHTML = all.length ? all.map(function (g) {
      return "<tr><td>" + g.subject + "</td><td>" + fmtDate(g.date) + "</td><td>" + chip(g.score) + "</td><td>" + g.type + "</td></tr>";
    }).join("") : '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:20px;">Baholar yo‘q</td></tr>';
  }

  // ========== ADMIN ==========
  function renderAdminAll() {
    renderHome();
    renderGradeTable();
    renderStudentsTable();
  }

  function renderHome() {
    var allGrades = [];
    students.forEach(function (s) { allGrades = allGrades.concat(s.grades); });
    var gradedStudents = students.filter(function (s) { return s.grades.length; }).length;
    $("kTotal").textContent = students.length;
    $("kGraded").textContent = gradedStudents;
    $("kGrades").textContent = allGrades.length;
    $("kAvg").textContent = allGrades.length ? avgOf(allGrades).toFixed(1) : "—";

    $("aClassBars").innerHTML = CLASSES.map(function (c) {
      var inCls = students.filter(function (s) { return s.cls === c; });
      var gs = [];
      inCls.forEach(function (s) { gs = gs.concat(s.grades); });
      var a = avgOf(gs);
      return '<div class="bar-row"><div class="lab">' + c + ' (' + inCls.length + ' ta)</div><div class="track"><div class="fill" style="width:' +
        (a * 10) + '%"></div></div><div class="val">' + (a ? a.toFixed(1) : "—") + '</div></div>';
    }).join("");
  }

  // ----- Baho qo‘yish -----
  function renderGradeTable() {
    var subject = $("gSubject").value || SUBJECTS[0];
    var cls = $("gClass").value;
    var list = students.filter(function (s) { return !cls || s.cls === cls; });

    $("gRows").innerHTML = list.length ? list.map(function (s) {
      var prev = s.grades.filter(function (g) { return g.subject === subject; });
      var prevHtml = prev.length ? prev.map(function (g) { return chip(g.score); }).join(" ") : '<span class="info" style="margin:0">—</span>';
      return '<tr data-id="' + s.id + '"><td><b>' + s.name + '</b></td><td>' + s.cls + '</td>' +
        '<td><div class="chips">' + prevHtml + '</div></td>' +
        '<td><input class="score-in" type="number" min="1" max="10" step="1" placeholder="—"></td>' +
        '<td><button class="btn ghost" data-save="' + s.id + '">Qo‘yish</button></td></tr>';
    }).join("") : '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">Bu sinfda o‘quvchi yo‘q</td></tr>';

    $("gInfo").textContent = list.length + " ta o‘quvchi · " + subject;
  }

  function readScore(input) {
    var v = input.value.trim();
    if (v === "") return null;
    var n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 10) return "bad";
    return n;
  }

  function saveGrade(studentId, row) {
    var input = row.querySelector(".score-in");
    var score = readScore(input);
    if (score === null) return 0;
    if (score === "bad") { input.style.borderColor = "#ef4444"; return -1; }
    students[studentId].grades.push({
      subject: $("gSubject").value,
      score: score,
      date: $("gDate").value || "2026-11-23",
      type: $("gType").value
    });
    input.value = "";
    input.style.borderColor = "";
    return 1;
  }

  // Bitta o‘quvchiga
  $("gRows").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-save]");
    if (!btn) return;
    var row = btn.closest("tr");
    var res = saveGrade(Number(btn.getAttribute("data-save")), row);
    if (res === -1) { $("gMsg").style.color = "#ef4444"; $("gMsg").textContent = "Baho 1 dan 10 gacha bo‘lishi kerak."; return; }
    if (res === 1) { $("gMsg").style.color = "#10b981"; $("gMsg").textContent = "Baho saqlandi."; }
    renderGradeTable(); renderHome();
  });

  // Hammasiga bir vaqtda
  $("gSaveAll").addEventListener("click", function () {
    var saved = 0, bad = 0;
    $$("#gRows tr[data-id]").forEach(function (row) {
      var r = saveGrade(Number(row.getAttribute("data-id")), row);
      if (r === 1) saved++;
      if (r === -1) bad++;
    });
    if (bad) { $("gMsg").style.color = "#ef4444"; $("gMsg").textContent = bad + " ta baho noto‘g‘ri (1–10). Tuzatib qayta saqlang."; }
    else if (saved) { $("gMsg").style.color = "#10b981"; $("gMsg").textContent = saved + " ta o‘quvchiga baho qo‘yildi."; }
    else { $("gMsg").style.color = "#64748b"; $("gMsg").textContent = "Saqlash uchun baho kiriting."; }
    renderGradeTable(); renderHome();
  });

  $("gSubject").addEventListener("change", renderGradeTable);
  $("gClass").addEventListener("change", renderGradeTable);

  // ----- O‘quvchilar ro‘yxati -----
  function renderStudentsTable() {
    var q = $("search").value.trim().toLowerCase();
    var c = $("sFilter").value;
    var list = students.filter(function (s) {
      return s.name.toLowerCase().indexOf(q) !== -1 && (!c || s.cls === c);
    });
    $("stRows").innerHTML = list.length ? list.map(function (s) {
      var a = avgFor(s);
      return "<tr><td><b>" + s.name + "</b></td><td>" + s.cls + "</td><td><b>" + (a ? a.toFixed(1) : "—") +
        "</b></td><td>" + statusOf(a) + '</td><td><button class="del" data-del="' + s.id + '">O‘chirish</button></td></tr>';
    }).join("") : '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px;">Natija topilmadi</td></tr>';
  }
  $("stRows").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-del]");
    if (!btn) return;
    var id = Number(btn.getAttribute("data-del"));
    if (id === 0) return; // demo o‘quvchi o‘chirilmaydi
    students = students.filter(function (s) { return s.id !== id; });
    renderAdminAll();
  });
  $("search").addEventListener("input", renderStudentsTable);
  $("sFilter").addEventListener("change", renderStudentsTable);

  // ----- Yangi o‘quvchi -----
  $("addForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("nName").value.trim();
    if (!name) { $("addMsg").textContent = "Ism familiyani kiriting."; return; }
    students.push({ id: nextId++, name: name, cls: $("nCls").value, grades: [] });
    $("addMsg").textContent = "“" + name + "” ro‘yxatga qo‘shildi.";
    e.target.reset();
    renderAdminAll();
  });

  // ----- E’lon -----
  $("annForm").addEventListener("submit", function (e) {
    e.preventDefault();
    $("annMsg").textContent = "E’lon barcha o‘quvchilarga yuborildi.";
    e.target.reset();
  });
})();