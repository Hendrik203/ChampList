let allChampions = {}; //Champion list
let myChampionList = []; // Array with List
let currentChampionForModal = null; //speicherort für modal champ
let draggedEntryId = null; //drag & drop
const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const STORAGE_KEY = 'myChampionList';


//Load champion list
async function loadChampions() {
  const response = await fetch('data/champion.json');
  const data = await response.json();
  allChampions = data.data; // champion list unter data.data
  console.log(allChampions);

  loadListFromStorage(); // LOAD
  renderMyList();
}

//Search Champs
function searchChampions(query) {
  const results = [];
  for (const key in allChampions) {
    const champ = allChampions[key];
    // Groß/Klein schreibung = egal
    if (champ.name.toLowerCase().startsWith(query.toLowerCase())) {
      results.push(champ);
    }
  }
  return results;
}

function renderSearchResults(results) {
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  results.forEach(champ => {
    const div = document.createElement('div');
    div.classList.add('result-item');
    div.innerHTML = `
      <img src="https://ddragon.leagueoflegends.com/cdn/16.12.1/img/champion/${champ.image.full}" width="48" height="48">
      <span>${champ.name}</span>
      <button class="add-btn">Add to list</button>
    `;

    const addBtn = div.querySelector('.add-btn');
    addBtn.addEventListener('click', () => {
      openRoleModal(champ.id);
    });

    container.appendChild(div);
  });
}

//addeventlistener = Hört auf tasten
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (query === '') {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  const results = searchChampions(query);
  renderSearchResults(results);
});


// Adds champ
function addChampionToList(championId, role) {
  const alreadyExists = myChampionList.some(
    entry => entry.championId === championId && entry.role === role
  );

  if (alreadyExists) {
    alert(`${allChampions[championId].name} is already in your list as ${role}.`);
    return;
  }

  myChampionList.push({
    entryId: Date.now() + Math.random(),
    championId,
    role
  });
  saveListToStorage();
  renderMyList();

  searchInput.value = '';
  document.getElementById('search-results').innerHTML = '';
}


// activates by drag starts
function handleDragStart(event) {
  draggedEntryId = event.target.dataset.entryId;
  event.target.classList.add('dragging');
}

// while dragging
function handleDragOver(event) {
  event.preventDefault();

  const targetItem = event.target.closest('.list-item');
  if (!targetItem) return;

  // Target same Role?
  const targetRoleSection = targetItem.closest('.role-section');
  const draggedItem = document.querySelector(`[data-entry-id="${draggedEntryId}"]`);
  const draggedRoleSection = draggedItem ? draggedItem.closest('.role-section') : null;

  if (targetRoleSection !== draggedRoleSection) return; // if other Roles

  targetItem.classList.add('drag-over');
}

// activates if target leaves
function handleDragLeave(event) {
  const targetItem = event.target.closest('.list-item');
  if (targetItem) targetItem.classList.remove('drag-over');
}

// activates if you drop
function handleDrop(event) {
  event.preventDefault();

  const targetItem = event.target.closest('.list-item');
  if (!targetItem) return;

  const targetEntryId = targetItem.dataset.entryId;
  targetItem.classList.remove('drag-over');

  if (targetEntryId === draggedEntryId) return;


  const draggedIndex = myChampionList.findIndex(e => String(e.entryId) === draggedEntryId);
  const targetIndex = myChampionList.findIndex(e => String(e.entryId) === targetEntryId);

  if (myChampionList[draggedIndex].role !== myChampionList[targetIndex].role) return;

  const [draggedEntry] = myChampionList.splice(draggedIndex, 1);
  myChampionList.splice(targetIndex, 0, draggedEntry);

  saveListToStorage();
  renderMyList();
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging');
  draggedEntryId = null;
}


// List with champs and roles
function renderMyList() {
  const container = document.getElementById('champion-list');
  container.innerHTML = '';

  ROLES.forEach(role => {
    const entriesForRole = myChampionList.filter(entry => entry.role === role);
    if (entriesForRole.length === 0) return;

    const roleSection = document.createElement('div');
    roleSection.classList.add('role-section');
    roleSection.dataset.role = role;

    const heading = document.createElement('h3');
    heading.textContent = role;
    roleSection.appendChild(heading);

    entriesForRole.forEach(entry => {
      const champ = allChampions[entry.championId];
      const champDiv = document.createElement('div');
      champDiv.classList.add('list-item');
      champDiv.draggable = true;
      champDiv.dataset.entryId = entry.entryId;


      champDiv.innerHTML = `
        <img src="https://ddragon.leagueoflegends.com/cdn/16.12.1/img/champion/${champ.image.full}" width="32" height="32">
        <span>${champ.name}</span>
        <a href="${buildOpggUrl(champ.name)}" target="_blank" rel="noopener noreferrer" class="statlink">Stats</a>
        <span class="spacer"></span>
        <select class="role-select">
          ${ROLES.map(r => `<option value="${r}" ${r === entry.role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <button class="remove-btn">Remove</button>
      `;

      // Change roles
      const roleSelect = champDiv.querySelector('.role-select');
      roleSelect.addEventListener('change', () => {
        changeEntryRole(entry.entryId, roleSelect.value);
      });

      // Remove champs
      const removeBtn = champDiv.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        removeFromList(entry.entryId);
      });

      //Drag & Drop Event-Listener
      champDiv.addEventListener('dragstart', handleDragStart);
      champDiv.addEventListener('dragover', handleDragOver);
      champDiv.addEventListener('dragleave', handleDragLeave);
      champDiv.addEventListener('drop', handleDrop);
      champDiv.addEventListener('dragend', handleDragEnd);


      roleSection.appendChild(champDiv);
    });

    container.appendChild(roleSection);
  });
}

// Remove Champ
function removeFromList(entryId) {
  myChampionList = myChampionList.filter(entry => entry.entryId !== entryId);
  saveListToStorage();
  renderMyList();
}

// Changes Role
function changeEntryRole(entryId, newRole) {
  const entry = myChampionList.find(e => e.entryId === entryId);

  // Proofs same note
  const duplicate = myChampionList.some(
    e => e.championId === entry.championId && e.role === newRole && e.entryId !== entryId
  );

  if (duplicate) {
    alert(`${allChampions[entry.championId].name} is already in your list as ${newRole}.`);
    renderMyList();
    return;
  }

  entry.role = newRole;
  saveListToStorage();
  renderMyList();
}

// Saves list in localStorage
function saveListToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(myChampionList));
}

// Loads list in localStorage
function loadListFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    myChampionList = JSON.parse(stored);
  }
}

// SVG-ICONS
const ROLE_ICONS = {
  Top: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2L4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>`,
  Jungle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8 2 5 6 5 10c0 3 1.5 5.5 4 7-1 2-2 3-3 3.5v1.5h12v-1.5c-1-0.5-2-1.5-3-3.5 2.5-1.5 4-4 4-7 0-4-3-8-7-8z"/></svg>`,
  Mid: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18.5 22 12 17l-6.5 5 2-8.5L2 9h7z"/></svg>`,
  ADC: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 12l9-9 1.5 1.5L7.8 9H22v2H7.8l4.7 4.5L11 17z"/></svg>`,
  Support: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21s-8-5-8-11c0-3 2.5-5.5 5.5-5.5 1.5 0 3 0.7 4 1.8 1-1.1 2.5-1.8 4-1.8 3 0 5.5 2.5 5.5 5.5 0 6-8 11-8 11z"/></svg>`
};

function openRoleModal(championId) {
  currentChampionForModal = championId;
  document.getElementById('role-modal').classList.remove('hidden');
}

// remove modal
function closeRoleModal() {
  currentChampionForModal = null;
  document.getElementById('role-modal').classList.add('hidden');
}

document.querySelectorAll('.modal-role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    addChampionToList(currentChampionForModal, btn.dataset.role);
    closeRoleModal();
  });
});

document.getElementById('modal-close-btn').addEventListener('click', closeRoleModal);

function buildOpggUrl(championName) {
  const formattedName = championName.toLowerCase().replace(" ", "");
  return `https://op.gg/lol/champions/${formattedName}/build`;
}




//download json
function exportList() {
  const dataStr = JSON.stringify(myChampionList, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `champ-backup-${today}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

//import json
function importList(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const importedList = JSON.parse(event.target.result);

      if (!Array.isArray(importedList)) {
        alert('This file does not look like a valid backup.');
        return;
      }

      myChampionList = importedList;
      saveListToStorage();
      renderMyList();
      alert('Backup restored successfully!');
    } catch (error) {
      alert('Could not read this file. Make sure it is a valid backup file.');
    }
  };

  reader.readAsText(file);
}

document.getElementById('export-btn').addEventListener('click', exportList);

document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    importList(file);
  }
  event.target.value = '';
});

loadChampions();