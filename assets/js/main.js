/* Officina Grifone — comportamenti del sito (nessuna dipendenza esterna) */
(function () {
  "use strict";

  var riduci = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var WA = "https://wa.me/393517578080?text=";
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

  /* ---------------- Menu su telefono ---------------- */
  var tastoMenu = $(".menu-tasto");
  var menu = $("#menu");
  function chiudiMenu() {
    menu.hidden = true;
    tastoMenu.setAttribute("aria-expanded", "false");
    tastoMenu.setAttribute("aria-label", "Apri il menu");
  }
  if (tastoMenu && menu) {
    tastoMenu.addEventListener("click", function () {
      if (!menu.hidden) { chiudiMenu(); return; }
      menu.hidden = false;
      tastoMenu.setAttribute("aria-expanded", "true");
      tastoMenu.setAttribute("aria-label", "Chiudi il menu");
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", chiudiMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { chiudiMenu(); tastoMenu.focus(); }
    });
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
    $$(".orari li").forEach(function (li) {
      li.classList.toggle("is-oggi", li.getAttribute("data-giorni").split(",").indexOf(String(g)) > -1);
    });
  }
  statoOra();
  setInterval(statoOra, 60000);

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
