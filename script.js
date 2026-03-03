/**
 * script.js — Mangalam HDPE Pipes
 * Assignment: Gushwork Web Developer Assignment
 *
 * Modules:
 *  1. Sticky Header    — scroll-triggered show/hide
 *  2. Mobile Nav       — hamburger toggle
 *  3. Product Gallery  — thumbnail → main image
 *  4. Applications Carousel — drag/swipe/button navigation
 *  5. Zoom Overlay     — hover + click zoom preview for carousel cards
 *  6. Process Tabs     — tab switching with panel reveal
 *  7. FAQ Accordion    — expand/collapse FAQ items
 *  8. Contact Form     — validation + submit feedback
 *  9. Scroll Reveal    — IntersectionObserver fade-up
 */

'use strict';

/* ── Tiny DOM helpers ──────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ============================================================
   1. STICKY HEADER
   Appears (slides down) after the user scrolls past the hero
   section (first fold). Hides again when scrolling back up
   past the fold. Uses rAF to avoid layout thrashing.
   ============================================================ */
(function initStickyHeader() {
  const header  = $('#stickyHeader');
  const pageNav = $('#pageNav');
  if (!header || !pageNav) return;

  let lastScrollY = 0;
  let ticking     = false;

  // Bottom edge of the page nav — threshold to reveal sticky header
  const getThreshold = () => pageNav.offsetTop + pageNav.offsetHeight;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const currentY   = window.scrollY;
      const threshold  = getThreshold();
      const scrollingDown = currentY > lastScrollY;

      if (currentY > threshold) {
        /* Past the first fold — sticky header should be accessible */
        header.setAttribute('aria-hidden', 'false');
        header.classList.add('is-visible');

        if (scrollingDown) {
          /* Scrolling DOWN: hide the header to save vertical space */
          header.classList.add('is-hidden');
        } else {
          /* Scrolling UP: reveal the header */
          header.classList.remove('is-hidden');
        }
      } else {
        /* Above the fold — keep header completely out of view */
        header.setAttribute('aria-hidden', 'true');
        header.classList.remove('is-visible');
        header.classList.remove('is-hidden');
      }

      lastScrollY = currentY;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();


/* ============================================================
   2. MOBILE NAV (hamburger toggle)
   ============================================================ */
(function initMobileNav() {
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobileNav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  /* Close drawer when any link is clicked */
  $$('a', mobileNav).forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
})();


/* ============================================================
   3. PRODUCT GALLERY
   Clicking a thumbnail swaps the main image.
   Also supports previous/next arrow buttons.
   ============================================================ */
(function initProductGallery() {
  const mainImg  = $('#mainGalleryImg');
  const thumbs   = $$('.product-gallery__thumb');
  const prevBtn  = $('#galleryPrev');
  const nextBtn  = $('#galleryNext');
  if (!mainImg || !thumbs.length) return;

  let currentIdx = 0;

  /* Swap main image to match the given thumbnail index */
  const goTo = (idx) => {
    if (idx < 0 || idx >= thumbs.length) return;
    currentIdx = idx;
    const thumb = thumbs[idx];

    /* Fade out → swap src → fade in */
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = thumb.dataset.src;
      mainImg.alt = thumb.dataset.alt || '';
      mainImg.style.opacity = '1';
    }, 180);

    /* Update active state and aria-pressed on all thumbs */
    thumbs.forEach((t, i) => {
      t.classList.toggle('is-active', i === idx);
      t.setAttribute('aria-pressed', String(i === idx));
    });
  };

  /* Thumbnail click */
  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => goTo(idx));
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(idx); }
    });
  });

  /* Arrow buttons */
  prevBtn?.addEventListener('click', () => goTo(currentIdx - 1));
  nextBtn?.addEventListener('click', () => goTo(currentIdx + 1));

  /* Enable keyboard navigation (left/right arrow keys on gallery) */
  $('#galleryMain')?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(currentIdx - 1);
    if (e.key === 'ArrowRight') goTo(currentIdx + 1);
  });
})();


/* ============================================================
   4. APPLICATIONS CAROUSEL
   Horizontal slider with prev/next buttons, drag, touch swipe,
   keyboard arrows, and autoplay.
   ============================================================ */
(function initApplicationsCarousel() {
  const track   = $('#appCarouselTrack');
  const wrapper = $('#appCarouselWrapper');
  const prevBtn = $('#appPrevBtn');
  const nextBtn = $('#appNextBtn');
  if (!track || !wrapper) return;

  const cards = $$('.app-card', track);
  const total = cards.length;
  let currentIdx = 0;
  let autoTimer  = null;

  /* Number of fully-visible cards at current viewport width */
  const getVisibleCount = () => {
    if (window.innerWidth <= 480)  return 1.2;
    if (window.innerWidth <= 768)  return 2;
    if (window.innerWidth <= 1024) return 3;
    return 4;
  };

  /* Calculate translateX offset for a given card index */
  const getOffset = (idx) => {
    if (!cards[idx]) return 0;
    const paddingLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    return -(cards[idx].offsetLeft - paddingLeft);
  };

  /* Apply transform to the track */
  const applyTransform = (idx) => {
    const safeIdx = Math.min(idx, total - 1);
    track.style.transform = `translateX(${getOffset(safeIdx)}px)`;
  };

  /* Navigate to a specific card index */
  const goTo = (idx) => {
    const maxIdx = Math.max(0, total - Math.floor(getVisibleCount()));
    currentIdx = Math.max(0, Math.min(idx, maxIdx));
    applyTransform(currentIdx);

    /* Update button disabled states */
    if (prevBtn) prevBtn.disabled = currentIdx === 0;
    if (nextBtn) nextBtn.disabled = currentIdx >= maxIdx;
  };

  /* Button listeners */
  prevBtn?.addEventListener('click', () => { goTo(currentIdx - 1); resetAutoPlay(); });
  nextBtn?.addEventListener('click', () => { goTo(currentIdx + 1); resetAutoPlay(); });

  /* Keyboard navigation */
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(currentIdx - 1); resetAutoPlay(); }
    if (e.key === 'ArrowRight') { goTo(currentIdx + 1); resetAutoPlay(); }
  });

  /* Autoplay — pauses on hover */
  const startAutoPlay = () => {
    autoTimer = setInterval(() => {
      const maxIdx = Math.max(0, total - Math.floor(getVisibleCount()));
      goTo(currentIdx + 1 > maxIdx ? 0 : currentIdx + 1);
    }, 4000);
  };

  const resetAutoPlay = () => {
    clearInterval(autoTimer);
    startAutoPlay();
  };

  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', startAutoPlay);

  /* ── Drag / Touch Swipe ──────────────────────────────────── */
  let dragStart     = 0;
  let isDragging    = false;
  let dragDelta     = 0;
  let startTranslate = 0;

  const getTranslateX = () => {
    const m = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    return m.m41;
  };

  const onPointerDown = (e) => {
    isDragging     = true;
    dragStart      = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startTranslate = getTranslateX();
    track.style.transition = 'none'; /* Remove transition during drag */
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const x   = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    dragDelta = x - dragStart;
    track.style.transform = `translateX(${startTranslate + dragDelta}px)`;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = ''; /* Restore transition */

    if      (dragDelta < -50) goTo(currentIdx + 1);
    else if (dragDelta >  50) goTo(currentIdx - 1);
    else                      applyTransform(currentIdx); /* Snap back */

    dragDelta = 0;
    resetAutoPlay();
  };

  wrapper.addEventListener('mousedown',  onPointerDown);
  window.addEventListener('mousemove',   onPointerMove);
  window.addEventListener('mouseup',     onPointerUp);
  wrapper.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove',   onPointerMove, { passive: true });
  window.addEventListener('touchend',    onPointerUp);

  /* Prevent click-as-link after a drag */
  wrapper.addEventListener('click', (e) => {
    if (Math.abs(dragDelta) > 5) e.stopPropagation();
  }, true);

  /* Recalculate on resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyTransform(currentIdx);
      goTo(currentIdx); /* Recheck button disabled state */
    }, 200);
  }, { passive: true });

  /* Initial render */
  goTo(0);
  startAutoPlay();
})();


/* ============================================================
   5. CAROUSEL ZOOM OVERLAY
   Hover over any .app-card → zoomed preview modal appears.
   Click or keyboard Enter also triggers it.
   Close via X button, backdrop click, or Escape key.
   ============================================================ */
(function initZoomOverlay() {
  const overlay  = $('#zoomOverlay');
  const backdrop = $('#zoomBackdrop');
  const closeBtn = $('#zoomClose');
  const zoomImg  = $('#zoomImg');
  const zoomTitle = $('#zoomTitle');
  const zoomDesc  = $('#zoomDesc');
  if (!overlay || !backdrop) return;

  let hoverTimer = null; /* Small delay to prevent accidental zoom on pass-through */

  /* Open the zoom overlay and populate it with card data */
  const openZoom = (card) => {
    const img = $('img', card);
    if (!img) return;

    /* Use a higher-resolution version of the same Unsplash image */
    zoomImg.src = img.src.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=90');
    zoomImg.alt = img.alt;
    zoomTitle.textContent = card.dataset.title || '';
    zoomDesc.textContent  = card.dataset.desc  || '';

    overlay.removeAttribute('hidden');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    /* Move focus to close button for keyboard accessibility */
    requestAnimationFrame(() => closeBtn?.focus());
  };

  /* Close the overlay */
  const closeZoom = () => {
    overlay.setAttribute('hidden', '');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  /* Attach hover + click listeners to every carousel card */
  $$('.app-card').forEach(card => {

    /* Hover: open after a brief delay (prevents accidental triggers) */
    card.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => openZoom(card), 250);
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      /* Only close if the overlay was opened by hover (not click) */
    });

    /* Click / keyboard: always opens zoom */
    card.addEventListener('click', () => {
      clearTimeout(hoverTimer);
      openZoom(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openZoom(card);
      }
    });
  });

  /* Close triggers */
  closeBtn?.addEventListener('click', closeZoom);
  backdrop.addEventListener('click',  closeZoom);

  /* Escape key closes overlay */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeZoom();
  });

  /* Prevent clicks inside the overlay content from closing it */
  $('.zoom-overlay__content', overlay)?.addEventListener('click', (e) => {
    e.stopPropagation();
  });
})();


/* ============================================================
   6. PROCESS TABS
   Clicking a tab button shows the corresponding panel and
   hides all others.
   ============================================================ */
(function initProcessTabs() {
  const tabs   = $$('.process-tab');
  const panels = $$('.process-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = `panel-${tab.dataset.tab}`;

      /* Deactivate all tabs and hide all panels */
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });

      panels.forEach(p => {
        p.classList.remove('is-active');
        p.hidden = true;
      });

      /* Activate the clicked tab and reveal its panel */
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const targetPanel = $(`#${targetId}`);
      if (targetPanel) {
        targetPanel.classList.add('is-active');
        targetPanel.hidden = false;
      }
    });

    /* Arrow key navigation between tabs */
    tab.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf(tab);
      if (e.key === 'ArrowRight' && idx < tabs.length - 1) {
        tabs[idx + 1].click();
        tabs[idx + 1].focus();
      }
      if (e.key === 'ArrowLeft' && idx > 0) {
        tabs[idx - 1].click();
        tabs[idx - 1].focus();
      }
    });
  });
})();


/* ============================================================
   7. FAQ ACCORDION
   Clicking a question expands/collapses its answer.
   Only one item can be open at a time.
   ============================================================ */
(function initFAQ() {
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const trigger = $('.faq-item__trigger', item);
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      /* Close all items */
      items.forEach(i => {
        i.classList.remove('is-open');
        $('.faq-item__trigger', i)?.setAttribute('aria-expanded', 'false');
      });

      /* Re-open clicked item if it was closed */
      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();


/* ============================================================
   8. CONTACT FORM — Validation + Submit Feedback
   ============================================================ */
(function initContactForm() {
  const form   = $('#contactForm');
  const notice = $('#formNotice');
  if (!form) return;

  /* Simple email format validator */
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* Show a feedback message below the submit button */
  const showNotice = (msg, isError = false) => {
    if (!notice) return;
    notice.textContent = msg;
    notice.className   = 'form-notice' + (isError ? ' is-error' : '');
    setTimeout(() => { notice.textContent = ''; notice.className = 'form-notice'; }, 5000);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = form.fullName?.value.trim()    || '';
    const email    = form.emailAddress?.value.trim() || '';
    const phone    = form.phone?.value.trim()        || '';

    /* Validation checks */
    if (!fullName) {
      showNotice('Please enter your full name.', true);
      form.fullName?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showNotice('Please enter a valid email address.', true);
      form.emailAddress?.focus();
      return;
    }

    if (!phone) {
      showNotice('Please enter your phone number.', true);
      form.phone?.focus();
      return;
    }

    /* Simulate async form submission */
    const submitBtn = $('button[type="submit"]', form);
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting…';
    submitBtn.disabled    = true;

    setTimeout(() => {
      showNotice('✓ Thank you! Our team will contact you within 24 hours.', false);
      form.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled    = false;
    }, 1200);
  });
})();


/* ============================================================
   9. SCROLL REVEAL
   Fades elements up into view as they enter the viewport.
   Uses IntersectionObserver — no external library needed.
   Provides a staggered cascade effect for grouped elements.
   ============================================================ */
(function initScrollReveal() {
  /* Elements to animate on scroll */
  const selectors = [
    '.feature-card',
    '.testimonial-card',
    '.product-card',
    '.resource-item',
    '.faq-item',
    '.trust-logo',
    '.specs-table__row',
    '.cert-badge',
    '.products-cta-banner',
    '.cta-form__text',
    '.cta-form__card',
    '.footer__col',
    '.tech-specs__title',
    '.tech-specs__subtitle',
    '.features__title',
    '.applications__text',
    '.testimonials__title',
    '.products-portfolio__title',
  ];

  const elements = $$(selectors.join(', '));
  elements.forEach(el => el.classList.add('sr-hidden'));

  /* Fallback: reveal everything immediately if observer not available */
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('sr-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      /* Stagger siblings for a cascade waterfall effect */
      const siblings = $$('.sr-hidden:not(.sr-visible)', entry.target.parentElement);
      const delay    = Math.min(siblings.indexOf(entry.target) * 80, 400);

      setTimeout(() => entry.target.classList.add('sr-visible'), delay);
      observer.unobserve(entry.target);
    });
  }, {
    threshold:  0.10,
    rootMargin: '0px 0px -30px 0px',
  });

  elements.forEach(el => observer.observe(el));
})();
