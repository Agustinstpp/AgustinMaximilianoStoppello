/**
 * Shared sidebar navigation component.
 * Call renderSidebar(rootPath) before the closing </body> tag.
 * rootPath is the relative path from the current page to the site root, e.g. '' or '../'.
 */
function renderSidebar(rootPath) {
  rootPath = rootPath || '';

  const currentPath = window.location.pathname;

  function isActive(href) {
    const full = rootPath + href;
    return currentPath.endsWith(full) || currentPath.endsWith(full.replace(/\.html$/, ''));
  }

  function navBtn(href, iconSrc, iconAlt, label) {
    const active = isActive(href) ? ' active' : '';
    return `
      <a href="${rootPath}${href}" class="btn btn-outline-primary text-start d-flex align-items-center py-2 px-3 rounded-pill${active}">
        <img class="me-2" src="${rootPath}imag/${iconSrc}" alt="${iconAlt}" width="20" height="20" loading="lazy">
        <span>${label}</span>
      </a>`;
  }

  const sidebarHTML = `
    <div class="profile-section text-center mb-4">
      <img class="profile-pic img-fluid rounded-circle mb-3" src="${rootPath}imag/IMG_0259.PNG" width="120" height="120" alt="Foto de perfil de Agustín Stoppello" loading="lazy">
      <h2 class="profile-name mb-1">Agustín Stoppello</h2>
      <p class="profile-title text-muted">UX/UI Designer &amp; Developer</p>
    </div>
    <div class="buttons-container bg-white rounded-3 p-3 shadow-sm">
      <div class="d-flex flex-column gap-2">
        ${navBtn('Index.html', 'homeicon.svg', 'Home', 'Home')}
        ${navBtn('About.html', 'personicon.svg', 'Sobre Mi', 'Sobre Mi')}
        ${navBtn('proyect.html', 'workicon.svg', 'Proyectos', 'Proyectos')}
        ${navBtn('blog.html', 'blogicon.svg', 'Blog', 'Blog')}
        ${navBtn('Contact.html', 'mailico.svg', 'Contacto', 'Contacto')}
        <hr class="my-3">
        <a href="https://www.linkedin.com/in/agustinmaximilianostoppello" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary text-start d-flex align-items-center py-2 px-3 rounded-pill">
          <img class="me-2" src="${rootPath}imag/linkedin.svg" alt="LinkedIn" width="20" height="20" loading="lazy">
          <span>LinkedIn</span>
        </a>
        <a href="https://wa.me/543794141551" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary text-start d-flex align-items-center py-2 px-3 rounded-pill">
          <img class="me-2" src="${rootPath}imag/whastapp.svg" alt="WhatsApp" width="20" height="20" loading="lazy">
          <span>WhatsApp</span>
        </a>
        <a href="https://www.instagram.com/agustinst.code/" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary text-start d-flex align-items-center py-2 px-3 rounded-pill">
          <img class="me-2" src="${rootPath}imag/instagram.svg" alt="Instagram" width="20" height="20" loading="lazy">
          <span>Instagram</span>
        </a>
      </div>
    </div>`;

  const sidebar = document.querySelector('.nav-list');
  if (sidebar) {
    sidebar.innerHTML = sidebarHTML;
  }

  // Mobile menu toggle
  const mobileMenu = document.getElementById('mobile-menu');
  const navList = document.querySelector('.nav-list');

  if (mobileMenu && navList) {
    mobileMenu.addEventListener('click', () => {
      navList.classList.toggle('active');
    });

    document.addEventListener('click', function (event) {
      if (
        window.innerWidth <= 767.98 &&
        navList.classList.contains('active') &&
        !navList.contains(event.target) &&
        event.target !== mobileMenu
      ) {
        navList.classList.remove('active');
      }
    });
  }
}
