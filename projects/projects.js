import { fetchJSON, renderProjects } from '../global.js';

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

try {
  const projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
  renderProjects(projects, projectsContainer, 'h2');
  projectsTitle.textContent = `${projects.length} Projects by David Li`;
} catch {
  projectsContainer.textContent = 'Projects could not be loaded. Please try refreshing the page.';
}
