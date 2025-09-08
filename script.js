// إدارة الطلاب حسب الصف
const grades = [7, 8, 9];
let students = { 7: [], 8: [], 9: [] };

// تحميل الطلاب من localStorage إن وجد
function loadStudents() {
  const saved = localStorage.getItem('students');
  if (saved) students = JSON.parse(saved);
}
function saveStudents() {
  localStorage.setItem('students', JSON.stringify(students));
}

// تحديث تاريخ اليوم
document.getElementById('attendanceDate').innerText = new Date().toLocaleDateString('ar-EG');

// عناصر التحكم
const gradeSelect = document.getElementById('grade');
const manageBtn = document.getElementById('manageStudentsBtn');
const modal = document.getElementById('manageStudents');
const closeModal = document.querySelector('.close');
const studentsListDiv = document.getElementById('studentsList');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentNameInput = document.getElementById('studentNameInput');
const currentGradeSpan = document.getElementById('currentGrade');
const statsBox = document.getElementById('stats');

// عرض الطلاب في الجدول
function renderAttendanceTable() {
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  const selectedGrade = gradeSelect.value;

  students[selectedGrade].forEach((name, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>
        <select class="status">
          <option value="حاضر">حاضر</option>
          <option value="غائب">غائب</option>
          <option value="متأخر">متأخر</option>
        </select>
      </td>
      <td><input type="number" class="delay-time" placeholder="دقائق" disabled></td>
    `;
    tbody.appendChild(tr);

    const statusSelect = tr.querySelector('.status');
    const delayInput = tr.querySelector('.delay-time');

    statusSelect.onchange = () => {
      delayInput.disabled = statusSelect.value !== "متأخر";
      if (statusSelect.value !== "متأخر") delayInput.value = "";
      updateStats();
    };

    delayInput.oninput = updateStats;
  });

  updateStats();
}

// عرض الإحصائيات
function updateStats() {
  const rows = document.querySelectorAll('#attendanceTable tbody tr');
  let present = 0, absent = 0, late = 0, totalDelay = 0;

  rows.forEach(row => {
    const status = row.querySelector('.status').value;
    if (status === "حاضر") present++;
    else if (status === "غائب") absent++;
    else if (status === "متأخر") {
      late++;
      const delay = parseInt(row.querySelector('.delay-time').value) || 0;
      totalDelay += delay;
    }
  });

  statsBox.innerHTML = `
    ✅ حاضر: ${present} | ❌ غائب: ${absent} | ⏰ متأخر: ${late} (مجموع التأخير: ${totalDelay} دقيقة)
  `;
}

// إدارة الطلاب
function renderStudentsList(grade) {
  studentsListDiv.innerHTML = '';
  students[grade].forEach((name, idx) => {
    const div = document.createElement('div');
    div.className = 'student-item';
    div.innerHTML = `
      <span class="student-name">${name}</span>
      <button class="remove-btn" data-idx="${idx}">حذف</button>
    `;
    studentsListDiv.appendChild(div);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = btn.getAttribute('data-idx');
      students[grade].splice(idx, 1);
      saveStudents();
      renderStudentsList(grade);
      renderAttendanceTable();
    };
  });
}

// فتح وإغلاق النافذة
manageBtn.onclick = function() {
  const grade = gradeSelect.value;
  currentGradeSpan.innerText = grade;
  renderStudentsList(grade);
  modal.style.display = 'block';
};
closeModal.onclick = function() {
  modal.style.display = 'none';
};
window.onclick = function(event) {
  if (event.target === modal) modal.style.display = 'none';
};

// إضافة طالب جديد
addStudentBtn.onclick = function() {
  const grade = gradeSelect.value;
  const name = studentNameInput.value.trim();
  if (name && !students[grade].includes(name)) {
    students[grade].push(name);
    saveStudents();
    studentNameInput.value = '';
    renderStudentsList(grade);
    renderAttendanceTable();
  }
};

// تغيير الصف
gradeSelect.onchange = function() {
  renderAttendanceTable();
};

// إعادة تعيين اليوم
document.getElementById('resetAttendanceBtn').onclick = function() {
  renderAttendanceTable();
};

// تصدير PDF
document.getElementById('exportPdfBtn').onclick = function() {
  const doc = new window.jspdf.jsPDF({orientation: "portrait", unit: "pt", format: "a4"});
  const grade = gradeSelect.value;
  const today = new Date().toLocaleDateString('ar-EG');

  doc.setFontSize(14);
  doc.text(`كشف الحضور للصف ${grade}`, 420, 40, {align: 'center'});
  doc.text(`تاريخ اليوم: ${today}`, 420, 60, {align: 'center'});

  const rows = [];
  document.querySelectorAll('#attendanceTable tbody tr').forEach(row => {
    const name = row.cells[0].innerText;
    const status = row.cells[1].querySelector('.status').value;
    const delay = row.cells[2].querySelector('.delay-time').value || "-";
    rows.push([name, status, delay]);
  });

  doc.autoTable({
    head: [['اسم الطالب', 'الحالة', 'زمن التأخر (دقائق)']],
    body: rows,
    startY: 90,
    styles: {font: "helvetica", halign: "center"},
    headStyles: {fillColor: [32, 76, 131]},
  });

  doc.save('كشف-الحضور.pdf');
};

// بدء التشغيل
loadStudents();
renderAttendanceTable();
