// ===== Helpers: Local Storage (Favorites) =====
const FAV_KEY = 'flavorFavorites';
const getFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
const setFavs = (arr) => localStorage.setItem(FAV_KEY, JSON.stringify(arr));
const isFav = (id) => getFavs().some(x => String(x.id) === String(id));
const addFav = (recipe) => {
  const list = getFavs();
  if (!isFav(recipe.id)) {
    list.push({ id: recipe.id, title: recipe.title, image: recipe.image });
    setFavs(list);
  }
};
const removeFav = (id) => {
  setFavs(getFavs().filter(x => String(x.id) !== String(id)));
};

// ===== UI Helpers =====
function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.className) e.className = opts.className;
  if (opts.text) e.textContent = opts.text;
  if (opts.html) e.innerHTML = opts.html;
  if (opts.attrs) Object.entries(opts.attrs).forEach(([k,v]) => e.setAttribute(k,v));
  return e;
}

function message(target, text, kind = 'empty') {
  target.innerHTML = '';
  const box = el('div', { className: kind, text });
  target.appendChild(box);
}

function recipeCard(r, { showSave = true, showRemove = false } = {}) {
  const card = el('div', { className: 'card' });
  const img = el('img');
  img.src = r.image || 'https://via.placeholder.com/400x300?text=No+Image';
  img.alt = r.title || 'Recipe';

  const content = el('div', { className: 'content' });
  const h3 = el('h3', { text: r.title || 'Untitled' });

  const details = el('div');
  if (r.usedIngredients?.length) {
    const used = el('p', { html: `<strong>Used:</strong> ${r.usedIngredients.join(', ')}` });
    details.appendChild(used);
  }
  if (r.missedIngredients?.length) {
    const missed = el('p', { html: `<strong>Missing:</strong> ${r.missedIngredients.join(', ')}` });
    details.appendChild(missed);
  }

  const actions = el('div', { className: 'actions' });
  const detailsBtn = el('button', { className: 'btn', text: 'View Details' });
  detailsBtn.onclick = () => {
    window.location.href = `/details.html?id=${r.id}`;
  };
  actions.appendChild(detailsBtn);

  if (showSave) {
    const saveBtn = el('button', { className: 'btn primary', text: isFav(r.id) ? 'Saved ✓' : 'Save to Favorites' });
    saveBtn.onclick = () => {
      addFav(r);
      saveBtn.textContent = 'Saved ✓';
    };
    actions.appendChild(saveBtn);
  }

  if (showRemove) {
    const rmBtn = el('button', { className: 'btn danger', text: 'Remove' });
    rmBtn.onclick = () => {
      removeFav(r.id);
      // refresh list
      if (location.pathname.endsWith('favorites.html')) {
        renderFavorites();
      }
    };
    actions.appendChild(rmBtn);
  }

  content.append(h3, details, actions);
  card.append(img, content);
  return card;
}
// ===== Pages =====
async function doSearch() {
  const input = document.getElementById('ingredientsInput');
  const results = document.getElementById('results');
  const messages = document.getElementById('messages');

  const query = (input.value || '').trim();
  results.innerHTML = '';

  if (!query) {
    return message(messages, 'Please enter ingredients, e.g. "chicken, rice"');
  }

  message(messages, 'Searching…');

  try {
    const res = await fetch(`/recipes/search?ingredients=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Request failed');

    messages.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      return message(messages, 'No recipes found for your ingredients.');
    }

    data.forEach(r => {
      results.appendChild(recipeCard(r, { showSave: true }));
    });
  } catch (err) {
    console.error(err);
    message(messages, err.message || 'Something went wrong.', 'error');
  }
}

async function getRandom() {
  const container = document.getElementById('randomContainer');
  const messages = document.getElementById('messages');

  container.innerHTML = '';
  message(messages, 'Fetching a random recipe…');
  try {
    const res = await fetch('/recipes/random');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');

    messages.innerHTML = '';

    const card = el('div', { className: 'card' });
    const img = el('img');
    img.src = data.image || 'https://via.placeholder.com/400x300?text=No+Image';
    img.alt = data.title || 'Recipe';

    const content = el('div', { className: 'content' });
    const h3 = el('h3', { text: data.title || 'Untitled' });

    const ingredients = el('div');
    if (Array.isArray(data.ingredients) && data.ingredients.length) {
      const list = data.ingredients.map(x => `<span class="tag">${x}</span>`).join(' ');
      ingredients.innerHTML = `<div class="tags">${list}</div>`;
    }

    const instr = el('p', { html: `<strong>Instructions:</strong> ${data.instructions}` });

    const actions = el('div', { className: 'actions' });
    const detailsBtn = el('button', { className: 'btn', text: 'View Details' });
    detailsBtn.onclick = () => window.location.href = `/details.html?id=${data.id}`;

    const saveBtn = el('button', { className: 'btn primary', text: isFav(data.id) ? 'Saved ✓' : 'Save to Favorites' });
    saveBtn.onclick = () => { addFav(data); saveBtn.textContent = 'Saved ✓'; };

    actions.append(detailsBtn, saveBtn);
    content.append(h3, ingredients, instr, actions);

    card.append(img, content);
    container.appendChild(card);
  } catch (err) {
    console.error(err);
    message(messages, err.message || 'Something went wrong.', 'error');
  }
}

function renderFavorites() {
  const container = document.getElementById('favoritesContainer');
  const messages = document.getElementById('messages');
  container.innerHTML = '';

  const favs = getFavs();
  if (!favs.length) {
    return message(messages, 'Your favorites list is empty.');
  }
  messages.innerHTML = '';
  favs.forEach(r => {
    container.appendChild(recipeCard(r, { showSave: false, showRemove: true }));
  });
}

async function renderDetailsPage() {
  const container = document.getElementById('details');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    container.innerHTML = '<div class="error">Missing recipe id</div>';
    return;
  }

  container.innerHTML = '<div class="empty">Loading details…</div>';
  try {
    const res = await fetch(`/recipes/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');

    container.innerHTML = '';

    const card = el('div', { className: 'card' });
    const img = el('img');
    img.src = data.image || 'https://via.placeholder.com/400x300?text=No+Image';
    img.alt = data.title || 'Recipe';

    const content = el('div', { className: 'content' });
    const h3 = el('h3', { text: data.title || 'Untitled' });
    const time = el('p', { html: `<strong>Ready in:</strong> ${data.readyInMinutes || '?'} minutes `});

    const summary = el('div', { className: 'summary' });
    summary.innerHTML = data.summary || 'No summary.'; // API returns HTML

    const actions = el('div', { className: 'actions' });
    const saveBtn = el('button', { className: 'btn primary', text: isFav(data.id) ? 'Saved ✓' : 'Save to Favorites' });
    saveBtn.onclick = () => { addFav(data); saveBtn.textContent = 'Saved ✓'; };

    actions.appendChild(saveBtn);
    content.append(h3, time, summary, actions);

    card.append(img, content);
    container.appendChild(card);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="error">${err.message || 'Failed to load details.'}</div>`;
  }
}

// ===== Boot per page =====
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'search') {
    const btn = document.getElementById('searchBtn');
    btn.addEventListener('click', doSearch);
    // Press Enter
    document.getElementById('ingredientsInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });
   

  }
  if (page === 'random') {
    document.getElementById('randomBtn').addEventListener('click', getRandom);
  }

  if (page === 'favorites') {
    renderFavorites();
  }

  if (page === 'details') {
    renderDetailsPage();
  }
});