// Client-side database utility for loading projects dynamically

class ProjectsClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  async getProjects() {
    try {
      const response = await fetch(`${this.baseUrl}/api/get-projects`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getProject(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/get-project?id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.project || null;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  // Render projects in the existing format
  renderProjects(projects, containerId = 'projects-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    if (!projects || projects.length === 0) {
      container.innerHTML = '<p>No projects found.</p>';
      return;
    }

    container.innerHTML = projects.map(project => `
      <div class="col">
        <a href="Proyects/${this.slugify(project.title)}.html" class="text-decoration-none text-dark">
          <div class="card h-100 shadow-sm">
            <img src="${project.image_url}" class="card-img-top" alt="${project.title}" style="height: 180px; object-fit: cover;">
            <div class="card-body">
              <h5 class="card-title">${this.escapeHtml(project.title)}: ${this.escapeHtml(project.description)}</h5>
            </div>
          </div>
        </a>
      </div>
    `).join('');
  }

  // Utility method to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility method to create URL-friendly slugs
  slugify(text) {
    return text.toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}

// Global instance
window.projectsClient = new ProjectsClient();

// Auto-load projects when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  try {
    const projects = await window.projectsClient.getProjects();
    
    // Load projects on projects page
    if (document.getElementById('projects-container')) {
      window.projectsClient.renderProjects(projects);
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    const container = document.getElementById('projects-container');
    if (container) {
      container.innerHTML = '<p class="text-danger">Error loading projects. Please try again later.</p>';
    }
  }
});
