/**
 * portfolio-loader.js
 * 
 * Auto-loads portfolio images from a folder's files.json manifest
 * and populates the Swiper slider with slides.
 * 
 * Usage: Add data-portfolio-folder="Port-FolderName" to .swiper-wrapper element
 *        The script will fetch files.json from that folder and create slides.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const swiperWrappers = document.querySelectorAll('.swiper-wrapper[data-portfolio-folder]');

    swiperWrappers.forEach(function (wrapper) {
      const folder = wrapper.getAttribute('data-portfolio-folder');
      if (!folder) return;

      const basePath = '../assets/img/portfolio/' + folder + '/';
      const manifestUrl = basePath + 'files.json';

      fetch(manifestUrl)
        .then(function (res) {
          if (!res.ok) throw new Error('Manifest not found: ' + manifestUrl);
          return res.json();
        })
        .then(function (files) {
          // Clear any existing placeholder slides
          wrapper.innerHTML = '';

          files.forEach(function (filename) {
            var slide = document.createElement('div');
            slide.className = 'swiper-slide';

            var img = document.createElement('img');
            img.src = basePath + encodeURIComponent(filename);
            img.alt = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
            img.loading = 'lazy';

            slide.appendChild(img);
            wrapper.appendChild(slide);
          });

          // Initialize or reinitialize Swiper after slides are injected
          var swiperContainer = wrapper.closest('.init-swiper');
          if (!swiperContainer) return;

          var configEl = swiperContainer.querySelector('.swiper-config');
          if (!configEl) return;

          try {
            var config = JSON.parse(configEl.textContent.trim());
            if (swiperContainer.swiper) {
              swiperContainer.swiper.destroy(true, true);
            }
            new Swiper(swiperContainer, config);
          } catch (e) {
            console.warn('Portfolio loader: Could not init Swiper', e);
          }
        })
        .catch(function (err) {
          console.warn('Portfolio loader error:', err.message);
        });
    });
  });
})();
