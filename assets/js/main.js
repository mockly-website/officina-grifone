/* Officina Grifone — comportamenti del sito (nessuna dipendenza esterna) */
(function () {
  "use strict";

  var doc = document.documentElement;
  var riduci = doc.classList.contains("riduci");
  var WA = "https://wa.me/393517578080?text=";
  var desktop = window.matchMedia("(min-width: 1024px)");
  var tablet = window.matchMedia("(min-width: 768px)");

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var GIORNI_CORTI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var MESI_CORTI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  function dataLunga(d) { return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear(); }
  function migliaia(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  /* ---------------- Menu ---------------- */
  var menu = $("#menu");
  var tastoMenu = $(".menu-tasto");
  var ultimoFuoco = null;
  var scrollSalvato = 0;
  function bloccaPagina(si) {
    var b = document.body.style;
    if (si) {
      scrollSalvato = window.scrollY;
      b.position = "fixed"; b.top = -scrollSalvato + "px"; b.left = "0"; b.right = "0";
    } else {
      b.position = ""; b.top = ""; b.left = ""; b.right = "";
      window.scrollTo({ top: scrollSalvato, behavior: "instant" });
    }
  }
  function apriMenu() {
    ultimoFuoco = document.activeElement && document.activeElement !== document.body ? document.activeElement : tastoMenu;
    menu.classList.add("is-aperto");
    document.body.classList.add("menu-aperto");
    bloccaPagina(true);
    tastoMenu.setAttribute("aria-expanded", "true");
    setTimeout(function () { $(".menu__chiudi", menu).focus(); }, 30);
  }
  function chiudiMenu(senzaFuoco) {
    if (!menu.classList.contains("is-aperto")) return;
    menu.classList.remove("is-aperto");
    document.body.classList.remove("menu-aperto");
    bloccaPagina(false);
    tastoMenu.setAttribute("aria-expanded", "false");
    if (!senzaFuoco && ultimoFuoco) ultimoFuoco.focus();
  }
  if (menu && tastoMenu) {
    tastoMenu.addEventListener("click", apriMenu);
    $$("[data-chiudi]", menu).forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (el.tagName === "A") {
          e.preventDefault();
          chiudiMenu(true);
          var dest = document.querySelector(el.getAttribute("href"));
          if (dest) dest.scrollIntoView({ behavior: riduci ? "auto" : "smooth" });
        } else chiudiMenu();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-aperto")) return;
      if (e.key === "Escape") { chiudiMenu(); return; }
      if (e.key === "Tab") {
        var f = $$("a, button", $(".menu__pannello", menu));
        var primo = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
      }
    });
    desktop.addEventListener("change", function () { chiudiMenu(true); });
  }

  /* ---------------- Righello di avanzamento ---------------- */
  var righello = $(".righello");
  var lettura = $(".righello__lettura");
  var numeri = $(".righello__numeri");
  function disegnaNumeri() {
    if (!numeri) return;
    var h = window.innerHeight, html = "";
    for (var y = 40, n = 1; y < h; y += 40, n++) {
      if (n % 2 === 0) html += '<span style="top:' + (y - 5) + 'px">' + n / 2 + "</span>";
    }
    numeri.innerHTML = html;
  }
  function aggiornaRighello() {
    if (!righello) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    righello.style.setProperty("--p", p.toFixed(4));
    if (lettura) lettura.textContent = Math.round(window.scrollY * 0.2646) + " mm";
  }

  /* ---------------- Aperto ora (orari di esempio) ---------------- */
  var ORARI = { 0: [], 1: [[480, 750], [870, 1110]], 2: [[480, 750], [870, 1110]], 3: [[480, 750], [870, 1110]], 4: [[480, 750], [870, 1110]], 5: [[480, 750], [870, 1110]], 6: [[480, 720]] };
  function hm(m) { return Math.floor(m / 60) + ":" + pad(m % 60); }
  function statoOra() {
    var now = new Date(), g = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    var aperto = ORARI[g].some(function (f) { return m >= f[0] && m < f[1]; });
    var testo;
    if (aperto) {
      var fine = ORARI[g].filter(function (f) { return m >= f[0] && m < f[1]; })[0][1];
      testo = "Aperto ora · chiude alle " + hm(fine);
    } else {
      var prossimo = null;
      for (var k = 0; k < 8 && !prossimo; k++) {
        var gg = (g + k) % 7;
        for (var i = 0; i < ORARI[gg].length; i++) {
          if (k > 0 || ORARI[gg][i][0] > m) { prossimo = { k: k, gg: gg, m: ORARI[gg][i][0] }; break; }
        }
      }
      var quando = prossimo.k === 0 ? "oggi" : prossimo.k === 1 ? "domani" : GIORNI[prossimo.gg];
      testo = "Chiuso · riapre " + quando + " alle " + hm(prossimo.m);
    }
    $$("[data-stato]").forEach(function (el) { el.textContent = testo; el.classList.toggle("is-aperto", aperto); });
    $$(".barra__stato").forEach(function (el) { el.classList.toggle("is-aperto", aperto); });
    $$(".orari li").forEach(function (li) {
      li.classList.toggle("is-oggi", li.getAttribute("data-giorni").split(",").indexOf(String(g)) > -1);
    });
  }
  statoOra();
  setInterval(statoOra, 60000);

  /* ---------------- Comparse allo scorrimento ---------------- */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !riduci) {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add("is-in"); io.unobserve(v.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------- Esploso dell'auto (home) ---------------- */
  var esploso = $(".esploso");
  var aggiornaEsploso = function () {};
  if (esploso) {
    var svg = $(".auto", esploso);
    var testo = $(".esploso__testo", esploso);
    var pin = $(".esploso__pin", esploso);
    var palco = $(".esploso__palco", esploso);
    var pezzi = $$(".pezzo[data-dx]", svg);
    var assi = $$(".asse", svg);
    var lettere = $$(".lettera", esploso);
    var dida = $("[data-dida]", esploso);
    var finale = false;
    var mappaLettere = {};
    lettere.forEach(function (l) { mappaLettere[l.getAttribute("data-per")] = l; });
    var ordine = ["motore", "batteria", "centralina", "clima", "ruota-ant", "ruota-post", "disco", "scarico"];

    function facile(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function mostraLettera(l, si) {
      if (l.classList.contains("is-visibile") === si) return;
      l.classList.toggle("is-visibile", si);
      if (si && tablet.matches) { l.removeAttribute("tabindex"); l.removeAttribute("aria-hidden"); }
      else { l.setAttribute("tabindex", "-1"); l.setAttribute("aria-hidden", "true"); }
    }
    function applica(p) {
      pezzi.forEach(function (g) {
        var id = g.getAttribute("data-pezzo");
        var i = ordine.indexOf(id);
        var t = facile(clamp((p - 0.04 - i * 0.055) / 0.42, 0, 1));
        var dx = +g.getAttribute("data-dx") * t, dy = +g.getAttribute("data-dy") * t;
        g.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        g.classList.toggle("is-staccato", t > 0.5);
        var l = mappaLettere[id];
        if (l) mostraLettera(l, t > 0.97);
        if (righe[id]) righe[id].classList.toggle("is-on", t > 0.9);
      });
      svg.style.setProperty("--assi", clamp(p * 1.6, 0, 0.8).toFixed(3));
      var tutto = p > 0.88;
      if (tutto !== finale && dida) {
        finale = tutto;
        dida.textContent = tutto ? "Tocca un pezzo: prezzi e tempi di quel lavoro." : "Scorri: smontiamo l'auto pezzo per pezzo.";
      }
    }
    var cima = 0, libero = false;
    var righe = {};
    $$(".vivo__riga", esploso).forEach(function (r) { righe[r.getAttribute("data-per")] = r; });
    function misura() {
      esploso.classList.remove("is-libero");
      cima = parseFloat(getComputedStyle(palco).top) || 0;
      var barra = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
      var alto = desktop.matches ? pin.scrollHeight : palco.offsetHeight;
      libero = alto > window.innerHeight - cima - barra + 4 || (desktop.matches && window.innerHeight < 640);
      esploso.classList.toggle("is-libero", libero);
    }
    aggiornaEsploso = function () {
      if (riduci) return;
      var r = esploso.getBoundingClientRect();
      var p;
      if (libero) {
        var a = svg.getBoundingClientRect();
        p = (window.innerHeight * 0.78 - a.top) / (window.innerHeight * 0.5);
      } else if (desktop.matches) {
        var top = parseFloat(getComputedStyle(pin).top) || 0;
        p = (top - r.top) / Math.max(1, r.height - pin.offsetHeight);
      } else {
        var off = testo.offsetHeight;
        p = (cima - r.top - off) / Math.max(1, r.height - off - palco.offsetHeight);
      }
      applica(clamp(p, 0, 1));
    };
    misura();
    if (riduci) {
      applica(1);
    } else {
      // il plotter disegna l'auto all'ingresso
      var plotter = $(".plotter", esploso);
      requestAnimationFrame(function () {
        plotter.style.setProperty("--larghezza", palco.querySelector(".palco").offsetWidth + "px");
        plotter.classList.add("is-va");
        svg.classList.add("is-disegnata");
      });
      setTimeout(function () {
        if (window.scrollY < 40) {
          svg.classList.add("is-accenno");
          setTimeout(function () { svg.classList.remove("is-accenno"); }, 1200);
        }
      }, 1500);
      aggiornaEsploso();
    }
    // tocco o passaggio su una lettera o su una riga della distinta: il pezzo si accende
    $$("[data-per]").forEach(function (el) {
      var g = $('.pezzo[data-pezzo="' + el.getAttribute("data-per") + '"]', svg);
      if (!g) return;
      var on = function () { g.classList.add("is-attivo"); };
      var off = function () { g.classList.remove("is-attivo"); };
      el.addEventListener("pointerenter", on);
      el.addEventListener("pointerleave", off);
      el.addEventListener("focus", on);
      el.addEventListener("blur", off);
    });
    window.addEventListener("resize", function () { misura(); aggiornaEsploso(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { misura(); aggiornaEsploso(); });
  }

  /* ---------------- Scorrimento: un solo ciclo per fotogramma ---------------- */
  var inCoda = false;
  function suScroll() {
    if (inCoda) return;
    inCoda = true;
    requestAnimationFrame(function () { inCoda = false; aggiornaRighello(); aggiornaEsploso(); });
  }
  window.addEventListener("scroll", suScroll, { passive: true });
  window.addEventListener("resize", function () { disegnaNumeri(); suScroll(); });
  disegnaNumeri();
  aggiornaRighello();

  /* ---------------- Promemoria tagliando ---------------- */
  var calcolo = $("#calcolo");
  if (calcolo) {
    var cData = $("#c-data"), cPrima = $("#c-kmprima"), cOggi = $("#c-kmoggi"), cInt = $("#c-intervallo");
    var oggi = new Date(); oggi.setHours(12, 0, 0, 0);
    cData.max = oggi.getFullYear() + "-" + pad(oggi.getMonth() + 1) + "-" + pad(oggi.getDate());
    var ultimoEsito = null;

    function errore(campo, si) {
      var c = $('[data-campo="' + campo + '"]', calcolo);
      c.classList.toggle("is-errore", si);
      $("input", c).setAttribute("aria-invalid", si ? "true" : "false");
    }
    function leggi(mostraErrori) {
      var d = cData.value ? new Date(cData.value + "T12:00:00") : null;
      var a = cPrima.value === "" ? NaN : Number(cPrima.value);
      var b = cOggi.value === "" ? NaN : Number(cOggi.value);
      var eD = !d || isNaN(d) || d > oggi;
      var eA = !(a >= 0 && a < 1e6);
      var eB = !(b >= 0 && b < 1e6) || (!eA && b < a);
      if (mostraErrori) { errore("data", eD); errore("kmprima", eA); errore("kmoggi", eB); }
      else {
        if (!eD) errore("data", false);
        if (!eA) errore("kmprima", false);
        if (!eB) errore("kmoggi", false);
      }
      if (eD || eA || eB) return null;
      var iv = cInt.value.split("-");
      return { data: d, kmPrima: a, kmOggi: b, intKm: +iv[0], intMesi: +iv[1] };
    }
    function calcola(v) {
      var giorniPassati = Math.max(0, Math.round((oggi - v.data) / 864e5));
      var fatti = v.kmOggi - v.kmPrima;
      var scadTempo = new Date(v.data); scadTempo.setMonth(scadTempo.getMonth() + v.intMesi);
      var kmLimite = v.kmPrima + v.intKm;
      var scadKm = null;
      if (giorniPassati >= 14 && fatti > 0) {
        var alGiorno = fatti / giorniPassati;
        scadKm = new Date(oggi.getTime() + ((kmLimite - v.kmOggi) / alGiorno) * 864e5);
      }
      var scad = scadKm && scadKm < scadTempo ? scadKm : scadTempo;
      var perKm = scad === scadKm;
      var giorniMancanti = Math.round((scad - oggi) / 864e5);
      var kmMancanti = kmLimite - v.kmOggi;
      var giorniTot = Math.round((scadTempo - v.data) / 864e5);
      return { scad: scad, perKm: perKm, gm: giorniMancanti, km: kmMancanti, kmLimite: kmLimite,
        fracKm: clamp(fatti / v.intKm, 0, 1), fracT: clamp(giorniPassati / giorniTot, 0, 1),
        fatti: fatti, giorniPassati: giorniPassati, stimaKm: !!scadKm, v: v };
    }
    function mesi(g) { var m = Math.round(g / 30.4); return m <= 1 ? (g + " giorni") : (m + " mesi"); }
    function mostra(r) {
      ultimoEsito = r;
      $("[data-vuoto]", calcolo).hidden = true;
      $("[data-pieno]", calcolo).hidden = false;
      var st = $("[data-stato-t]", calcolo);
      var scaduto = r.gm < 0 || r.km < 0;
      var vicino = !scaduto && (r.gm <= 30 || r.km <= 1000);
      st.className = "esito__stato " + (scaduto ? "esito__stato--scaduto" : vicino ? "esito__stato--vicino" : "esito__stato--ok");
      st.textContent = scaduto ? "Tagliando scaduto" : vicino ? "Ci siamo quasi" : "Tutto in regola";
      $("[data-data]", calcolo).textContent = dataLunga(r.scad);
      $("[data-etichetta-t]", calcolo).textContent = scaduto ? "Era da fare entro il" : "Prossimo tagliando entro il";
      if (scaduto && r.scad > oggi) {
        $("[data-etichetta-t]", calcolo).textContent = "Chilometri superati: da fare";
        $("[data-data]", calcolo).textContent = "Adesso";
      }
      var frase;
      if (scaduto) frase = "Sei oltre la scadenza: meglio non aspettare. Olio vecchio e filtri pieni consumano il motore piano piano.";
      else {
        frase = "O a " + migliaia(r.kmLimite) + " km, quello che arriva prima. Mancano circa " + migliaia(Math.max(0, r.km)) + " km e " + Math.max(0, r.gm) + " giorni.";
        if (!r.stimaKm) frase += " Con pochi giorni di dati contiamo solo il tempo.";
        else if (r.perKm) frase += " Arrivi prima ai chilometri che alla data.";
      }
      $("[data-frase]", calcolo).textContent = frase;
      $("[data-km-testo]", calcolo).textContent = migliaia(Math.max(0, r.fatti)) + " di " + migliaia(r.v.intKm) + " km";
      $("[data-tempo-testo]", calcolo).textContent = mesi(r.giorniPassati) + " di " + r.v.intMesi + " mesi";
      $("[data-km-barra]", calcolo).style.setProperty("--v", r.fracKm.toFixed(3));
      $("[data-tempo-barra]", calcolo).style.setProperty("--v", r.fracT.toFixed(3));
      $("[data-prenota-t]", calcolo).href = "prenota.html?servizio=tagliando&km=" + r.v.kmOggi;
    }
    calcolo.addEventListener("input", function () { var v = leggi(false); if (v) mostra(calcola(v)); });
    calcolo.addEventListener("change", function () { var v = leggi(false); if (v) mostra(calcola(v)); });
    calcolo.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = leggi(true);
      if (!v) { var primo = $(".is-errore input", calcolo); if (primo) primo.focus(); return; }
      mostra(calcola(v));
    });
    $("[data-calendario]", calcolo).addEventListener("click", function () {
      if (!ultimoEsito) return;
      var d = new Date(ultimoEsito.scad.getTime() - 14 * 864e5);
      if (d < oggi) d = new Date(oggi.getTime() + 864e5);
      var f = function (x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()); };
      var dopo = new Date(d.getTime() + 864e5);
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Officina Grifone demo//IT", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
        "UID:tagliando-" + f(d) + "-" + Date.now() + "@officina-grifone.demo",
        "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
        "DTSTART;VALUE=DATE:" + f(d), "DTEND;VALUE=DATE:" + f(dopo),
        "SUMMARY:Prenotare il tagliando (entro il " + dataLunga(ultimoEsito.scad) + ")",
        "DESCRIPTION:Promemoria creato sul sito dimostrativo dell'Officina Grifone (Mockly). Limite: " + migliaia(ultimoEsito.kmLimite) + " km.",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "promemoria-tagliando.ics";
      document.body.appendChild(a); a.click(); a.remove();
      var btn = this; var t = btn.textContent;
      btn.textContent = "Promemoria scaricato ✓";
      setTimeout(function () { btn.textContent = t; }, 2400);
    });
  }

  /* ---------------- Cosa senti? (servizi) ---------------- */
  var gettoni = $$(".sintomi .gettone");
  if (gettoni.length) {
    var vuoto = $("[data-sintomo-vuoto]"), pieno = $("[data-sintomo-pieno]"), link = $("[data-sintomo-link]");
    gettoni.forEach(function (g) {
      g.addEventListener("click", function () {
        var gia = g.getAttribute("aria-pressed") === "true";
        gettoni.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        $$(".tavola").forEach(function (t) { t.classList.remove("is-trovata"); });
        if (gia) { vuoto.hidden = false; pieno.hidden = true; link.hidden = true; return; }
        g.setAttribute("aria-pressed", "true");
        var t = $('.tavola[data-sigla="' + g.getAttribute("data-sigla") + '"]');
        t.classList.add("is-trovata");
        var nome = $(".tavola__titolo", t).textContent;
        vuoto.hidden = true; pieno.hidden = false; link.hidden = false;
        pieno.innerHTML = "Parti da qui: <strong>tavola " + g.getAttribute("data-sigla") + ", " + nome + "</strong>.";
        link.href = "#" + t.id;
      });
    });
  }

  /* ---------------- Prenotazione ---------------- */
  var form = $("#ordine");
  if (form) {
    var passo = 1;
    var passi = $$("[data-passo]", form);
    var indicatori = $$("[data-passo-ind]");
    var bAvanti = $("[data-avanti]", form), bIndietro = $("[data-indietro]", form);
    var inviato = $("[data-inviato]");
    var targa = $("#p-targa");

    // giorni aperti: dal giorno dopo, per due settimane, domenica esclusa
    var lista = $("[data-giorni]", form);
    var d0 = new Date(); d0.setHours(12, 0, 0, 0);
    var html = "", n = 0;
    for (var k = 1; k <= 15 && n < 10; k++) {
      var d = new Date(d0.getTime() + k * 864e5);
      if (d.getDay() === 0) continue;
      var val = GIORNI[d.getDay()] + " " + d.getDate() + " " + MESI[d.getMonth()];
      html += '<li class="giorno"><input type="radio" name="giorno" id="g-' + k + '" value="' + val + '" data-sab="' + (d.getDay() === 6 ? 1 : 0) + '"><label for="g-' + k + '">' + GIORNI_CORTI[d.getDay()] + "<b>" + d.getDate() + "</b>" + MESI_CORTI[d.getMonth()] + "</label></li>";
      n++;
    }
    lista.innerHTML = html;

    // dati arrivati da altre pagine
    var q = new URLSearchParams(location.search);
    if (q.get("servizio")) { var cb = $('[data-chiave="' + q.get("servizio").replace(/[^a-z-]/g, "") + '"]', form); if (cb) cb.checked = true; }
    if (/^\d{1,6}$/.test(q.get("km") || "")) $("#p-km").value = q.get("km");

    function normTarga(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
    function bellaTarga(v) { var t = normTarga(v); return t.length === 7 ? t.slice(0, 2) + " " + t.slice(2, 5) + " " + t.slice(5) : t; }
    function valori() {
      var lavori = $$('input[name="lavori"]:checked', form).map(function (i) { return i.value; });
      var g = $('input[name="giorno"]:checked', form), f = $('input[name="fascia"]:checked', form), s = $('input[name="sosta"]:checked', form);
      return {
        lavori: lavori.join(", "),
        targa: normTarga(targa.value) ? bellaTarga(targa.value) : "",
        modello: $("#p-modello").value.trim(),
        km: $("#p-km").value ? migliaia(+$("#p-km").value) + " km" : "",
        problema: $("#p-problema").value.trim(),
        giorno: g ? g.value : "",
        fascia: f ? f.value : "",
        sosta: s ? s.value : "",
        nome: $("#p-nome").value.trim()
      };
    }
    function riepilogo() {
      var v = valori();
      $$("[data-r]").forEach(function (dd) {
        var x = v[dd.getAttribute("data-r")];
        dd.textContent = x || "—";
        dd.classList.toggle("is-vuoto", !x);
      });
    }
    function segna(campo, si) {
      var c = $('[data-campo="' + campo + '"]', form);
      if (!c) return;
      c.classList.toggle("is-errore", si);
      var inp = $("input, textarea", c);
      if (inp && inp.type !== "radio") inp.setAttribute("aria-invalid", si ? "true" : "false");
    }
    function controlla(n) {
      var ok = true;
      if (n === 1) {
        var e = $('[data-errore="lavori"]', form);
        var vuoto = !$('input[name="lavori"]:checked', form);
        e.classList.toggle("is-visibile", vuoto);
        ok = !vuoto;
      } else if (n === 2) {
        var t = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normTarga(targa.value));
        var m = $("#p-modello").value.trim().length >= 3;
        var kmv = $("#p-km").value;
        var kmok = kmv === "" || /^\d{1,6}$/.test(kmv);
        segna("targa", !t); segna("modello", !m); segna("km", !kmok);
        ok = t && m && kmok;
      } else {
        var g = !!$('input[name="giorno"]:checked', form);
        var f = !!$('input[name="fascia"]:checked', form);
        var no = $("#p-nome").value.trim().length >= 2;
        segna("giorno", !g); segna("fascia", !f); segna("nome", !no);
        ok = g && f && no;
      }
      if (!ok) {
        var primo = $(".is-errore input, .is-errore textarea", passi[n - 1]) || $("input", passi[n - 1]);
        if (primo) primo.focus();
      }
      return ok;
    }
    function vai(n) {
      passo = n;
      passi.forEach(function (p) { p.hidden = +p.getAttribute("data-passo") !== n; });
      indicatori.forEach(function (li) {
        var i = +li.getAttribute("data-passo-ind");
        if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
        li.classList.toggle("is-fatto", i < n);
      });
      bIndietro.hidden = n === 1;
      bAvanti.textContent = n === 3 ? "Apri WhatsApp con il riepilogo" : "Avanti";
      var leg = $("legend", passi[n - 1]);
      var top = form.getBoundingClientRect().top + window.scrollY - 120;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: riduci ? "auto" : "smooth" });
      leg.focus({ preventScroll: true });
    }
    function messaggio() {
      var v = valori();
      var r = [
        "*PROVA DAL SITO DIMOSTRATIVO — Officina Grifone (Mockly)*",
        "Prenotazione di un controllo:",
        "• Lavori: " + v.lavori,
        "• Targa: " + v.targa,
        "• Auto: " + v.modello
      ];
      if (v.km) r.push("• Km: " + v.km);
      if (v.problema) r.push("• Problema: " + v.problema);
      r.push("• Giorno: " + v.giorno + ", " + v.fascia.toLowerCase());
      r.push("• " + v.sosta);
      r.push("• Nome: " + v.nome);
      r.push("", "(È una demo: l'officina è inventata.)");
      return r.join("\n");
    }

    form.addEventListener("input", function (e) {
      if (e.target === targa) {
        var pos = targa.value.length;
        targa.value = targa.value.toUpperCase();
        try { targa.setSelectionRange(pos, pos); } catch (err) {}
      }
      var c = e.target.closest("[data-campo]");
      if (c && c.classList.contains("is-errore")) segna(c.getAttribute("data-campo"), false);
      if (e.target.name === "lavori") $('[data-errore="lavori"]', form).classList.remove("is-visibile");
      riepilogo();
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "giorno") {
        var sab = e.target.getAttribute("data-sab") === "1";
        var pom = $("#f-pom");
        pom.disabled = sab;
        if (sab && pom.checked) pom.checked = false;
        $("[data-pom-nota]").textContent = sab ? "il sabato si chiude alle 12" : "14:30–18:30";
        segna("giorno", false);
      }
      if (e.target.name === "fascia") segna("fascia", false);
      riepilogo();
    });
    $("[data-targa-esempio]", form).addEventListener("click", function () {
      targa.value = "AB 123 CD";
      segna("targa", false);
      riepilogo();
      targa.focus();
    });
    $$("[data-aggiungi]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var ta = $("#p-problema");
        var t = b.textContent.toLowerCase();
        if (ta.value.toLowerCase().indexOf(t) === -1) ta.value = (ta.value.trim() ? ta.value.trim() + ", " : "") + t;
        b.classList.add("is-scelto");
        riepilogo();
      });
    });
    bIndietro.addEventListener("click", function () { if (passo > 1) vai(passo - 1); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!controlla(passo)) return;
      if (passo < 3) { vai(passo + 1); return; }
      var url = WA + encodeURIComponent(messaggio());
      bAvanti.disabled = true;
      bAvanti.textContent = "Apro WhatsApp…";
      $("[data-link-wa]").href = url;
      var w = window.open(url, "_blank");
      if (w) { try { w.opener = null; } catch (err) {} }
      setTimeout(function () {
        bAvanti.disabled = false;
        form.hidden = true;
        $(".passi").hidden = true;
        inviato.hidden = false;
        inviato.focus();
        if (!w) $("[data-link-wa]").textContent = "Il browser l'ha bloccato: tocca qui per aprirlo";
      }, 450);
    });
    $("[data-ricomincia]").addEventListener("click", function () {
      form.reset();
      $$(".gettone.is-scelto", form).forEach(function (b) { b.classList.remove("is-scelto"); });
      form.hidden = false;
      $(".passi").hidden = false;
      inviato.hidden = true;
      riepilogo();
      vai(1);
    });
    riepilogo();
  }
})();
