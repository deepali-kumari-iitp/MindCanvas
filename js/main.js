class MindCanvas {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.notes = [];
        this.draggedNote = null;
        this.colorPicker = document.getElementById('colorPicker');
        this.currentNote = null;
        this.isDark = localStorage.getItem('mindcanvas-theme') === 'dark';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNotes();
        this.applyTheme();
    }

    setupEventListeners() {
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());
        document.getElementById('clearBoardBtn').addEventListener('click', () => this.clearBoard());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Color picker events
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.currentNote) {
                    this.changeNoteColor(this.currentNote, e.target.dataset.color);
                    this.hideColorPicker();
                }
            });
        });

        // Close color picker on outside click
        document.addEventListener('click', (e) => {
            if (!this.colorPicker.contains(e.target) && !e.target.closest('.color-swatch')) {
                this.hideColorPicker();
            }
        });
    }

    addNote(x = 100, y = 100) {
        const note = document.createElement('div');
        note.className = 'sticky-note yellow pop-in tilt';
        note.style.left = x + 'px';
        note.style.top = y + 'px';
        note.draggable = true;

        note.innerHTML = `
            <div class="note-header">
                <div class="color-swatch" data-color="yellow"></div>
                <button class="delete-btn" onclick="mindCanvas.deleteNote(this.parentElement.parentElement)">×</button>
            </div>
            <textarea class="note-textarea" placeholder="Capture your thoughts..."></textarea>
        `;

        note.addEventListener('dragstart', (e) => this.startDrag(e, note));
        note.addEventListener('dragend', (e) => this.endDrag(e, note));
        
        // Color swatch click
        note.querySelector('.color-swatch').addEventListener('click', (e) => {
            this.currentNote = note;
            this.showColorPicker(note);
        });

        // Textarea resize
        const textarea = note.querySelector('.note-textarea');
        textarea.addEventListener('input', () => {
            this.saveNote(note);
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });

        this.canvas.appendChild(note);
        this.notes.push(note);
        
        // Focus new note
        textarea.focus();
        this.saveNotes();
    }

    startDrag(e, note) {
        this.draggedNote = note;
        note.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', note.outerHTML);
    }

    endDrag(e, note) {
        note.classList.remove('dragging');
        this.draggedNote = null;
        this.saveNote(note);
    }

    handleDrop(e) {
        e.preventDefault();
        if (this.draggedNote) {
            const rect = this.canvas.getBoundingClientRect();
            this.draggedNote.style.left = (e.clientX - rect.left - 100) + 'px';
            this.draggedNote.style.top = (e.clientY - rect.top - 60) + 'px';
        }
    }

    deleteNote(note) {
        note.style.animation = 'none';
        note.style.transition = 'opacity 0.3s ease';
        note.style.opacity = '0';
        setTimeout(() => {
            note.remove();
            this.notes = this.notes.filter(n => n !== note);
            this.saveNotes();
        }, 300);
    }

    changeNoteColor(note, color) {
        note.className = `sticky-note ${color}`;
        const swatch = note.querySelector('.color-swatch');
        swatch.dataset.color = color;
        swatch.className = `color-swatch ${color}`;
        this.saveNote(note);
    }

    showColorPicker(note) {
        this.currentNote = note;
        const rect = note.getBoundingClientRect();
        this.colorPicker.style.left = (rect.left + rect.width/2) + 'px';
        this.colorPicker.style.top = (rect.top + rect.height/2) + 'px';
        this.colorPicker.classList.add('active');
    }

    hideColorPicker() {
        this.colorPicker.classList.remove('active');
        this.currentNote = null;
    }

    saveNote(note) {
        const data = {
            id: note.dataset.id || Date.now().toString(),
            x: parseFloat(note.style.left),
            y: parseFloat(note.style.top),
            width: note.offsetWidth,
            height: note.offsetHeight,
            color: note.className.match(/sticky-note\s+(\w+)/)?.[1] || 'yellow',
            text: note.querySelector('.note-textarea').value
        };
        note.dataset.id = data.id;
        localStorage.setItem(`mindcanvas-note-${data.id}`, JSON.stringify(data));
    }

    saveNotes() {
        const notesData = this.notes.map(note => ({
            id: note.dataset.id,
            x: parseFloat(note.style.left),
            y: parseFloat(note.style.top),
            width: note.offsetWidth,
            height: note.offsetHeight,
            color: note.className.match(/sticky-note\s+(\w+)/)?.[1] || 'yellow',
            text: note.querySelector('.note-textarea').value
        }));
        localStorage.setItem('mindcanvas-notes', JSON.stringify(notesData));
    }

    loadNotes() {
        const saved = localStorage.getItem('mindcanvas-notes');
        if (saved) {
            const notesData = JSON.parse(saved);
            notesData.forEach(data => {
                this.addNote(data.x, data.y);
                const note = this.notes[this.notes.length - 1];
                note.dataset.id = data.id;
                note.style.width = data.width + 'px';
                note.style.height = data.height + 'px';
                note.querySelector('.note-textarea').value = data.text;
                this.changeNoteColor(note, data.color);
            });
        }
    }

    clearBoard() {
        if (confirm('Clear all notes? This cannot be undone.')) {
            this.notes.forEach(note => note.remove());
            this.notes = [];
            localStorage.removeItem('mindcanvas-notes');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('mindcanvas-note-')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        document.body.dataset.theme = this.isDark ? 'dark' : '';
        localStorage.setItem('mindcanvas-theme', this.isDark ? 'dark' : 'light');
        document.getElementById('themeToggle').textContent = this.isDark ? '☀️' : '🌙';
    }

    applyTheme() {
        document.body.dataset.theme = this.isDark ? 'dark' : '';
        document.getElementById('themeToggle').textContent = this.isDark ? '☀️' : '🌙';
    }
}

// Touch support for mobile
let startX, startY, draggedElement;

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('sticky-note')) {
        startX = touch.clientX;
        startY = touch.clientY;
        draggedElement = element;
        element.style.transition = 'none';
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!draggedElement) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    draggedElement.style.left = (parseFloat(draggedElement.style.left || 0) + deltaX * 0.8) + 'px';
    draggedElement.style.top = (parseFloat(draggedElement.style.top || 0) + deltaY * 0.8) + 'px';
    startX = touch.clientX;
    startY = touch.clientY;
    
    draggedElement.classList.add('dragging');
}, { passive: false });

document.addEventListener('touchend', () => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        mindCanvas.saveNote(draggedElement);
        draggedElement = null;
    }
}, { passive: true });

// Initialize app
const mindCanvas = new MindCanvas();

// Add first note on first visit
if (!localStorage.getItem('mindcanvas-notes')) {
    setTimeout(() => mindCanvas.addNote(50, 50), 500);
}
