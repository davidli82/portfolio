console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Lab 3, steps 2–3: generate the same navigation on every page.
// Resolve against this module so localhost and GitHub Pages subfolders both work.
const BASE_PATH = new URL('.', import.meta.url);
const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/davidli82', title: 'GitHub' },
];

const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Main navigation');
document.body.prepend(nav);

// Treat /contact/ and /contact/index.html as the same page.
function pagePath(pathname) {
  return pathname.replace(/index\.html$/, '').replace(/\/$/, '');
}

for (const page of pages) {
  const link = document.createElement('a');
  link.href = new URL(page.url, BASE_PATH).href;
  link.textContent = page.title;

  if (link.host === location.host && pagePath(link.pathname) === pagePath(location.pathname)) {
    link.classList.add('current');
    link.setAttribute('aria-current', 'page');
  }

  if (link.host !== location.host) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  nav.append(link);
}

// Step 4: generate a labeled theme selector and persist its selection.
const switcher = document.createElement('label');
switcher.className = 'color-scheme';
switcher.textContent = 'Theme: ';
const select = document.createElement('select');
for (const [value, title] of [
  ['light dark', 'Automatic'],
  ['light', 'Light'],
  ['dark', 'Dark'],
]) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = title;
  select.append(option);
}
switcher.append(select);
document.body.prepend(switcher);

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

try {
  const savedScheme = localStorage.getItem('colorScheme');
  if ($$('option', select).some(option => option.value === savedScheme)) {
    setColorScheme(savedScheme);
  }
} catch {
  // Theme switching still works when browser storage is unavailable.
}

select.addEventListener('input', event => {
  const colorScheme = event.target.value;
  setColorScheme(colorScheme);
  try {
    localStorage.setItem('colorScheme', colorScheme);
  } catch {
    // Keep the selection for this page even if it cannot be saved.
  }
});

// Step 5 (optional): percent-encode the subject and body for email clients.
const form = document.querySelector('form[action^="mailto:"]');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const parameters = [];
  for (const [name, value] of data) {
    parameters.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }
  location.href = `${form.action}?${parameters.join('&')}`;
});
