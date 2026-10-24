import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadLatestProjects() {
  const projectsContainer = document.querySelector('.projects');
  if (!projectsContainer) return;
  try {
    const projects = await fetchJSON(new URL('./lib/projects.json', import.meta.url));
    renderProjects(projects.slice(0, 3), projectsContainer, 'h3');
  } catch {
    projectsContainer.textContent = 'Projects could not be loaded. Please try refreshing the page.';
  }
}

async function loadProfileStats() {
  const profileStats = document.querySelector('#profile-stats');
  if (!profileStats) return;
  try {
    const githubData = await fetchGitHubData('davidli82');
    profileStats.innerHTML = '<dl></dl>';
    const list = profileStats.querySelector('dl');
    for (const [label, value] of [
      ['Public Repos', githubData.public_repos],
      ['Public Gists', githubData.public_gists],
      ['Followers', githubData.followers],
      ['Following', githubData.following],
    ]) {
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = label;
      detail.textContent = value ?? 'Unavailable';
      list.append(term, detail);
    }
  } catch {
    profileStats.textContent = 'GitHub statistics are unavailable right now. Please try again later.';
  }
}

// Load independently so an API failure never prevents project rendering.
await Promise.all([loadLatestProjects(), loadProfileStats()]);
