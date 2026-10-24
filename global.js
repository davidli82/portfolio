console.log('IT’S ALIVE!');

// Lab 4: shared data loading and project rendering.
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    throw error;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!(containerElement instanceof Element)) {
    throw new TypeError('A valid project container is required.');
  }
  if (!Array.isArray(projects)) {
    throw new TypeError('Projects must be an array.');
  }
  if (!/^h[1-6]$/.test(headingLevel)) {
    throw new TypeError('Heading level must be h1 through h6.');
  }

  containerElement.replaceChildren();
  if (projects.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No projects to display yet.';
    containerElement.append(message);
    return;
  }

  const fallbackImage = new URL('images/project-placeholder.svg', import.meta.url).href;
  for (const project of projects) {
    const article = document.createElement('article');
    // Template structure is shared; data is inserted as text, not parsed as HTML.
    article.innerHTML = `
      <${headingLevel}></${headingLevel}>
      <img loading="lazy" width="640" height="360">
      <p class="project-description"></p>
    `;
    const title = project?.title || 'Untitled project';
    const heading = article.querySelector(headingLevel);
    if (project?.url && /^https?:\/\//.test(project.url)) {
      const link = document.createElement('a');
      link.href = project.url;
      link.textContent = title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      heading.append(link);
    } else {
      heading.textContent = title;
    }
    const image = article.querySelector('img');
    image.alt = project?.imageAlt || `Illustration for ${title}`;
    image.addEventListener('error', () => { image.src = fallbackImage; }, { once: true });
    image.src = project?.image ? new URL(project.image, import.meta.url).href : fallbackImage;
    const description = article.querySelector('p');
    description.textContent = project?.description || 'Description coming soon.';
    if (project?.year) {
      const year = document.createElement('span');
      year.className = 'project-year';
      year.textContent = project.year;
      description.append(year);
    }
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}

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
