// Client-side database utility for interacting with Netlify Functions

class DatabaseClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
  }

  async getPosts() {
    try {
      const response = await fetch(`${this.baseUrl}/api/get-posts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.posts || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPost(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/get-post?id=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.post || null;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/create-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Utility method to render posts in HTML
  renderPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    if (!posts || posts.length === 0) {
      container.innerHTML = '<p>No posts found.</p>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <article class="post-card">
        <h3>${this.escapeHtml(post.title)}</h3>
        <p class="post-meta">By ${this.escapeHtml(post.author)} on ${new Date(post.created_at).toLocaleDateString()}</p>
        <div class="post-content">${this.escapeHtml(post.content)}</div>
        <button onclick="viewPost(${post.id})" class="btn btn-primary">Read More</button>
      </article>
    `).join('');
  }

  // Utility method to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global instance
window.dbClient = new DatabaseClient();

// Example usage functions
async function loadPosts() {
  try {
    const posts = await window.dbClient.getPosts();
    window.dbClient.renderPosts(posts, 'posts-container');
  } catch (error) {
    console.error('Failed to load posts:', error);
  }
}

async function viewPost(id) {
  try {
    const post = await window.dbClient.getPost(id);
    if (post) {
      // You can implement modal or redirect to post detail page
      alert(`Post: ${post.title}\n\n${post.content}`);
    }
  } catch (error) {
    console.error('Failed to load post:', error);
  }
}

// Auto-load posts when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('posts-container')) {
    loadPosts();
  }
});
