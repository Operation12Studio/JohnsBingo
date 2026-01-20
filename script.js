// --- Global State ---
let items = [];
let penaltyItems = [];

// --- Theme handling ---
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.children[0].classList.toggle('active', theme === 'light');
    toggle.children[1].classList.toggle('active', theme === 'dark');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function setThemePreset(preset) {
  const themes = {
    'carbon-dark': 'dark',
    'light-clean': 'light',
    'neon-glow': 'neon',
    'purple-haze': 'purple'
  };
  setTheme(themes[preset] || 'dark');
}

// --- UI Controls & Sections ---
function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('show');
}

function toggleItemsSection() {
  const section = document.getElementById('itemsSection');
  const arrow = document.querySelector('.collapse-arrow');
  section.classList.toggle('collapsed');
  arrow.classList.toggle('rotated');
}

function togglePenaltySection() {
  const section = document.getElementById('penaltySection');
  const arrow = document.querySelector('.penalty-collapse-arrow');
  section.classList.toggle('collapsed');
  arrow.classList.toggle('rotated');
}

function applySettings() {
  const size = document.getElementById('textSize').value;
  const accent = document.getElementById('accentColor').value;
  const marked = document.getElementById('markedColor').value;
  const freeC = document.getElementById('freeColor').value;

  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--marked', marked);
  document.documentElement.style.setProperty('--free', freeC);

  document.querySelectorAll('td').forEach(td => {
    td.style.fontSize = `${size}rem`;
  });
  toggleSettings();
}

// --- Custom Dropdowns ---
document.querySelectorAll('.custom-select').forEach(selectEl => {
  const selected = selectEl.querySelector('.selected');
  const options = selectEl.querySelector('.options');

  selected.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open').forEach(other => {
      if (other !== selectEl) other.classList.remove('open');
    });
    selectEl.classList.toggle('open');
  });

  options.addEventListener('click', e => {
    if (e.target.classList.contains('option')) {
      const value = e.target.dataset.value;
      const text = e.target.textContent;
      selectEl.dataset.value = value;
      selected.querySelector('span').textContent = text;
      selectEl.classList.remove('open');
      updateCounter();
      saveState();
    }
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.custom-select')) {
    document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
  }
});

// --- Item Management ---
const itemInput = document.getElementById('itemInput');
const itemsList = document.getElementById('itemsList');
const itemCounter = document.getElementById('itemCounter');

function getRequiredItems() {
  const size = parseInt(document.getElementById('sizeSelect').dataset.value || 5);
  const useFree = document.getElementById('freeSelect').dataset.value === 'yes';
  return size * size - (useFree ? 1 : 0);
}

function updateCounter() {
  const required = getRequiredItems();
  if (itemCounter) itemCounter.textContent = `${items.length}/${required} items`;
}

function renderItems() {
  if (!itemsList) return;
  itemsList.innerHTML = '';
  items.forEach((text, i) => {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `<span>${text}</span><i class="fas fa-times" onclick="deleteItem(${i})"></i>`;
    bubble.onclick = e => { if (e.target.tagName !== 'I') editItem(bubble, i); };
    itemsList.appendChild(bubble);
  });
  updateCounter();
}

function addItem() {
  const val = itemInput.value.trim();
  if (val) {
    items.push(val);
    itemInput.value = '';
    renderItems();
    saveState();
  }
}

function deleteItem(idx) {
  items.splice(idx, 1);
  renderItems();
  saveState();
}

function editItem(bubble, idx) {
  const span = bubble.querySelector('span');
  const input = document.createElement('input');
  input.value = items[idx];
  input.style.width = '100%';
  input.onblur = () => {
    items[idx] = input.value.trim() || items[idx];
    renderItems();
    saveState();
  };
  input.onkeydown = e => { if (e.key === 'Enter') input.blur(); };
  span.replaceWith(input);
  input.focus();
}

if (itemInput) {
  itemInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  });
}

function clearList() {
  if (confirm("Clear the entire list? This cannot be undone.")) {
    items = [];
    renderItems();
    saveState();
  }
}

// --- Penalty Management ---
function addPenaltyItem() {
  const input = document.getElementById('penaltyInput');
  const typeSelect = document.getElementById('penaltyTypeSelect'); // This is the custom-select div
  const name = input.value.trim();
  
  // FIX: Use .dataset.value instead of .value
  const type = typeSelect.dataset.value; 
  
  if (name) {
    penaltyItems.push({ name, type });
    input.value = '';
    renderPenaltyItems();
    saveState();
  }
}

function deletePenaltyItem(idx) {
  penaltyItems.splice(idx, 1);
  renderPenaltyItems();
  saveState();
}

function renderPenaltyItems() {
  const list = document.getElementById('penaltyList');
  const btnContainer = document.getElementById('penaltyButtons');
  if (!list || !btnContainer) return;

  list.innerHTML = '';
  btnContainer.innerHTML = '';

  penaltyItems.forEach((item, i) => {
    // Determine the color class based on type
    const colorClass = item.type === 'random' ? 'penalty-type-random' : 'penalty-type-clear';

    // 1. Render in the sidebar list
    const bubble = document.createElement('div');
    bubble.className = `bubble ${colorClass}`;
    bubble.innerHTML = `
      <span>${item.name} <span class="penalty-tag">(${item.type === 'random' ? 'RANDOM' : 'CLEAR'})</span></span>
      <i class="fas fa-times" onclick="deletePenaltyItem(${i})"></i>
    `;
    list.appendChild(bubble);

    // 2. Render as buttons under the board
    const pBtn = document.createElement('button');
    pBtn.className = `penalty-action-btn ${colorClass}`;
    pBtn.innerHTML = `<i class="fas ${item.type === 'random' ? 'fa-dice' : 'fa-bomb'}"></i> ${item.name}`;
    pBtn.onclick = () => triggerPenalty(item.type);
    btnContainer.appendChild(pBtn);
  });
}

function triggerPenalty(type) {
  // Only target squares that are marked and DON'T have the protected class
  const targetableCells = Array.from(document.querySelectorAll('#bingoTable td.marked:not(.protected)'));
  
  if (targetableCells.length === 0) {
    return alert("No unprotected squares to penalize!");
  }

  if (type === 'clear') {
    targetableCells.forEach(cell => cell.classList.remove('marked'));
    saveBoardState();
    checkBingo(); // Re-run to update any protection status if needed
  } else {
    runRandomPenaltyAnimation(targetableCells);
  }
}

function runRandomPenaltyAnimation(cells) {
  let count = 0;
  let lastIdx = -1;

  // --- SETTINGS ---
  const jumpSpeed = 400;      
  const finalPause = 5000;    // 5-second slow fade
  const totalJumps = 10;      
  // ----------------

  const interval = setInterval(() => {
    cells.forEach(c => c.classList.remove('penalty-highlight'));
    
    let currentIdx;
    do {
      currentIdx = Math.floor(Math.random() * cells.length);
    } while (currentIdx === lastIdx && cells.length > 1);
    
    cells[currentIdx].classList.add('penalty-highlight');
    lastIdx = currentIdx;
    count++;

    if (count >= totalJumps) {
      clearInterval(interval);
      
      setTimeout(() => {
        const target = cells[currentIdx];
        target.classList.remove('penalty-highlight');

        // 1. Capture the "marked" color from CSS variables so the transition has a starting point
        const markedColor = getComputedStyle(document.documentElement).getPropertyValue('--marked').trim();
        
        // 2. Set the background color manually so it doesn't "snap" when we remove the class
        target.style.backgroundColor = markedColor;

        // 3. Apply the long transition
        target.style.transition = `background-color ${finalPause}ms cubic-bezier(0.4, 0, 0.2, 1), 
                                   opacity ${finalPause}ms ease, 
                                   transform ${finalPause}ms ease`;

        // 4. Remove the class (the color stays because of step 2)
        target.classList.remove('marked');

        // 5. Use a tiny timeout to trigger the fade to "transparent" or board color
        setTimeout(() => {
            target.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; // Match your glass-bg
            target.style.transform = "scale(0.9)";
            target.style.opacity = "0.7";
        }, 50);

        // 6. Cleanup after the 5 seconds are up
        setTimeout(() => {
          target.style.transition = ""; 
          target.style.backgroundColor = "";
          target.style.transform = "";
          target.style.opacity = "";
          saveBoardState();
        }, finalPause);

      }, 300); 
    }
  }, jumpSpeed);
}

// --- Word List Management ---
function getWordLists() {
  const lists = localStorage.getItem('wordLists');
  return lists ? JSON.parse(lists) : {};
}

function saveWordList() {
  if (!items.length) return alert("Nothing to save!");
  const listName = prompt("Enter a name for this word list:");
  if (!listName || !listName.trim()) return;
  const wordLists = getWordLists();
  wordLists[listName.trim()] = items;
  localStorage.setItem('wordLists', JSON.stringify(wordLists));
  alert(`Word list "${listName}" saved!`);
}

function showWordListManager(mode) {
  const modal = document.getElementById('wordListModal');
  const listContainer = document.getElementById('savedListsContainer');
  const modalTitle = document.getElementById('modalTitle');
  modalTitle.textContent = mode === 'load' ? 'Load Word List' : 'Add Words from List';
  
  const wordLists = getWordLists();
  const listNames = Object.keys(wordLists);
  
  if (listNames.length === 0) {
    listContainer.innerHTML = '<p style="opacity: 0.6; text-align: center; padding: 2rem;">No saved word lists yet.</p>';
  } else {
    listContainer.innerHTML = '';
    listNames.forEach(name => {
      const listItem = document.createElement('div');
      listItem.className = 'word-list-item';
      listItem.innerHTML = `
        <div class="list-info"><strong>${name}</strong><span>${wordLists[name].length} items</span></div>
        <div class="list-actions">
          <button onclick="loadWordList('${name}', '${mode}')">${mode === 'load' ? 'Load' : 'Add'}</button>
          <button class="delete-btn" onclick="deleteWordList('${name}')"><i class="fas fa-trash"></i></button>
        </div>`;
      listContainer.appendChild(listItem);
    });
  }
  modal.style.display = 'flex';
}

function loadWordList(name, mode) {
  const list = getWordLists()[name];
  if (!list) return alert("Word list not found!");
  if (mode === 'load') { items = [...list]; } 
  else { const existing = new Set(items); list.forEach(item => !existing.has(item) && items.push(item)); }
  renderItems();
  saveState();
  closeWordListModal();
}

function deleteWordList(name) {
  if (!confirm(`Delete word list "${name}"?`)) return;
  const wordLists = getWordLists();
  delete wordLists[name];
  localStorage.setItem('wordLists', JSON.stringify(wordLists));
  const mode = document.getElementById('modalTitle').textContent.includes('Load') ? 'load' : 'add';
  showWordListManager(mode);
}

function closeWordListModal() { document.getElementById('wordListModal').style.display = 'none'; }

function exportAllWordLists() {
  const wordLists = getWordLists();
  if (Object.keys(wordLists).length === 0) return alert("No word lists to export!");
  const dataStr = JSON.stringify(wordLists, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'bingo-word-lists.json'; a.click();
  URL.revokeObjectURL(url);
}

// --- Bingo Generation ---
function generateBingo() {
  const required = getRequiredItems();
  if (items.length < required) return alert(`Need at least ${required} items!`);

  const title = document.getElementById('boardTitleDisplay').textContent.trim() || "BINGO";
  const size = parseInt(document.getElementById('sizeSelect').dataset.value);
  const useFree = document.getElementById('freeSelect').dataset.value === 'yes';

  const shuffled = [...items].sort(() => Math.random() - 0.5);
  let idx = 0;

  const table = document.getElementById('bingoTable');
  table.innerHTML = '';
  const bingoTitle = document.getElementById('bingoTitle');
  bingoTitle.textContent = title;
  bingoTitle.style.display = 'block';

  for (let r = 0; r < size; r++) {
    const row = document.createElement('tr');
    for (let c = 0; c < size; c++) {
      const td = document.createElement('td');
      const isCenter = useFree && r === Math.floor(size/2) && c === Math.floor(size/2);
      td.textContent = isCenter ? "FREE" : shuffled[idx++];
      if (isCenter) td.classList.add('free');
      td.addEventListener('click', () => {
        td.classList.toggle('marked');
        checkBingo();
        saveBoardState();
      });
      row.appendChild(td);
    }
    table.appendChild(row);
  }

  const txtSize = document.getElementById('textSize').value;
  document.querySelectorAll('td').forEach(td => td.style.fontSize = `${txtSize}rem`);
  
  const commands = generateUniqueCommands(shuffled.slice(0, required));
  document.getElementById('commandList').innerHTML = '<strong>Chat Commands:</strong><br>' +
    shuffled.slice(0, required).map((it, i) => `!${commands[i]} → ${it}`).join('<br>');
	
  localStorage.setItem('bingoBoard', JSON.stringify({ size, useFree, title, cells: shuffled.slice(0, required) }));
  saveBoardState();
}

function generateUniqueCommands(itemsList) {
  const codes = [];
  const used = new Set();
  itemsList.forEach(item => {
    let clean = item.replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9]/gi, '');
    let len = 3;
    let code = clean.substring(0, len) || 'itm';
    while (used.has(code) && len <= clean.length) { len++; code = clean.substring(0, len); }
    if (used.has(code)) code = 'item' + (codes.length + 1);
    used.add(code);
    codes.push(code);
  });
  return codes;
}

function checkBingo() {
  const size = parseInt(document.getElementById('sizeSelect').dataset.value);
  const cells = Array.from(document.querySelectorAll('#bingoTable td'));
  const winCondition = document.getElementById('winConditionSelect').dataset.value;
  let bingo = false;

  const isMarked = (c) => c && (c.classList.contains('marked') || c.classList.contains('free'));

  // --- BATTLE MODE PROTECTION LOGIC ---
  if (winCondition === 'battle') {
    let protectedIndices = new Set();

    // Check Rows
    for (let i = 0; i < size; i++) {
      let row = [];
      for (let j = 0; j < size; j++) row.push(i * size + j);
      if (row.every(idx => isMarked(cells[idx]))) row.forEach(idx => protectedIndices.add(idx));
    }
    // Check Columns
    for (let i = 0; i < size; i++) {
      let col = [];
      for (let j = 0; j < size; j++) col.push(j * size + i);
      if (col.every(idx => isMarked(cells[idx]))) col.forEach(idx => protectedIndices.add(idx));
    }
    // Check Diagonals
    let d1 = [], d2 = [];
    for (let i = 0; i < size; i++) {
      d1.push(i * size + i);
      d2.push(i * size + (size - 1 - i));
    }
    if (d1.every(idx => isMarked(cells[idx]))) d1.forEach(idx => protectedIndices.add(idx));
    if (d2.every(idx => isMarked(cells[idx]))) d2.forEach(idx => protectedIndices.add(idx));

    // Apply or remove protection
    cells.forEach((cell, idx) => {
      if (protectedIndices.has(idx)) {
        // If it wasn't protected before, but now it is, trigger a mini effect
        if (!cell.classList.contains('protected')) {
          cell.classList.add('protected');
          // Optional: Tiny rainbow pop when a square gets shielded
          confetti({
            particleCount: 5,
            spread: 20,
            origin: { 
              x: cell.getBoundingClientRect().left / window.innerWidth,
              y: cell.getBoundingClientRect().top / window.innerHeight 
            },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
          });
        }
      } else {
        cell.classList.remove('protected');
      }
    });

    // In Battle Mode, Win = Blackout
    bingo = cells.every(isMarked);
  } 
  // --- OTHER WIN CONDITIONS ---
  else {
    // Remove any leftover gold if mode was switched
    cells.forEach(c => c.classList.remove('protected'));
    
    if (winCondition === 'standard') {
      // Check Rows
      for (let i = 0; i < size; i++) {
        let rowIndices = [];
        for (let j = 0; j < size; j++) rowIndices.push(i * size + j);
        if (rowIndices.every(idx => isMarked(cells[idx]))) bingo = true;
      }
      // Check Columns
      for (let i = 0; i < size; i++) {
        let colIndices = [];
        for (let j = 0; j < size; j++) colIndices.push(j * size + i);
        if (colIndices.every(idx => isMarked(cells[idx]))) bingo = true;
      }
      // Check Diagonals
      let d1 = [], d2 = [];
      for (let i = 0; i < size; i++) {
        d1.push(i * size + i);
        d2.push(i * size + (size - 1 - i));
      }
      if (d1.every(idx => isMarked(cells[idx]))) bingo = true;
      if (d2.every(idx => isMarked(cells[idx]))) bingo = true;

    } else if (winCondition === 'blackout') {
      bingo = cells.every(isMarked);
    } else if (winCondition === 'corners') {
      bingo = [cells[0], cells[size-1], cells[size*(size-1)], cells[size*size-1]].every(isMarked);
    } else if (winCondition === 'x-pattern') {
      let d1 = true, d2 = true;
      for (let i = 0; i < size; i++) {
        if (!isMarked(cells[i * size + i])) d1 = false;
        if (!isMarked(cells[i * size + (size - 1 - i)])) d2 = false;
      }
      bingo = d1 && d2;
    } else if (winCondition === 'plus-pattern') {
      const mid = Math.floor(size / 2);
      let rOk = true, cOk = true;
      for (let i = 0; i < size; i++) {
        if (!isMarked(cells[mid * size + i])) rOk = false;
        if (!isMarked(cells[i * size + mid])) cOk = false;
      }
      bingo = rOk && cOk;
    }
  } // End of win condition logic

  if (bingo) {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => alert("🎉 B I N G O ! 🎉"), 600);
  }
}

// --- Save and Load State ---
function saveState() {
  const state = {
    items: items,
    penaltyItems: penaltyItems,
    title: document.getElementById('boardTitleDisplay').textContent.trim(),
    size: document.getElementById('sizeSelect').dataset.value,
    freeSpace: document.getElementById('freeSelect').dataset.value,
    winCondition: document.getElementById('winConditionSelect').dataset.value
  };
  localStorage.setItem('bingoState', JSON.stringify(state));
}

function saveBoardState() {
  const cells = Array.from(document.querySelectorAll('#bingoTable td'));
  const markedCells = cells.map((cell, idx) => ({ index: idx, marked: cell.classList.contains('marked') }));
  localStorage.setItem('bingoBoardState', JSON.stringify(markedCells));
}

function loadState() {
  const saved = localStorage.getItem('bingoState');
  if (saved) {
    const state = JSON.parse(saved);
    items = state.items || [];
    penaltyItems = state.penaltyItems || [];
    document.getElementById('boardTitleDisplay').textContent = state.title || 'BINGO NAME HERE';
    
    if (state.size) {
      document.getElementById('sizeSelect').dataset.value = state.size;
      const sizeTxt = state.size === '3' ? '3×3 Mini' : state.size === '4' ? '4×4 Classic' : '5×5 Epic';
      document.querySelector('#sizeSelect .selected span').textContent = sizeTxt;
    }
    if (state.freeSpace) {
      document.getElementById('freeSelect').dataset.value = state.freeSpace;
      document.querySelector('#freeSelect .selected span').textContent = state.freeSpace === 'yes' ? 'Yes (center)' : 'No';
    }
    if (state.winCondition) {
	  document.getElementById('winConditionSelect').dataset.value = state.winCondition;
	  const winTexts = { 
		'standard': 'Standard (Lines)', 
		'blackout': 'Blackout (All)', 
		'battle': 'Battle Mode (Shields)', // Add this
		'corners': 'Four Corners', 
		'x-pattern': 'X Pattern', 
		'plus-pattern': '+ Pattern' 
	  };
	  document.querySelector('#winConditionSelect .selected span').textContent = winTexts[state.winCondition];
	}
    renderItems();
    renderPenaltyItems();
  }
  
  const savedBoard = localStorage.getItem('bingoBoard');
  if (savedBoard) restoreBoard(JSON.parse(savedBoard));
}

function restoreBoard(boardLayout) {
  const { size, useFree, title, cells } = boardLayout;
  const table = document.getElementById('bingoTable');
  table.innerHTML = '';
  const bingoTitle = document.getElementById('bingoTitle');
  bingoTitle.textContent = title;
  bingoTitle.style.display = 'block';

  let idx = 0;
  for (let r = 0; r < size; r++) {
    const row = document.createElement('tr');
    for (let c = 0; c < size; c++) {
      const td = document.createElement('td');
      const isCenter = useFree && r === Math.floor(size/2) && c === Math.floor(size/2);
      td.textContent = isCenter ? "FREE" : cells[idx++];
      if (isCenter) td.classList.add('free');
      td.addEventListener('click', () => { td.classList.toggle('marked'); checkBingo(); saveBoardState(); });
      row.appendChild(td);
    }
    table.appendChild(row);
  }

  const markedCells = JSON.parse(localStorage.getItem('bingoBoardState') || '[]');
  const tableCells = Array.from(document.querySelectorAll('#bingoTable td'));
  markedCells.forEach(data => { if (data.marked && tableCells[data.index]) tableCells[data.index].classList.add('marked'); });

  const commands = generateUniqueCommands(cells);
  document.getElementById('commandList').innerHTML = '<strong>Chat Commands:</strong><br>' +
    cells.map((it, i) => `!${commands[i]} → ${it}`).join('<br>');
}

function deleteBoard() {
  if (confirm("Delete the current board? This cannot be undone.")) {
    localStorage.removeItem('bingoBoard');
    localStorage.removeItem('bingoBoardState');
    document.getElementById('bingoTable').innerHTML = '';
    document.getElementById('bingoTitle').style.display = 'none';
    document.getElementById('commandList').innerHTML = '';
  }
}

// --- Initialization ---
document.getElementById('boardTitleDisplay').addEventListener('input', saveState);
if (localStorage.getItem('theme')) setTheme(localStorage.getItem('theme'));
else setTheme('dark');

loadState();
updateCounter();