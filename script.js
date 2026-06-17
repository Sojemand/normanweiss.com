(function () {
  var canvas = document.getElementById("architecture-canvas");
  if (!canvas) {
    return;
  }

  var context = canvas.getContext("2d");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var labels = [
    "Problem",
    "Constraints",
    "Evidence",
    "Workflow",
    "Kernel",
    "Boundary",
    "Spec",
    "Skeleton",
    "Handover",
    "Recovery",
    "Artifacts",
    "Decision Log"
  ];
  var colors = ["#a9efe2", "#dfb04d", "#e66d7d", "#83b9ff", "#b49cff"];
  var nodes = [];
  var particles = [];
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var pointer = { x: 0, y: 0, active: false };
  var frame = 0;
  var rafId = 0;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildNodes();
    buildParticles();
    draw();
  }

  function buildNodes() {
    var centerX = width * 0.72;
    var centerY = height * 0.48;
    var radiusX = Math.max(150, width * 0.23);
    var radiusY = Math.max(130, height * 0.26);

    nodes = labels.map(function (label, index) {
      var angle = (Math.PI * 2 * index) / labels.length - Math.PI * 0.35;
      var ring = index % 4 === 0 ? 0.72 : 1;
      var x = centerX + Math.cos(angle) * radiusX * ring;
      var y = centerY + Math.sin(angle) * radiusY * ring;

      if (width < 780) {
        x = width * (0.18 + (index % 3) * 0.3);
        y = height * (0.22 + Math.floor(index / 3) * 0.145);
      }

      return {
        label: label,
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        radius: 4.5 + (index % 4),
        color: colors[index % colors.length],
        phase: index * 0.63,
        pulse: 0
      };
    });
  }

  function buildParticles() {
    var count = prefersReducedMotion ? 20 : Math.min(90, Math.max(38, Math.floor(width / 18)));
    particles = [];
    for (var i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: Math.random() * 1.7 + 0.25,
        alpha: Math.random() * 0.22 + 0.08
      });
    }
  }

  function drawBackground() {
    var gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#071111");
    gradient.addColorStop(0.48, "#0b1819");
    gradient.addColorStop(1, "#132022");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 0.55;
    var orb = context.createRadialGradient(width * 0.76, height * 0.42, 10, width * 0.76, height * 0.42, width * 0.38);
    orb.addColorStop(0, "rgba(0, 168, 143, 0.28)");
    orb.addColorStop(0.42, "rgba(0, 168, 143, 0.08)");
    orb.addColorStop(1, "rgba(0, 168, 143, 0)");
    context.fillStyle = orb;
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function drawGrid() {
    context.save();
    context.strokeStyle = "rgba(255,255,255,0.045)";
    context.lineWidth = 1;
    var spacing = Math.max(42, Math.min(78, width / 15));

    for (var x = -spacing * 2; x < width + spacing * 2; x += spacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + height * 0.18, height);
      context.stroke();
    }
    for (var y = -spacing; y < height + spacing; y += spacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y - width * 0.06);
      context.stroke();
    }
    context.restore();
  }

  function updateParticles() {
    particles.forEach(function (particle) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -10) particle.x = width + 10;
      if (particle.x > width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = height + 10;
      if (particle.y > height + 10) particle.y = -10;
    });
  }

  function drawParticles() {
    context.save();
    particles.forEach(function (particle) {
      context.fillStyle = "rgba(169,239,226," + particle.alpha.toFixed(3) + ")";
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function drawConnections() {
    context.save();
    for (var i = 0; i < nodes.length; i += 1) {
      for (var j = i + 1; j < nodes.length; j += 1) {
        var source = nodes[i];
        var target = nodes[j];
        var dx = target.x - source.x;
        var dy = target.y - source.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var maxDistance = width < 780 ? width * 0.34 : width * 0.25;
        if (distance > maxDistance) {
          continue;
        }
        var opacity = Math.max(0.04, 0.22 - distance / (width * 1.75));
        var lineGradient = context.createLinearGradient(source.x, source.y, target.x, target.y);
        lineGradient.addColorStop(0, "rgba(169,239,226," + opacity.toFixed(3) + ")");
        lineGradient.addColorStop(1, "rgba(223,176,77," + (opacity * 0.55).toFixed(3) + ")");
        context.strokeStyle = lineGradient;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.stroke();
      }
    }
    context.restore();
  }

  function drawNodeLabel(node) {
    var labelWidth = context.measureText(node.label).width + 28;
    var labelX = node.x + 16;
    var labelY = node.y - 16;

    if (labelX + labelWidth > width - 16) {
      labelX = node.x - labelWidth - 16;
    }

    context.fillStyle = "rgba(7, 17, 17, 0.54)";
    roundRect(labelX, labelY, labelWidth, 30, 999);
    context.fill();

    context.strokeStyle = "rgba(255,255,255,0.08)";
    context.stroke();

    context.fillStyle = "rgba(248,251,250,0.78)";
    context.fillText(node.label, labelX + 14, labelY + 16);
  }

  function drawNodes() {
    context.save();
    context.font = "780 12px Inter, Segoe UI, sans-serif";
    context.textBaseline = "middle";

    nodes.forEach(function (node) {
      context.save();
      context.shadowColor = node.color;
      context.shadowBlur = 20;
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.beginPath();
      context.arc(node.x, node.y, node.radius + 11 + node.pulse, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.fillStyle = node.color;
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();

      drawNodeLabel(node);
    });
    context.restore();
  }

  function updateNodes() {
    var influenceX = pointer.active ? (pointer.x - width / 2) * 0.018 : 0;
    var influenceY = pointer.active ? (pointer.y - height / 2) * 0.012 : 0;

    nodes.forEach(function (node, index) {
      var driftX = prefersReducedMotion ? 0 : Math.sin(frame * 0.01 + node.phase) * 9;
      var driftY = prefersReducedMotion ? 0 : Math.cos(frame * 0.012 + node.phase) * 7;
      node.x = node.baseX + driftX + influenceX * Math.cos(index);
      node.y = node.baseY + driftY + influenceY * Math.sin(index * 0.8);
      node.pulse = prefersReducedMotion ? 0 : (Math.sin(frame * 0.03 + node.phase) + 1) * 1.8;
    });
  }

  function roundRect(x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    drawBackground();
    drawGrid();
    drawParticles();
    drawConnections();
    drawNodes();
  }

  function tick() {
    frame += 1;
    updateParticles();
    updateNodes();
    draw();
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });
  window.addEventListener("mouseleave", function () {
    pointer.active = false;
  });

  resize();
  if (prefersReducedMotion) {
    updateNodes();
    draw();
  } else {
    rafId = window.requestAnimationFrame(tick);
  }

  window.addEventListener("pagehide", function () {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  });
}());

(function () {
  var header = document.querySelector("[data-header]");
  if (!header) {
    return;
  }

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}());

(function () {
  var revealItems = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!revealItems.length || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  revealItems.forEach(function (item) { observer.observe(item); });
}());
