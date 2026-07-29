// Custom JavaScript for PlrNc's Blog

// ==========================================
// Particle Background Effect (Pixel)
// ==========================================
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let highlightParticles = [];
  let mouseX = null;
  let mouseY = null;
  let prevScrollY = window.scrollY;
  let animationFrameId;
  let width, height;

  const config = {
    particleCount: 380,
    highlightCount: 25,
    minSize: 1,
    maxSize: 3,
    highlightMinSize: 1,
    highlightMaxSize: 2,
    minSpeedY: 0.8,
    maxSpeedY: 2.5,
    highlightMinSpeedY: 0.3,
    highlightMaxSpeedY: 0.8,
    minSpeedX: -0.8,
    maxSpeedX: 0.8,
    color: '#5d7a9c',
    highlightColor: '#c8ddf0',
    opacityMin: 0.05,
    opacityMax: 0.25,
    highlightOpacityMin: 0.1,
    highlightOpacityMax: 0.3,
    interactivity: 80,
    repelStrength: 0.36,
    mouseDimFactor: 0.85,
    randomEffectChance: 0.0015,
    dimFadeDuration: 180,
    darkColor: '#1e2d3e',
    lightColor: '#3d4f5f',
    darkHighlightColor: '#556b82',
    lightHighlightColor: '#2c3e50'
  };

  function getParticleColor() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return isDark ? config.darkColor : config.lightColor;
  }

  function getHighlightColor() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return isDark ? config.darkHighlightColor : config.lightHighlightColor;
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * width;
      if (initial) {
        this.y = Math.random() * height;
      } else {
        this.y = -Math.random() * 100 - 10;
      }
      this.size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
      this.speedY = Math.random() * (config.maxSpeedY - config.minSpeedY) + config.minSpeedY;
      this.speedX = Math.random() * (config.maxSpeedX - config.minSpeedX) + config.minSpeedX;
      this.baseOpacity = Math.random() * (config.opacityMax - config.opacityMin) + config.opacityMin;
      this.opacity = 0;
      this.targetOpacity = this.baseOpacity;
      this.isNearMouse = false;
      this.state = 'normal';
      this.stateTimer = 0;
      this.dimFadeStart = 0;
      this.dimFadeDuration = config.dimFadeDuration;
    }

    triggerRandomEffect() {
      const r = Math.random();
      if (r < 0.5) {
        this.state = 'brighten';
        this.stateTimer = 40;
      } else {
        this.state = 'dimFade';
        this.stateTimer = this.dimFadeDuration;
        this.dimFadeStart = this.opacity;
      }
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.state === 'brighten') {
        this.stateTimer--;
        if (this.stateTimer > 25) {
          const progress = (40 - this.stateTimer) / 15;
          this.targetOpacity = this.baseOpacity * (1 + 0.5 * Math.sin(Math.PI * progress));
        } else {
          this.targetOpacity = this.baseOpacity;
        }
        if (this.stateTimer <= 0) {
          this.state = 'normal';
          this.targetOpacity = this.baseOpacity;
        }
      } else if (this.state === 'dimFade') {
        this.stateTimer--;
        const progress = 1 - (this.stateTimer / this.dimFadeDuration);
        this.targetOpacity = this.dimFadeStart * (1 - progress);
        if (this.stateTimer <= 0) {
          this.reset();
          return;
        }
      } else {
        if (Math.random() < config.randomEffectChance) {
          this.triggerRandomEffect();
        }
      }

      this.opacity += (this.targetOpacity - this.opacity) * 0.08;

      if (this.opacity < 0.01 && this.state !== 'dimFade') {
        this.opacity = 0.01;
      }

      let nearMouse = false;
      if (mouseX !== null && mouseY !== null && this.state === 'normal') {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.interactivity && distance > 0) {
          nearMouse = true;
          const force = (config.interactivity - distance) / config.interactivity;
          const xForce = (dx / distance) * force * config.repelStrength * 25;
          const yForce = (dy / distance) * force * config.repelStrength * 25;

          this.x += xForce;
          this.y += yForce;

          this.targetOpacity = this.baseOpacity * config.mouseDimFactor;
        }
      }

      if (!nearMouse && this.isNearMouse) {
        this.targetOpacity = this.baseOpacity;
      }
      this.isNearMouse = nearMouse;

      if (this.y > height + 10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      if (this.opacity < 0.02) return;
      const s = this.size * 2;
      ctx.fillStyle = hexToRgba(getParticleColor(), this.opacity);
      ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    }
  }

  class HighlightParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial) {
      this.x = Math.random() * width;
      if (initial) {
        this.y = Math.random() * height;
      } else {
        this.y = -Math.random() * 100 - 10;
      }
      this.size = Math.random() * (config.highlightMaxSize - config.highlightMinSize) + config.highlightMinSize;
      this.speedY = Math.random() * (config.highlightMaxSpeedY - config.highlightMinSpeedY) + config.highlightMinSpeedY;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.baseOpacity = Math.random() * (config.highlightOpacityMax - config.highlightOpacityMin) + config.highlightOpacityMin;
      this.opacity = initial ? this.baseOpacity : 0;
      this.targetOpacity = this.baseOpacity;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX + Math.sin(this.pulsePhase) * 0.15;
      this.y += this.speedY;
      this.pulsePhase += 0.03;

      this.opacity += (this.targetOpacity - this.opacity) * 0.06;

      if (mouseX !== null && mouseY !== null) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 60 && distance > 0) {
          const force = (60 - distance) / 60;
          this.x += (dx / distance) * force * 4;
          this.y += (dy / distance) * force * 4;
          this.targetOpacity = this.baseOpacity * 0.9;
        } else {
          this.targetOpacity = this.baseOpacity * (0.85 + Math.sin(this.pulsePhase) * 0.15);
        }
      }

      if (this.y > height + 10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      const s = this.size * 1.6;
      ctx.fillStyle = hexToRgba(getHighlightColor(), this.opacity);
      ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
    }
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function initCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  function initParticles() {
    particles = [];
    highlightParticles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }
    for (let i = 0; i < config.highlightCount; i++) {
      highlightParticles.push(new HighlightParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    highlightParticles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function handleMouseLeave() {
    mouseX = null;
    mouseY = null;
  }

  function handleScroll() {
    const delta = window.scrollY - prevScrollY;
    prevScrollY = window.scrollY;
    particles.forEach(particle => {
      particle.y -= delta;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;
    });
    highlightParticles.forEach(particle => {
      particle.y -= delta;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;
    });
  }

  function handleResize() {
    initCanvas();
    initParticles();
  }

  function init() {
    initCanvas();
    initParticles();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


// ==========================================
// Smooth image loading animation
// ==========================================
(function() {
  function addImageLoadingEffect() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        img.addEventListener('load', () => {
          img.style.opacity = '1';
        });
        setTimeout(() => {
          if (!img.complete) {
            img.style.opacity = '0.5';
          }
        }, 3000);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addImageLoadingEffect);
  } else {
    addImageLoadingEffect();
  }

  document.addEventListener('pjax:complete', addImageLoadingEffect);
})();


// ==========================================
// Image lightbox enhancements
// ==========================================
(function() {
  function enhanceImages() {
    const postImages = document.querySelectorAll('.post-content img, article img');
    postImages.forEach(img => {
      if (!img.hasAttribute('data-fancybox')) {
        img.setAttribute('data-fancybox', 'gallery');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceImages);
  } else {
    enhanceImages();
  }

  document.addEventListener('pjax:complete', enhanceImages);
})();


// ==========================================
// Floating Sidebar - Draggable Search with Full Panel
// ==========================================
(function() {
  var STORAGE_KEY = 'floating_sidebar_pos';
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var sidebarStartLeft = 0;
  var sidebarStartTop = 0;

  var sidebarHTML = '\
<div id="floating-sidebar">\
  <div id="floating-sidebar-strip">\
    <span class="sidebar-icon" title="拖动/搜索"><i class="fas fa-search"></i></span>\
  </div>\
  <div id="floating-sidebar-panel">\
    <div class="sidebar-content">\
      <div class="sidebar-section" data-section="search">\
        <h4 class="sidebar-section-title"><i class="fas fa-search"></i> 搜索</h4>\
        <div class="sidebar-search">\
          <input type="text" id="sidebar-search-input" placeholder="搜索文章..." />\
        </div>\
      </div>\
      <div class="sidebar-section" data-section="categories">\
        <h4 class="sidebar-section-title"><i class="fas fa-folder"></i> 分类</h4>\
        <div id="sidebar-categories-list"></div>\
      </div>\
      <div class="sidebar-section" data-section="articles">\
        <h4 class="sidebar-section-title"><i class="fas fa-file-alt"></i> 最新文章</h4>\
        <div id="sidebar-articles-list"></div>\
      </div>\
      <div class="sidebar-section" data-section="favorites">\
        <h4 class="sidebar-section-title"><i class="fas fa-star"></i> 最近访问</h4>\
        <div id="sidebar-favorites-list"></div>\
      </div>\
    </div>\
  </div>\
</div>';

  function getSiteData() {
    var data = { categories: [], articles: [] };

    var articleContainer = document.getElementById('article-container');
    if (articleContainer) {
      var articleItems = articleContainer.querySelectorAll('.article-item');
      articleItems.forEach(function(item) {
        var titleEl = item.querySelector('.article-title a');
        var dateEl = item.querySelector('.post-meta time');
        var catEl = item.querySelector('.article-meta .post-category a, .post-categories a');
        if (titleEl) {
          data.articles.push({
            title: titleEl.textContent.trim(),
            url: titleEl.getAttribute('href') || '',
            date: dateEl ? dateEl.textContent.trim() : '',
            categories: catEl ? [catEl.textContent.trim()] : []
          });
        }
      });
    }

    if (data.articles.length === 0) {
      var altArticles = document.querySelectorAll('.post-title-link, .article-title > a');
      altArticles.forEach(function(link) {
        var title = link.textContent.trim();
        var href = link.getAttribute('href');
        if (title && href && href !== '#' && href.length > 1) {
          data.articles.push({ title: title, url: href, date: '', categories: [] });
        }
      });
    }

    var metaCategories = document.querySelectorAll('.post-categories a, .article-meta .post-category a');
    var catSet = {};
    metaCategories.forEach(function(link) {
      var name = link.textContent.trim();
      var href = link.getAttribute('href') || '';
      if (name && !catSet[name]) {
        catSet[name] = true;
        var slugMatch = href.match(/\/categories\/([^/]+)/);
        data.categories.push({ name: name, count: 1, slug: slugMatch ? slugMatch[1] : name });
      }
    });

    if (data.categories.length === 0) {
      var catWidget = document.querySelector('.card-categories');
      if (catWidget) {
        var catLinks = catWidget.querySelectorAll('a');
        catLinks.forEach(function(link) {
          var href = link.getAttribute('href') || '';
          var name = link.textContent.trim();
          if (href.indexOf('/categories/') !== -1 && name && name.length < 20) {
            var match = name.match(/(.+?)\s*\((\d+)\)/);
            if (match) {
              data.categories.push({ name: match[1], count: parseInt(match[2]), slug: match[1] });
            } else if (!catSet[name]) {
              catSet[name] = true;
              var slugMatch = href.match(/\/categories\/([^/]+)/);
              data.categories.push({ name: name, count: 0, slug: slugMatch ? slugMatch[1] : name });
            }
          }
        });
      }
    }

    var recent = [];
    try { recent = JSON.parse(localStorage.getItem('sidebar-recent') || '[]'); } catch(e) {}
    return { data: data, recent: recent };
  }

  function saveRecentVisit(url, title) {
    try {
      var stored = JSON.parse(localStorage.getItem('sidebar-recent') || '[]');
      stored = stored.filter(function(item) { return item.url !== url; });
      stored.unshift({ url: url, title: title, time: Date.now() });
      if (stored.length > 10) stored = stored.slice(0, 10);
      localStorage.setItem('sidebar-recent', JSON.stringify(stored));
    } catch(e) {}
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderSidebar() {
    var container = document.getElementById('floating-sidebar');
    if (!container) return;
    var result = getSiteData();
    var data = result.data;
    var recent = result.recent;

    var categoriesList = document.getElementById('sidebar-categories-list');
    if (categoriesList) {
      if (data.categories.length > 0) {
        var html = '';
        data.categories.forEach(function(cat) {
          var slug = encodeURIComponent(cat.slug || cat.name);
          html += '<a class="sidebar-category-item" href="/categories/' + slug + '/"><i class="fas fa-folder"></i> ' + escapeHtml(cat.name) + '<span class="sidebar-count">' + cat.count + '</span></a>';
        });
        categoriesList.innerHTML = html;
      } else {
        categoriesList.innerHTML = '<div class="sidebar-empty">暂无分类</div>';
      }
    }

    var articlesList = document.getElementById('sidebar-articles-list');
    if (articlesList) {
      if (data.articles.length > 0) {
        var html = '';
        data.articles.forEach(function(article) {
          html += '<a class="sidebar-article-item" href="' + escapeHtml(article.url) + '"><i class="fas fa-file-alt"></i> ' + escapeHtml(article.title) + '</a>';
        });
        articlesList.innerHTML = html;
      } else {
        articlesList.innerHTML = '<div class="sidebar-empty">暂无文章</div>';
      }
    }

    var favoritesList = document.getElementById('sidebar-favorites-list');
    if (favoritesList) {
      if (recent.length > 0) {
        var html = '';
        recent.forEach(function(item) {
          html += '<a class="sidebar-fav-item" href="' + escapeHtml(item.url) + '"><i class="fas fa-clock"></i> ' + escapeHtml(item.title) + '</a>';
        });
        favoritesList.innerHTML = html;
      } else {
        favoritesList.innerHTML = '<div class="sidebar-empty">最近访问将显示在这里</div>';
      }
    }

    var searchInput = document.getElementById('sidebar-search-input');
    if (searchInput && !searchInput._bound) {
      searchInput._bound = true;
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var query = searchInput.value.trim();
          if (query) {
            window.location.href = '/search?q=' + encodeURIComponent(query);
          }
        }
      });
    }

    var pageTitle = document.querySelector('.article-title') || document.querySelector('.post-title') || document.querySelector('h1');
    if (pageTitle && window.location.pathname !== '/') {
      saveRecentVisit(window.location.pathname, pageTitle.textContent.trim());
    }
  }

  function savePosition(sidebar) {
    var rect = sidebar.getBoundingClientRect();
    var pos = {
      leftPct: rect.left / window.innerWidth,
      topPct: rect.top / window.innerHeight
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch(e) {}
  }

  function restorePosition(sidebar) {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        var left = saved.leftPct * window.innerWidth;
        var top = saved.topPct * window.innerHeight;
        left = Math.max(0, Math.min(left, window.innerWidth - 36));
        top = Math.max(20, Math.min(top, window.innerHeight - 60));
        sidebar.style.left = left + 'px';
        sidebar.style.top = top + 'px';
        sidebar.style.transform = 'none';
        sidebar.style.flexDirection = 'column';
      }
    } catch(e) {}
  }

  function initDragging(sidebar) {
    var strip = sidebar.querySelector('#floating-sidebar-strip');

    strip.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      var rect = sidebar.getBoundingClientRect();
      sidebarStartLeft = rect.left;
      sidebarStartTop = rect.top;

      sidebar.classList.add('dragging');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;

      var newLeft = sidebarStartLeft + dx;
      var newTop = sidebarStartTop + dy;

      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 36));
      newTop = Math.max(20, Math.min(newTop, window.innerHeight - 60));

      sidebar.style.left = newLeft + 'px';
      sidebar.style.top = newTop + 'px';
      sidebar.style.transform = 'none';
    });

    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      isDragging = false;
      sidebar.classList.remove('dragging');
      document.body.style.userSelect = '';
      savePosition(sidebar);
    });
  }

  function initFloatingSidebar() {
    if (document.getElementById('floating-sidebar')) return;

    var temp = document.createElement('div');
    temp.innerHTML = sidebarHTML.trim();
    var sidebar = temp.firstChild;
    document.body.appendChild(sidebar);

    document.body.classList.add('has-floating-sidebar');

    restorePosition(sidebar);
    initDragging(sidebar);

    var searchInput = document.getElementById('sidebar-search-input');
    if (searchInput) {
      sidebar.addEventListener('mouseenter', function() {
        if (!isDragging) {
          setTimeout(function() { searchInput.focus(); }, 200);
        }
      });
    }

    renderSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingSidebar);
  } else {
    initFloatingSidebar();
  }

  document.addEventListener('pjax:complete', function() {
    if (!document.getElementById('floating-sidebar')) {
      initFloatingSidebar();
    } else {
      renderSidebar();
    }
    if (!document.body.classList.contains('has-floating-sidebar')) {
      document.body.classList.add('has-floating-sidebar');
    }
  });
})();


// ==========================================
// Code Block Zoom - Centered Modal (not fullscreen)
// ==========================================
(function() {
  var modalOverlay = null;
  var modalContent = null;
  var originalBlock = null;
  var originalHTML = '';

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
    if (originalBlock) {
      originalBlock.innerHTML = originalHTML;
      originalBlock = null;
    }
    document.body.style.overflow = '';
  }

  function openModal(codeBlock) {
    originalBlock = codeBlock;
    originalHTML = codeBlock.innerHTML;

    var pre = codeBlock.querySelector('pre');
    var code = pre ? pre.querySelector('code') : null;
    var content = code ? code.innerHTML : (pre ? pre.innerHTML : codeBlock.innerHTML);

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'code-modal-overlay';
    modalOverlay.innerHTML = '\
      <div id="code-modal-content">\
        <div id="code-modal-header">\
          <span class="code-modal-title">代码预览</span>\
          <button id="code-modal-close">&times;</button>\
        </div>\
        <div id="code-modal-body">\
          <pre><code class="' + (code ? code.className : '') + '">' + content + '</code></pre>\
        </div>\
      </div>';

    document.body.appendChild(modalOverlay);
    document.body.style.overflow = 'hidden';

    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) closeModal();
    });

    modalOverlay.querySelector('#code-modal-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onEsc);
      }
    });
  }

  function interceptCodeFullpage() {
    var codeBlocks = document.querySelectorAll('figure.highlight');
    codeBlocks.forEach(function(block) {
      if (block._modalIntercepted) return;
      block._modalIntercepted = true;

      var btn = block.querySelector('.copy-btn, .hljs-copy-button, [data-clipboard-text]');
      var fullpageBtn = block.querySelector('.code-fullpage-btn, .fullscreen-btn, .btn-fullscreen');

      // Intercept the Butterfly theme's fullscreen button
      var existingBtns = block.querySelectorAll('button, .btn');
      existingBtns.forEach(function(btn) {
        if (btn.textContent.indexOf('fullscreen') !== -1 || btn.textContent.indexOf('全屏') !== -1 || btn.querySelector('.fa-expand')) {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal(block);
          });
        }
      });

      // Add our own zoom button if not present
      var zoomBtn = document.createElement('button');
      zoomBtn.className = 'code-zoom-btn';
      zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
      zoomBtn.title = '放大查看';
      zoomBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openModal(block);
      });
      block.appendChild(zoomBtn);

      // Also intercept if the class gets toggled by Butterfly
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            if (block.classList.contains('code-fullpage')) {
              block.classList.remove('code-fullpage');
              openModal(block);
            }
          }
        });
      });
      observer.observe(block, { attributes: true, attributeFilter: ['class'] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptCodeFullpage);
  } else {
    interceptCodeFullpage();
  }

  document.addEventListener('pjax:complete', interceptCodeFullpage);
})();


// ==========================================
// Fix: Butterfly panel close - clean up properly
// ==========================================
(function() {
  function cleanupPanelArtifacts() {
    // Remove any leftover backdrop/overlay elements
    var selectors = [
      '.nav-backdrop',
      '.off-canvas-backdrop',
      '.settings-overlay',
      '.search-overlay',
      '.mask',
      '#menu-mask',
      '.menu-mask'
    ];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.remove();
      });
    });

    // Ensure nav doesn't have show class that keeps it visible
    var nav = document.getElementById('nav');
    if (nav && nav.classList.contains('show')) {
      nav.classList.remove('show');
      nav.classList.add('hide-menu');
    }

    // Force-trigger a repaint to ensure state is flushed
    document.body.offsetHeight;
  }

  function init() {
    // Handle close button clicks inside panels
    document.addEventListener('click', function(e) {
      var target = e.target;

      // Close button (search dialog)
      if (target.classList && target.classList.contains('search-close-button')) {
        setTimeout(cleanupPanelArtifacts, 150);
      }
      // Close button (settings)
      if (target.id === 'settings-close' || target.classList.contains('close-settings')) {
        setTimeout(cleanupPanelArtifacts, 150);
      }

      // Click on mask/backdrop to close panel
      var targetId = target.id || '';
      var classList = target.classList;
      var isMaskClick = false;
      
      if (targetId === 'menu-mask') isMaskClick = true;
      if (classList) {
        var clsStr = Array.from(classList).join(' ');
        if (clsStr.indexOf('backdrop') !== -1 || clsStr.indexOf('mask') !== -1) {
          isMaskClick = true;
        }
      }
      // Also check if click is on backdrop/mask through delegation
      if (!isMaskClick && target.closest) {
        var parentMask = target.closest('#menu-mask, .nav-backdrop, .off-canvas-backdrop, .mask');
        if (parentMask) isMaskClick = true;
      }
      
      if (isMaskClick) {
        setTimeout(cleanupPanelArtifacts, 100);
      }
    }, true);

    // Listen for Escape key to clean up panels
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        setTimeout(cleanupPanelArtifacts, 200);
        setTimeout(cleanupPanelArtifacts, 600);
      }
    });

    // PJAX events - ensure cleanup after page transitions
    document.addEventListener('pjax:complete', function() {
      setTimeout(cleanupPanelArtifacts, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();