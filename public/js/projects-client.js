// Client-side utility for loading selected works from Cloudflare D1

class ProjectsClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  async getProjects() {
    const response = await fetch(`${this.baseUrl}/api/get-projects`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.projects || [];
  }

  async getProject(id) {
    const response = await fetch(`${this.baseUrl}/api/get-project?id=${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.project || null;
  }

  renderProjects(projects, containerId = 'projects-grid') {
    const container = document.getElementById(containerId);
    if (!container || !projects || projects.length === 0) return;

    container.innerHTML = projects
      .map((project) => {
        const thumb = project.image_url
          ? `<img src="${this.escapeAttr(project.image_url)}" alt="${this.escapeAttr(project.title)}" loading="lazy">`
          : `<span class="project-thumb-placeholder">[CAPTURA DEL PROYECTO]</span>`;

        const category = project.category
          ? `<span class="project-category">${this.escapeHtml(project.category)}</span>`
          : '';

        const href = project.project_url || project.github_url || '';
        const isExternal = /^https?:\/\//i.test(href);
        const linkHint = href
          ? `<span class="project-link-hint">Ver proyecto &rarr;</span>`
          : '';

        const inner = `
          <div class="project-thumb">${thumb}</div>
          ${category}
          <h3 class="project-title">${this.escapeHtml(project.title)}</h3>
          <p class="project-desc">${this.escapeHtml(project.description)}</p>
          ${linkHint}
        `;

        if (href) {
          const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a class="project-card" href="${this.escapeAttr(href)}"${targetAttrs}>${inner}</a>`;
        }

        return `<article class="project-card">${inner}</article>`;
      })
      .join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  escapeAttr(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

window.projectsClient = new ProjectsClient();

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  try {
    const projects = await window.projectsClient.getProjects();
    if (projects.length > 0) {
      window.projectsClient.renderProjects(projects, 'projects-grid');
    }
  } catch (error) {
    // Keep static fallback cards already rendered in HTML
    console.error('Failed to load projects from D1:', error);
  }
});
