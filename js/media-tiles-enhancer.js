// /public/js/media-tiles-enhancer.js
(function () {
  try {
    /* =========================
     * Setup one carousel <ul>
     * ========================= */
    function setup(list) {
      // Skip if already initialized
      if (list.dataset.autoscrollReady === "1") return;
      list.dataset.autoscrollReady = "1"; // sets data-autoscroll-ready="1"

      var uid = list.getAttribute("data-carousel-list");
      var idx = parseInt(list.getAttribute("data-initial-index") || "0", 10);
      if (!uid || isNaN(idx)) return;
      var targetId = uid + "-s-" + idx;

      function centerOnce() {
        // If URL hash targets an item inside this list, clear it (avoid vertical page jump)
        if (location.hash) {
          var hashed = document.getElementById(location.hash.slice(1));
          if (hashed && list.contains(hashed)) {
            try {
              history.replaceState(null, "", location.pathname + location.search);
            } catch (_) {}
          }
        }

        var target = document.getElementById(targetId);
        if (!target || !list.contains(target)) return;

        // Hard center horizontally (no vertical scroll side-effects)
        var prevSnap = list.style.scrollSnapType;
        var prevBeh = list.style.scrollBehavior;

        list.style.scrollSnapType = "none"; // temporarily disable snap
        list.style.scrollBehavior = "auto";

        var left = target.offsetLeft - (list.clientWidth - target.clientWidth) / 2;
        if (left < 0) left = 0;
        list.scrollLeft = Math.round(left);

        // Restore snap on next frame
        requestAnimationFrame(function () {
          list.style.scrollSnapType = prevSnap || "";
          list.style.scrollBehavior = prevBeh || "";
        });
      }

      // ---- Debounced recenter ----
      var t;
      function re() {
        clearTimeout(t);
        t = setTimeout(centerOnce, 120);
      }

      // Initial run
      if (document.readyState === "complete" || document.readyState === "interactive") {
        // small delay to wait layout
        setTimeout(centerOnce, 0);
      } else {
        window.addEventListener("load", centerOnce, { once: true });
      }

      // Resize & orientation
      window.addEventListener("resize", re);
      window.addEventListener("orientationchange", re);

      // Breakpoints
      var mqLg = window.matchMedia("(min-width:1024px)");
      var mqXl = window.matchMedia("(min-width:1280px)");
      if (mqLg.addEventListener) {
        mqLg.addEventListener("change", re);
        mqXl.addEventListener("change", re);
      } else {
        // Safari <14
        mqLg.addListener(re);
        mqXl.addListener(re);
      }

      // Fonts & images (layout shifts)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(re).catch(function () {});
      }
      list.querySelectorAll("img").forEach(function (img) {
        if (!img.complete) img.addEventListener("load", re, { once: true });
      });

      // ResizeObserver for list & target
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(re);
        ro.observe(list);
        var tgt = document.getElementById(targetId);
        if (tgt) ro.observe(tgt);
      }
    }

    /* =========================
     * Initial mount
     * ========================= */
    function init() {
      document
        .querySelectorAll('ul[data-carousel-list][data-initial-index]')
        .forEach(setup);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }

    /* =========================
     * Handle Next.js SPA navigations
     * (carousels added later to the DOM)
     * ========================= */
    var obs = new MutationObserver(function () {
      document
        .querySelectorAll(
          'ul[data-carousel-list][data-initial-index]:not([data-autoscroll-ready="1"])'
        )
        .forEach(setup);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    /* =========================
     * Optional: dot navigation without hash (if you use data-go-slide)
     * (Prevents vertical page jumps via location.hash)
     * ========================= */
    document.addEventListener(
      "click",
      function (e) {
        var dot = e.target.closest("[data-go-slide]");
        if (!dot) return;
        var listSel = dot.getAttribute("data-target") || "ul[data-carousel-list]";
        var list = dot.closest("section")?.querySelector(listSel) || document.querySelector(listSel);
        if (!list) return;
        e.preventDefault();

        var uid = list.getAttribute("data-carousel-list");
        var i = parseInt(dot.getAttribute("data-go-slide") || "0", 10);
        var target = document.getElementById(uid + "-s-" + i);
        if (!target) return;

        var prevSnap = list.style.scrollSnapType;
        var prevBeh = list.style.scrollBehavior;
        list.style.scrollSnapType = "none";
        list.style.scrollBehavior = "smooth";

        var left = target.offsetLeft - (list.clientWidth - target.clientWidth) / 2;
        if (left < 0) left = 0;
        list.scrollLeft = Math.round(left);

        requestAnimationFrame(function () {
          list.style.scrollSnapType = prevSnap || "";
          list.style.scrollBehavior = prevBeh || "";
        });
      },
      true
    );
  } catch (_) {}
})();
