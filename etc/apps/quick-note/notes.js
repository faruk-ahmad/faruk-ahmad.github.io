
const STORAGE_KEY = "richQuickNotes";
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentNoteId = null;

const noteListEl = document.getElementById("noteList");
const noteTitleEl = document.getElementById("noteTitle");
const noteContentEl = document.getElementById("noteContent");
const statusEl = document.getElementById("status");
const newNoteBtn = document.getElementById("newNoteBtn");

function renderNoteList() {
  noteListEl.innerHTML = "";
  Object.entries(notes).forEach(([id, note]) => {
    const li = document.createElement("li");

    const delBtn = document.createElement("button");
    delBtn.textContent = "−";
    delBtn.className = "delete-note";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this note?")) {
        delete notes[id];
        if (id === currentNoteId) currentNoteId = null;
        saveNotes();
        if (Object.keys(notes).length > 0) {
          loadNote(Object.keys(notes)[0]);
        } else {
          createNewNote();
        }
      }
    };

    const span = document.createElement("span");
    span.className = "note-title";
    span.textContent = note.title || "Untitled";

    li.appendChild(delBtn);
    li.appendChild(span);
    li.classList.toggle("active", id === currentNoteId);
    li.onclick = () => loadNote(id);
    noteListEl.appendChild(li);
  });
}

function createNewNote() {
  const id = "note-" + Date.now();
  notes[id] = { title: "New Note", content: "" };
  currentNoteId = id;
  saveNotes();
  loadNote(id);
  renderNoteList();
}

function loadNote(id) {
  currentNoteId = id;
  const note = notes[id];
  noteTitleEl.value = note.title;
  noteContentEl.innerHTML = note.content;
  renderNoteList();
  statusEl.textContent = "Loaded: " + note.title;
  rebindTableControls();
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function saveCurrentNoteContent() {
  if (!currentNoteId) return;
  notes[currentNoteId].content = noteContentEl.innerHTML;
  saveNotes();
  statusEl.textContent = "Saved at " + new Date().toLocaleTimeString();
}

function format(command, value = null) {
  document.execCommand(command, false, value);
  noteContentEl.focus();
}

function applyHeading(tag) {
  format("formatBlock", tag ? `<${tag}>` : "div");
}

function insertTable() {
  const rows = 2;
  const cols = 2;
  const table = document.createElement("table");
  table.className = "editable-table";

  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < cols; j++) {
      const td = document.createElement("td");
      td.contentEditable = true;
      td.innerHTML = `Cell ${i + 1}-${j + 1}<div class="table-controls">
        <button onclick="addRow(this)">＋Row</button>
        <button onclick="delRow(this)">－Row</button>
        <button onclick="addCol(this)">＋Col</button>
        <button onclick="delCol(this)">－Col</button>
      </div>`;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  noteContentEl.appendChild(table);
  saveCurrentNoteContent();
  rebindTableControls();
}

function rebindTableControls() {
  noteContentEl.querySelectorAll("table td").forEach(td => {
    td.contentEditable = true;
    if (!td.querySelector(".table-controls")) {
      const control = document.createElement("div");
      control.className = "table-controls";
      control.innerHTML = `
        <button onclick="addRow(this)">＋Row</button>
        <button onclick="delRow(this)">－Row</button>
        <button onclick="addCol(this)">＋Col</button>
        <button onclick="delCol(this)">－Col</button>
      `;
      td.appendChild(control);
    }
  });
}

window.addRow = function (btn) {
  const td = btn.closest("td");
  const tr = td.parentElement;
  const table = tr.closest("table");
  const newRow = tr.cloneNode(true);
  newRow.querySelectorAll("td").forEach(cell => {
    cell.innerHTML = "New Cell";
    cell.contentEditable = true;
  });
  table.insertBefore(newRow, tr.nextSibling);
  saveCurrentNoteContent();
};

window.delRow = function (btn) {
  const td = btn.closest("td");
  const tr = td.parentElement;
  const table = tr.closest("table");
  if (table.rows.length > 1) {
    tr.remove();
    saveCurrentNoteContent();
  }
};

window.addCol = function (btn) {
  const td = btn.closest("td");
  const colIndex = [...td.parentElement.children].indexOf(td);
  const table = td.closest("table");

  [...table.rows].forEach(row => {
    const newCell = document.createElement("td");
    newCell.innerHTML = "New Cell";
    newCell.contentEditable = true;
    row.insertBefore(newCell, row.children[colIndex + 1]);
  });
  saveCurrentNoteContent();
};

window.delCol = function (btn) {
  const td = btn.closest("td");
  const colIndex = [...td.parentElement.children].indexOf(td);
  const table = td.closest("table");

  if (table.rows[0].cells.length > 1) {
    [...table.rows].forEach(row => row.removeChild(row.children[colIndex]));
    saveCurrentNoteContent();
  }
};

function exportNote() {
  if (!currentNoteId || !notes[currentNoteId]) {
    alert("No note to export.");
    return;
  }

  const title = notes[currentNoteId].title || "Untitled Note";
  const clone = noteContentEl.cloneNode(true);
  clone.querySelectorAll(".table-controls").forEach(el => el.remove());

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        td, th { border: 1px solid #888; padding: 8px; }
        footer { margin-top: 40px; font-size: 14px; color: #555; text-align: center; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${clone.innerHTML}
      <footer>
        Developed by Faruk Ahmad with ❤️
      </footer>
    </body>
    </html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".html";
  link.click();
}

noteTitleEl.addEventListener("input", () => {
  if (!currentNoteId) return;
  notes[currentNoteId].title = noteTitleEl.value;
  saveNotes();
  renderNoteList();
  statusEl.textContent = "Title saved";
});

noteContentEl.addEventListener("input", saveCurrentNoteContent);
newNoteBtn.onclick = createNewNote;

if (Object.keys(notes).length > 0) {
  loadNote(Object.keys(notes)[0]);
} else {
  createNewNote();
}
