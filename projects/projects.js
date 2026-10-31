import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const status = document.querySelector('.projects-status');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().sort(null).value(d => d.value);
const colors = d3.scaleOrdinal(d3.schemeTableau10);
let projects = [];
let query = '';
// Store the year, since a slice's index may change after searching.
let selectedYear = null;

function renderPieChart(projectsGiven) {
  const data = d3.rollups(projectsGiven, group => group.length, project => String(project.year))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => d3.descending(a.label, b.label));

  // Keyed joins update existing elements and remove obsolete slices/legend entries.
  svg.selectAll('path')
    .data(sliceGenerator(data), d => d.data.label)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', d => colors(d.data.label))
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', d => `${d.data.label}: ${d.data.value} projects. Filter by this year`)
    .on('click', (_, d) => toggleYear(d.data.label))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleYear(d.data.label);
      }
    })
    .selectAll('title')
    .data(d => [d])
    .join('title')
    .text(d => `${d.data.label}: ${d.data.value} projects`);

  const entries = legend.selectAll('li')
    .data(data, d => d.label)
    .join('li')
    .attr('class', 'legend-item')
    .style('--color', d => colors(d.label));
  const buttons = entries.selectAll('button')
    .data(d => [d])
    .join('button')
    .attr('type', 'button')
    .on('click', (_, d) => toggleYear(d.label));
  buttons.selectAll('.swatch').data(d => [d]).join('span')
    .attr('class', 'swatch').attr('aria-hidden', 'true');
  buttons.selectAll('.legend-label').data(d => [d]).join('span')
    .attr('class', 'legend-label').text(d => d.label);
  buttons.selectAll('em').data(d => [d]).join('em').text(d => `(${d.value})`);
  document.querySelector('.chart-empty').hidden = data.length > 0;
}

function updateSelection() {
  svg.selectAll('path')
    .classed('selected', d => d.data.label === selectedYear)
    .attr('aria-pressed', d => String(d.data.label === selectedYear));
  legend.selectAll('li').classed('selected', d => d.label === selectedYear);
  legend.selectAll('button').attr('aria-pressed', d => String(d.label === selectedYear));
}

function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updateProjects();
}

function updateProjects() {
  // Both filters share this pipeline, regardless of which control changed first.
  const searchMatches = projects.filter(project =>
    Object.values(project).join('\n').toLowerCase().includes(query));
  const visibleProjects = searchMatches.filter(project =>
    selectedYear === null || String(project.year) === selectedYear);
  renderProjects(visibleProjects, projectsContainer, 'h2');
  status.textContent = `Showing ${visibleProjects.length} of ${projects.length} projects${selectedYear === null ? '' : ` · Year: ${selectedYear}`}`;
  if (!visibleProjects.length) {
    projectsContainer.querySelector('p').textContent = 'No matching projects. Try another search or deselect the year filter.';
  }
  updateSelection();
}

try {
  projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
  colors.domain([...new Set(projects.map(project => String(project.year)))].sort(d3.descending));
  projectsTitle.textContent = `${projects.length} Projects by David Li`;
  renderPieChart(projects);
  updateProjects();
  searchInput.disabled = false;
  searchInput.addEventListener('input', event => {
    query = event.target.value.toLowerCase();
    const searchMatches = projects.filter(project =>
      Object.values(project).join('\n').toLowerCase().includes(query));
    // Clear a selection that no longer exists in the search results.
    if (!searchMatches.some(project => String(project.year) === selectedYear)) selectedYear = null;
    renderPieChart(searchMatches);
    updateProjects();
  });
} catch {
  projectsContainer.textContent = 'Projects could not be loaded. Please try refreshing the page.';
}
