/* The Mood Machine, Year 13: page behaviour and interactive widgets. No libraries. */
(function () {
  "use strict";
  var page = document.body.getAttribute("data-page");

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function fmt(v, d) {
    if (!isFinite(v)) return v > 0 ? "huge" : (v < 0 ? "-huge" : "NaN");
    if (Math.abs(v) >= 1e5) return v.toExponential(2);
    return (+v.toFixed(d === undefined ? 3 : d)).toString();
  }

  /* copy buttons on code blocks */
  document.querySelectorAll(".hl").forEach(function (box) {
    var b = el("button", { "class": "copy", type: "button" }, "Copy");
    b.addEventListener("click", function () {
      var text = box.querySelector("pre").innerText;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { b.textContent = "Select and copy"; });
      else b.textContent = "Select and copy";
    });
    box.appendChild(b);
  });

  /* "I've finished this part" ticks, saved in this browser only */
  var main = document.querySelector("main");
  var tocLinks = {};
  document.querySelectorAll(".toc a").forEach(function (a) { tocLinks[a.getAttribute("href").slice(1)] = a.parentNode; });
  if (/^session/.test(page) && main) {
    var hs = main.querySelectorAll("h2");
    hs.forEach(function (h, i) {
      var label = el("label", { "class": "done" });
      var cb = el("input", { type: "checkbox" });
      var key = "mm13:" + page + ":" + h.id;
      cb.checked = store(key) === "1";
      if (cb.checked && tocLinks[h.id]) tocLinks[h.id].classList.add("ticked");
      cb.addEventListener("change", function () {
        store(key, cb.checked ? "1" : "0");
        if (tocLinks[h.id]) tocLinks[h.id].classList.toggle("ticked", cb.checked);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode("I've finished this part"));
      var next = hs[i + 1];
      // place before the next heading (or before a part banner that precedes it)
      var anchor = next ? (next.previousElementSibling && next.previousElementSibling.classList.contains("part") ? next.previousElementSibling : next) : main.querySelector(".prevnext");
      main.insertBefore(label, anchor);
    });
  }

  /* highlight the current section in the contents list */
  var heads = Array.prototype.slice.call(document.querySelectorAll("main h2[id]"));
  if (heads.length && Object.keys(tocLinks).length) {
    var onScroll = function () {
      var cur = heads[0];
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < 140) cur = h; });
      Object.keys(tocLinks).forEach(function (id) { tocLinks[id].classList.toggle("on", id === cur.id); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Neuron calculator ---------------- */
  function neuron(root) {
    var vals = { x1: 0.5, x2: 0.8, w1: 0.4, w2: -0.6, b: 0.1 };
    root.innerHTML = '<div class="w-title">Neuron calculator</div><div class="w-row"><div class="w-controls"></div><div class="w-view"></div></div>';
    var ctl = root.querySelector(".w-controls"), view = root.querySelector(".w-view");
    Object.keys(vals).forEach(function (k) {
      var row = el("div", { "class": "slider" });
      row.innerHTML = '<label>' + k + '</label><input type="range" min="-1" max="1" step="0.05" value="' + vals[k] + '"><output></output>';
      var inp = row.querySelector("input"), out = row.querySelector("output");
      out.textContent = vals[k];
      inp.addEventListener("input", function () { vals[k] = +inp.value; out.textContent = vals[k]; draw(); });
      ctl.appendChild(row);
    });
    var calc = el("div", { "class": "calc" });
    ctl.appendChild(calc);
    function draw() {
      var total = vals.w1 * vals.x1 + vals.w2 * vals.x2 + vals.b;
      var out = Math.max(0, total);
      calc.innerHTML = "total = w1&times;x1 + w2&times;x2 + b<br>= " + vals.w1 + "&times;" + vals.x1 + " + " + vals.w2 + "&times;" + vals.x2 + " + " + vals.b +
        "<br>= <b>" + fmt(total) + "</b><br>ReLU(total) = <b>" + fmt(out) + "</b>" + (total < 0 ? "  (negative, so 0)" : "");
      var col = function (w) { return w >= 0 ? "#079D8F" : "#FF6B6B"; };
      var wd = function (w) { return 1.5 + Math.abs(w) * 9; };
      view.innerHTML = '<svg viewBox="0 0 360 220" class="bp-svg" role="img" aria-label="A neuron with two inputs">' +
        '<line x1="60" y1="60" x2="200" y2="110" stroke="' + col(vals.w1) + '" stroke-width="' + wd(vals.w1) + '"/>' +
        '<line x1="60" y1="160" x2="200" y2="110" stroke="' + col(vals.w2) + '" stroke-width="' + wd(vals.w2) + '"/>' +
        '<line x1="200" y1="110" x2="320" y2="110" stroke="#0B2A4A" stroke-width="2"/>' +
        '<text x="118" y="70" font-size="13" fill="#0B2A4A">w1 = ' + vals.w1 + '</text>' +
        '<text x="118" y="164" font-size="13" fill="#0B2A4A">w2 = ' + vals.w2 + '</text>' +
        '<circle cx="60" cy="60" r="24" fill="#F8F6F1" stroke="#0B2A4A"/><text x="60" y="65" text-anchor="middle" font-size="14">' + vals.x1 + '</text>' +
        '<circle cx="60" cy="160" r="24" fill="#F8F6F1" stroke="#0B2A4A"/><text x="60" y="165" text-anchor="middle" font-size="14">' + vals.x2 + '</text>' +
        '<circle cx="200" cy="110" r="34" fill="' + (out > 0 ? "#FFD23F" : "#E3DED3") + '" stroke="#0B2A4A" stroke-width="2"/>' +
        '<text x="200" y="106" text-anchor="middle" font-size="12">+ b ' + vals.b + '</text><text x="200" y="124" text-anchor="middle" font-size="12">ReLU</text>' +
        '<rect x="290" y="92" width="64" height="36" rx="8" fill="#0B2A4A"/><text x="322" y="115" text-anchor="middle" font-size="15" fill="white">' + fmt(out, 2) + '</text>' +
        '<text x="60" y="205" text-anchor="middle" font-size="12" fill="#4A5B6E">inputs</text><text x="200" y="175" text-anchor="middle" font-size="12" fill="#4A5B6E">neuron</text><text x="322" y="150" text-anchor="middle" font-size="12" fill="#4A5B6E">output</text></svg>';
    }
    draw();
  }

  /* ---------------- Learning types sorter ---------------- */
  var SORT = [
    ["A bank trains on past loans, each labelled 'repaid' or 'not repaid', to decide whether a new applicant is likely to repay.", "S", "The past loans come with the right answers (labels), so this is supervised learning: classification."],
    ["A music app groups listeners by their listening habits. Nobody tells it what the groups should be.", "U", "There are no labels: the system finds the groups itself. That is unsupervised learning (clustering)."],
    ["A robot vacuum tries different routes round a room and gets a score after each run for how much floor it cleaned.", "R", "An agent acts, gets a reward and changes what it does next. That is reinforcement learning."],
    ["An estate agent predicts the price of a flat from its size, floor and distance to the metro, using past sales.", "S", "Past sales give the right answers, and the output is a number, so this is supervised learning: regression."],
    ["A program learns a board game by playing thousands of games against itself, rewarded for each win.", "R", "No labelled examples, just actions and rewards from the game. Reinforcement learning."],
    ["A shop looks through thousands of receipts to find products that are often bought together.", "U", "The receipts have no labels saying what to find. The system discovers the pattern: unsupervised learning."],
    ["A tool trained on X-rays that specialists have labelled 'fracture' or 'no fracture' flags new X-rays for a doctor to check.", "S", "Labelled examples again, so supervised learning. Deep learning suits images like these."],
    ["Your Session 2 task: predict bounce height from drop height using the measurements you took.", "S", "Each drop height has a measured bounce, the right answer. Predicting a number makes it regression."]
  ];
  function sorter(root) {
    var names = { S: "Supervised", U: "Unsupervised", R: "Reinforcement" };
    root.innerHTML = '<div class="w-title">Which kind of learning?</div><p>Choose one for each example. You can change your mind.</p>';
    var score = el("div", { "class": "msg" });
    var got = {};
    SORT.forEach(function (s, i) {
      var item = el("div", { "class": "sort-item" });
      item.innerHTML = "<p>" + (i + 1) + ". " + s[0] + "</p>";
      var bt = el("div", { "class": "btns" });
      var why = el("div", { "class": "why" });
      ["S", "U", "R"].forEach(function (k) {
        var b = el("button", { "class": "btn", type: "button" }, names[k]);
        b.addEventListener("click", function () {
          var ok = k === s[1];
          item.className = "sort-item " + (ok ? "right" : "wrong");
          why.textContent = ok ? s[2] : "Not quite. Look for labels (right answers), groups found without labels, or rewards for actions.";
          got[i] = ok;
          var n = Object.keys(got).filter(function (j) { return got[j]; }).length;
          score.textContent = n + " of " + SORT.length + " correct";
        });
        bt.appendChild(b);
      });
      item.appendChild(bt);
      item.appendChild(why);
      root.appendChild(item);
    });
    root.appendChild(score);
  }

  /* ---------------- Gradient descent explorer ---------------- */
  function gd(root) {
    root.innerHTML = '<div class="w-title">Gradient descent explorer</div>' +
      '<div class="w-row"><div class="w-controls">' +
      '<label for="gd-data"><b>Your data</b> (drop, bounce in metres, one pair per line)</label>' +
      '<textarea id="gd-data" class="data" rows="8">0.50, 0.31\n0.75, 0.45\n1.00, 0.60\n1.25, 0.73\n1.50, 0.89\n1.75, 1.02\n2.00, 1.18</textarea>' +
      '<div class="slider" style="grid-template-columns:110px 1fr 56px"><label><b>Learning rate</b></label><input type="range" min="0.01" max="1" step="0.01" value="0.1" aria-label="learning rate"><output>0.1</output></div>' +
      '<p class="lr-help">The learning rate is the size of each step. Small: slow but steady. Too big: each step overshoots and the loss grows.</p>' +
      '<div class="presets">Try: <button class="btn" data-lr="0.01">0.01 slow</button><button class="btn" data-lr="0.1">0.1 good</button><button class="btn" data-lr="0.5">0.5 wobbly</button><button class="btn" data-lr="0.8">0.8 too big</button></div>' +
      '<div class="btns"><button class="btn primary" data-a="1">1 step</button><button class="btn" data-a="10">10 steps</button><button class="btn" data-a="100">100 steps</button><button class="btn" data-a="reset">Reset</button></div>' +
      '<label class="done" style="margin:0"><input type="checkbox" class="ls"> Show the least-squares line</label>' +
      '</div><div class="w-view"><canvas width="640" height="400" class="plot"></canvas>' +
      '<div class="stat"><div><small>step</small><b class="s-n">0</b></div><div><small>w</small><b class="s-w">0</b></div><div><small>b</small><b class="s-b">0</b></div>' +
      '<div><small>loss (MSE)</small><b class="s-l"></b></div><div><small>dLoss/dw</small><b class="s-gw"></b></div><div><small>dLoss/db</small><b class="s-gb"></b></div></div>' +
      '<div class="upd"><b>Last step</b><span class="u-w">Press 1 step to see the update.</span><br><span class="u-b"></span></div>' +
      '<canvas width="640" height="150" class="lossplot" style="margin-top:8px"></canvas><div class="msg"></div></div></div>';
    var ta = root.querySelector("textarea"), lrIn = root.querySelector('input[type=range]'), lrOut = root.querySelector("output");
    var plot = root.querySelector(".plot"), lossplot = root.querySelector(".lossplot"), msg = root.querySelector(".msg"), ls = root.querySelector(".ls");
    var X = [], Y = [], w = 0, b = 0, n = 0, hist = [], blown = false;
    function parse() {
      X = []; Y = [];
      ta.value.split(/\n/).forEach(function (line) {
        var p = line.split(/[,\s;]+/).filter(Boolean).map(Number);
        if (p.length >= 2 && isFinite(p[0]) && isFinite(p[1])) { X.push(p[0]); Y.push(p[1]); }
      });
    }
    function lossGrad() {
      var L = 0, gw = 0, gb = 0, m = X.length;
      for (var i = 0; i < m; i++) { var e = w * X[i] + b - Y[i]; L += e * e; gw += 2 * e * X[i]; gb += 2 * e; }
      return [L / m, gw / m, gb / m];
    }
    function exact() {
      var m = X.length, mx = 0, my = 0, sxy = 0, sxx = 0;
      X.forEach(function (x, i) { mx += x / m; my += Y[i] / m; });
      X.forEach(function (x, i) { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) * (x - mx); });
      var ww = sxx ? sxy / sxx : 0; return [ww, my - ww * mx];
    }
    function reset() { parse(); w = 0; b = 0; n = 0; blown = false; hist = [lossGrad()[0]]; msg.textContent = ""; msg.className = "msg"; root.querySelector(".u-w").textContent = "Press 1 step to see the update."; root.querySelector(".u-b").textContent = ""; draw(); }
    function step(k) {
      if (blown || X.length < 2) return;
      var lr = +lrIn.value;
      for (var i = 0; i < k; i++) {
        var g = lossGrad();
        {
          root.querySelector(".u-w").textContent = "w = " + fmt(w, 4) + " - " + lr + " x (" + fmt(g[1], 4) + ") = " + fmt(w - lr * g[1], 4);
          root.querySelector(".u-b").textContent = "b = " + fmt(b, 4) + " - " + lr + " x (" + fmt(g[2], 4) + ") = " + fmt(b - lr * g[2], 4);
        }
        w -= lr * g[1]; b -= lr * g[2]; n++;
        var L = lossGrad()[0]; hist.push(L);
        if (!isFinite(L) || L > 1e6) { blown = true; break; }
      }
      if (blown) { msg.textContent = "The loss is exploding. Each step overshoots further than the last: the learning rate is too big. Press Reset."; msg.className = "msg bad"; }
      else if (hist.length > 3 && Math.abs(hist[hist.length - 1] - hist[hist.length - 2]) < 1e-9) { msg.textContent = "The loss has stopped changing: gradient descent has converged."; msg.className = "msg good"; }
      else if (hist.length > 2 && hist[hist.length - 1] > hist[hist.length - 2]) { msg.textContent = "The loss went up on that step. Watch whether it settles or keeps growing."; msg.className = "msg bad"; }
      else { msg.textContent = ""; msg.className = "msg"; }
      draw();
    }
    function draw() {
      var g = lossGrad();
      root.querySelector(".s-n").textContent = n;
      root.querySelector(".s-w").textContent = fmt(w, 4);
      root.querySelector(".s-b").textContent = fmt(b, 4);
      root.querySelector(".s-l").textContent = fmt(g[0], 5);
      root.querySelector(".s-gw").textContent = fmt(g[1], 4);
      root.querySelector(".s-gb").textContent = fmt(g[2], 4);
      var c = plot.getContext("2d"), W = plot.width, H = plot.height, pad = 52;
      c.clearRect(0, 0, W, H);
      var nice = function (v) { return Math.ceil(v * 1.1 / 0.5) * 0.5; };
      var xmax = nice(Math.max.apply(null, X.concat([1]))), ymax = nice(Math.max.apply(null, Y.concat([0.8])));
      var px = function (x) { return pad + x / xmax * (W - pad - 14); }, py = function (y) { return H - pad - y / ymax * (H - pad - 14); };
      c.strokeStyle = "#E3DED3"; c.fillStyle = "#4A5B6E"; c.font = "13px Lexend, sans-serif"; c.lineWidth = 1;
      var xs = xmax > 3 ? 1 : 0.5, ys = ymax > 1.5 ? 0.5 : 0.25;
      for (var gx = 0; gx <= xmax + 1e-9; gx += xs) {
        c.beginPath(); c.moveTo(px(gx), py(0)); c.lineTo(px(gx), py(ymax)); c.stroke();
        c.fillText(String(+gx.toFixed(2)), px(gx) - 8, H - pad + 18);
      }
      for (var gy = 0; gy <= ymax + 1e-9; gy += ys) {
        c.beginPath(); c.moveTo(px(0), py(gy)); c.lineTo(px(xmax), py(gy)); c.stroke();
        c.fillText(String(+gy.toFixed(2)), 22, py(gy) + 4);
      }
      c.fillText("drop height (m)", W / 2 - 50, H - 8);
      c.save(); c.translate(13, H / 2 + 20); c.rotate(-Math.PI / 2); c.fillText("bounce (m)", 0, 0); c.restore();
      c.save(); c.beginPath(); c.rect(pad, 0, W - pad, H - pad); c.clip();
      if (ls.checked && X.length > 1) {
        var e = exact(); c.setLineDash([6, 5]); c.strokeStyle = "#6B46C1"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(px(0), py(e[1])); c.lineTo(px(xmax), py(e[0] * xmax + e[1])); c.stroke(); c.setLineDash([]);
      }
      if (isFinite(w) && isFinite(b)) {
        c.strokeStyle = "#079D8F"; c.lineWidth = 3;
        c.beginPath(); c.moveTo(px(0), py(b)); c.lineTo(px(xmax), py(w * xmax + b)); c.stroke();
        c.strokeStyle = "rgba(255,107,107,0.7)"; c.lineWidth = 1.5;
        X.forEach(function (x, i) { c.beginPath(); c.moveTo(px(x), py(Y[i])); c.lineTo(px(x), py(w * x + b)); c.stroke(); });
      }
      c.restore();
      c.fillStyle = "#0B2A4A";
      X.forEach(function (x, i) { c.beginPath(); c.arc(px(x), py(Y[i]), 5, 0, 7); c.fill(); });
      // loss history on a log scale
      var d = lossplot.getContext("2d"), LW = lossplot.width, LH = lossplot.height;
      d.clearRect(0, 0, LW, LH);
      d.fillStyle = "#4A5B6E"; d.font = "12px Lexend, sans-serif"; d.fillText("loss over steps (log scale)", 10, 16);
      var hs = hist.filter(function (v) { return isFinite(v) && v > 0; });
      if (hs.length > 1) {
        var lo = Math.log10(Math.min.apply(null, hs)), hi = Math.log10(Math.max.apply(null, hs));
        if (hi - lo < 1) hi = lo + 1;
        d.strokeStyle = blown ? "#C73E3E" : "#079D8F"; d.lineWidth = 2; d.beginPath();
        hs.forEach(function (v, i) {
          var x = 10 + i / (hs.length - 1) * (LW - 20), y = LH - 10 - (Math.log10(v) - lo) / (hi - lo) * (LH - 34);
          if (i) d.lineTo(x, y); else d.moveTo(x, y);
        });
        d.stroke();
      }
    }
    lrIn.addEventListener("input", function () { lrOut.textContent = lrIn.value; });
    root.querySelectorAll("[data-lr]").forEach(function (bt) {
      bt.addEventListener("click", function () { lrIn.value = bt.getAttribute("data-lr"); lrOut.textContent = lrIn.value; reset(); });
    });
    ls.addEventListener("change", draw);
    ta.addEventListener("change", reset);
    root.querySelectorAll("[data-a]").forEach(function (bt) {
      bt.addEventListener("click", function () { var a = bt.getAttribute("data-a"); if (a === "reset") reset(); else step(+a); });
    });
    reset();
  }

  /* ---------------- Back propagation stepper ---------------- */
  function backprop(root) {
    var N = { x1: [50, 70], x2: [50, 190], h1: [230, 70], h2: [230, 190], o: [410, 130] };
    var E = [["x1", "h1", "W11 = 0.5"], ["x2", "h1", "W12 = 0.25"], ["x1", "h2", "W21 = -0.5"], ["x2", "h2", "W22 = 0.5"], ["h1", "o", "v1 = 1"], ["h2", "o", "v2 = 2"]];
    var S = [
      { t: "The network: 2 inputs, 2 hidden neurons with ReLU, 1 output. The inputs are <code>x = (1, 2)</code> and the target is <code>3</code>. Press <b>Next</b> to run it forwards.", v: { x1: "1", x2: "2" }, on: [] },
      { t: "Hidden neuron 1: <code>z1 = 0.5&times;1 + 0.25&times;2 = 1</code>. ReLU keeps positive numbers, so <code>h1 = 1</code>.", v: { x1: "1", x2: "2", h1: "h1 = 1" }, on: ["x1h1", "x2h1", "h1"] },
      { t: "Hidden neuron 2: <code>z2 = -0.5&times;1 + 0.5&times;2 = 0.5</code>, so <code>h2 = 0.5</code>.", v: { x1: "1", x2: "2", h1: "h1 = 1", h2: "h2 = 0.5" }, on: ["x1h2", "x2h2", "h2"] },
      { t: "Output: <code>out = 1&times;1 + 2&times;0.5 = 2</code>.", v: { x1: "1", x2: "2", h1: "h1 = 1", h2: "h2 = 0.5", o: "out = 2" }, on: ["h1o", "h2o", "o"] },
      { t: "Loss: <code>(out - target)&sup2; = (2 - 3)&sup2; = 1</code>. Now go <b>backwards</b> to find how each weight affected that loss.", v: { x1: "1", x2: "2", h1: "h1 = 1", h2: "h2 = 0.5", o: "loss = 1" }, on: ["o"], back: true },
      { t: "Start at the end: <code>dLoss/dout = 2(out - target) = 2(2 - 3) = -2</code>. Negative means: make the output bigger to reduce the loss.", v: { o: "dL/dout = -2" }, on: ["o"], back: true },
      { t: "Output weights: <code>dLoss/dv = dLoss/dout &times; h</code>, so <code>dLoss/dv1 = -2&times;1 = -2</code> and <code>dLoss/dv2 = -2&times;0.5 = -1</code>.", v: { o: "dL/dout = -2" }, e: { h1o: "dL/dv1 = -2", h2o: "dL/dv2 = -1" }, on: ["h1o", "h2o"], back: true },
      { t: "Pass the blame back to the hidden neurons: <code>dLoss/dh = dLoss/dout &times; v</code>, so <code>dLoss/dh1 = -2&times;1 = -2</code> and <code>dLoss/dh2 = -2&times;2 = -4</code>.", v: { o: "dL/dout = -2", h1: "dL/dh1 = -2", h2: "dL/dh2 = -4" }, on: ["h1", "h2"], back: true },
      { t: "Through ReLU: both z values were positive, so ReLU passed them straight through and its slope is 1. <code>dLoss/dz1 = -2</code>, <code>dLoss/dz2 = -4</code>. (If a z had been negative, its slope would be 0 and the gradient would stop there.)", v: { h1: "dL/dz1 = -2", h2: "dL/dz2 = -4" }, on: ["h1", "h2"], back: true },
      { t: "First-layer weights: <code>dLoss/dW = dLoss/dz &times; input</code>. Row 1: <code>-2&times;(1, 2) = (-2, -4)</code>. Row 2: <code>-4&times;(1, 2) = (-4, -8)</code>.", v: { h1: "dL/dz1 = -2", h2: "dL/dz2 = -4" }, e: { x1h1: "-2", x2h1: "-4", x1h2: "-4", x2h2: "-8" }, on: ["x1h1", "x2h1", "x1h2", "x2h2"], back: true },
      { t: "Update every weight: <code>new = old - learning rate &times; gradient</code>. With learning rate 0.01, <code>v1</code> becomes <code>1 - 0.01&times;(-2) = 1.02</code>. Run forwards again and the output is about <code>2.53</code>, so the loss drops from <code>1</code> to <code>0.22</code>.", v: { x1: "1", x2: "2", h1: "h1 = 1.10", h2: "h2 = 0.70", o: "out = 2.53" }, e: { x1h1: "0.52", x2h1: "0.29", x1h2: "-0.46", x2h2: "0.58", h1o: "1.02", h2o: "2.01" }, on: ["o"] }
    ];
    var i = 0;
    root.innerHTML = '<div class="w-title">Back propagation, one step at a time</div><div class="bp-view"></div><div class="bp-text"></div>' +
      '<div class="btns"><button class="btn" data-d="-1">Back</button><button class="btn primary" data-d="1">Next</button><span class="msg" style="margin:6px 0 0 6px"></span></div>';
    var view = root.querySelector(".bp-view"), text = root.querySelector(".bp-text"), cnt = root.querySelector(".msg");
    function draw() {
      var s = S[i], col = s.back ? "#C73E3E" : "#079D8F";
      var svg = '<svg viewBox="0 0 520 260" class="bp-svg" role="img" aria-label="A network with two inputs, two hidden neurons and one output">';
      E.forEach(function (e) {
        var a = N[e[0]], b2 = N[e[1]], id = e[0] + e[1], on = s.on.indexOf(id) >= 0;
        svg += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b2[0] + '" y2="' + b2[1] + '" stroke="' + (on ? col : "#C9C3B6") + '" stroke-width="' + (on ? 4 : 2) + '"/>';
        var tt = (id === "x1h2" || id === "x2h1") ? 0.33 : 0.5, off = (id === "x2h2") ? 18 : -7;
        var mx = a[0] + (b2[0] - a[0]) * tt, my = a[1] + (b2[1] - a[1]) * tt + off;
        var lab = (s.e && s.e[id]) ? s.e[id] : e[2];
        svg += '<text x="' + mx + '" y="' + my + '" font-size="12.5" text-anchor="middle" fill="' + ((s.e && s.e[id]) ? col : "#4A5B6E") + '" font-weight="' + ((s.e && s.e[id]) ? 700 : 400) + '" paint-order="stroke" stroke="white" stroke-width="4">' + lab + '</text>';
      });
      Object.keys(N).forEach(function (k) {
        var p = N[k], on = s.on.indexOf(k) >= 0;
        svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="26" fill="' + (on ? (s.back ? "#FFE3E3" : "#FFF3C4") : "#F8F6F1") + '" stroke="' + (on ? col : "#0B2A4A") + '" stroke-width="' + (on ? 3 : 1.5) + '"/>';
        svg += '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="14" font-weight="600">' + k.replace("o", "out") + '</text>';
        if (s.v[k]) svg += '<text x="' + p[0] + '" y="' + (p[1] + 46) + '" text-anchor="middle" font-size="13" font-weight="600" fill="' + col + '">' + s.v[k] + '</text>';
      });
      svg += '<text x="500" y="250" text-anchor="end" font-size="12" fill="#4A5B6E">target = 3</text></svg>';
      view.innerHTML = svg;
      text.innerHTML = s.t;
      cnt.textContent = "Step " + (i + 1) + " of " + S.length + (s.back ? " · backward pass" : (i ? " · forward pass" : ""));
      root.querySelector('[data-d="-1"]').disabled = i === 0;
      root.querySelector('[data-d="1"]').disabled = i === S.length - 1;
    }
    root.querySelectorAll("[data-d]").forEach(function (b) {
      b.addEventListener("click", function () { i = Math.max(0, Math.min(S.length - 1, i + (+b.getAttribute("data-d")))); draw(); });
    });
    draw();
  }

  var W = { neuron: neuron, sort: sorter, gd: gd, backprop: backprop };
  document.querySelectorAll("[data-widget]").forEach(function (root) {
    var f = W[root.getAttribute("data-widget")];
    if (f) { root.classList.add("widget"); f(root); }
  });
})();
