/* Mount Hood Filtration — Floating Quick Contact Widget
   Shared across all pages. Injects its own CSS + HTML, no dependencies. */
(function () {
  'use strict';

  /* ── CSS ───────────────────────────────────────────────────────────── */
  var css = [
    /* Trigger pill */
    '#qc-trigger{position:fixed;bottom:1.25rem;right:1.25rem;z-index:49;display:flex;align-items:center;gap:.45rem;padding:.55rem 1rem .55rem .7rem;background:#111113;border:1px solid rgba(255,255,255,.12);border-radius:9999px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:#fff;box-shadow:0 4px 24px rgba(0,0,0,.55);transition:border-color .2s,box-shadow .2s;user-select:none;}',
    '#qc-trigger:hover{border-color:rgba(255,255,255,.28);box-shadow:0 6px 32px rgba(0,0,0,.65);}',
    /* Green pulse dot */
    '.qcd{width:8px;height:8px;border-radius:50%;background:#2ea836;position:relative;flex-shrink:0;}',
    '.qcd::after{content:"";position:absolute;inset:-3px;border-radius:50%;background:#2ea836;opacity:.35;animation:qcp 2s ease-in-out infinite;}',
    '@keyframes qcp{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.65);opacity:0}}',
    /* Panel */
    '#qc-panel{position:fixed;bottom:4.5rem;right:1.25rem;z-index:49;width:340px;max-width:calc(100vw - 2rem);background:#111113;border:1px solid rgba(255,255,255,.1);border-radius:.875rem;box-shadow:0 8px 48px rgba(0,0,0,.72);font-family:inherit;overflow:hidden;display:none;}',
    '#qc-panel.qcopen{display:block;animation:qcsu .18s ease-out;}',
    '@keyframes qcsu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
    /* Header */
    '.qch{display:flex;align-items:flex-start;justify-content:space-between;padding:.875rem 1rem .75rem;border-bottom:1px solid rgba(255,255,255,.07);}',
    '.qcht{display:flex;align-items:center;gap:.45rem;font-size:13px;font-weight:700;color:#fff;}',
    '.qcs{font-size:11px;color:#71717a;margin-top:3px;}',
    '.qcx{background:none;border:none;color:#71717a;font-size:20px;line-height:1;cursor:pointer;padding:0;margin-top:-2px;transition:color .15s;}',
    '.qcx:hover{color:#fff}',
    /* Body */
    '.qcb{padding:.875rem 1rem;display:flex;flex-direction:column;gap:.65rem;}',
    /* Action buttons */
    '.qcag{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;}',
    '.qcab{display:flex;align-items:center;justify-content:center;gap:.35rem;padding:.5rem .6rem;border-radius:.45rem;font-size:12px;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;cursor:pointer;transition:background .15s,border-color .15s;white-space:nowrap;width:100%;box-sizing:border-box;}',
    '.qcab:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.22);}',
    /* Email row */
    '.qcer{display:flex;gap:.35rem;}',
    '.qcea{flex:1;min-width:0;display:flex;align-items:center;gap:.35rem;padding:.5rem .6rem;border-radius:.45rem;font-size:11.5px;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .15s;}',
    '.qcea:hover{background:rgba(255,255,255,.09);}',
    '#qc-copy{flex-shrink:0;padding:.5rem .6rem;border-radius:.45rem;font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#a1a1aa;cursor:pointer;transition:all .15s;white-space:nowrap;}',
    '#qc-copy:hover{background:rgba(255,255,255,.09);color:#fff;}',
    '#qc-copy.qccopied{background:rgba(46,168,54,.14);border-color:rgba(46,168,54,.4);color:#2ea836;}',
    /* Divider */
    '.qcdiv{height:1px;background:rgba(255,255,255,.07);}',
    /* Pills */
    '.qcpl{font-size:10px;font-weight:700;letter-spacing:.1em;color:#52525b;text-transform:uppercase;margin-bottom:.4rem;}',
    '.qcps{display:flex;gap:.35rem;flex-wrap:wrap;}',
    '.qcpi{padding:.32rem .65rem;border-radius:9999px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#d4d4d8;cursor:pointer;transition:all .15s;}',
    '.qcpi:hover,.qcpi.qcpa{background:rgba(46,168,54,.12);border-color:rgba(46,168,54,.4);color:#fff;}',
    /* Inputs */
    '.qcin,.qcta{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:.45rem;padding:.55rem .7rem;font-size:12px;color:#fff;font-family:inherit;outline:none;transition:border-color .15s;resize:none;box-sizing:border-box;}',
    '.qcin::placeholder,.qcta::placeholder{color:#52525b;}',
    '.qcin:focus,.qcta:focus{border-color:rgba(46,168,54,.5);}',
    '.qcfw{display:flex;flex-direction:column;gap:.45rem;}',
    /* Submit */
    '.qcsb{width:100%;padding:.6rem;border-radius:.45rem;background:#2ea836;border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s;letter-spacing:.03em;margin-top:.45rem;}',
    '.qcsb:hover{background:#259930;}',
    '.qcsb:disabled{opacity:.55;cursor:not-allowed;}',
    /* Confirm */
    '#qc-ok{display:none;padding:.7rem;border-radius:.45rem;background:rgba(46,168,54,.1);border:1px solid rgba(46,168,54,.28);font-size:12px;font-weight:600;color:#2ea836;text-align:center;}'
  ].join('');

  /* ── HTML ───────────────────────────────────────────────────────────── */
  var phoneIco = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.63a19.79 19.79 0 01-3.07-8.63A2 2 0 012.18 1h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.46-1.46a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 15.92z"/></svg>';
  var emailIco = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>';
  var headsetIco = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.75"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>';

  var html = [
    '<button id="qc-trigger" onclick="qcToggle()" aria-label="Quick Contact">',
      '<span class="qcd"></span>',
      headsetIco,
      '<span>Need Help?</span>',
    '</button>',

    '<div id="qc-panel" role="dialog" aria-modal="true" aria-label="Quick Contact">',
      '<div class="qch">',
        '<div>',
          '<div class="qcht"><span class="qcd"></span>Talk to Our Team</div>',
          '<div class="qcs">Always here to help, 24/7.</div>',
        '</div>',
        '<button class="qcx" onclick="qcToggle()" aria-label="Close">&times;</button>',
      '</div>',

      '<div class="qcb">',

        '<div class="qcag">',
          '<a class="qcab" href="tel:+15412750340">' + phoneIco + '(541)\u00a0275-0340</a>',
          '<div class="qcer">',
            '<a class="qcea" href="mailto:info@mounthoodfiltration.com">' + emailIco + 'Email Us</a>',
            '<button id="qc-copy" onclick="qcCopyEmail()">Copy</button>',
          '</div>',
        '</div>',

        '<div class="qcdiv"></div>',

        '<div>',
          '<div class="qcpl">What do you need?</div>',
          '<div class="qcps">',
            '<button class="qcpi" onclick="qcPill(this,\'match\')">Match a Part #</button>',
            '<button class="qcpi" onclick="qcPill(this,\'crew\')">Field Crew / Outage</button>',
            '<button class="qcpi" onclick="qcPill(this,\'question\')">Quick Question</button>',
          '</div>',
        '</div>',

        '<div class="qcdiv"></div>',

        '<div id="qc-form">',
          '<div class="qcfw">',
            '<input id="qc-contact" class="qcin" type="text" placeholder="Your phone or email" required />',
            '<textarea id="qc-msg" class="qcta" rows="2" placeholder="Ask us anything\u2014bags, cages, cartridges, valves, or lead times\u2026" required></textarea>',
          '</div>',
          '<button class="qcsb" onclick="qcSend()">Send Quick Message &rarr;</button>',
        '</div>',
        '<div id="qc-ok">Got it\u2014our team will call or email you right back.</div>',

      '</div>',
    '</div>'
  ].join('');

  /* ── Mount ──────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  window.qcToggle = function () {
    var p = document.getElementById('qc-panel');
    p.classList.toggle('qcopen');
  };

  window.qcCopyEmail = function () {
    navigator.clipboard.writeText('info@mounthoodfiltration.com').then(function () {
      var btn = document.getElementById('qc-copy');
      btn.textContent = 'Copied \u2713';
      btn.classList.add('qccopied');
      setTimeout(function () {
        btn.textContent = 'Copy';
        btn.classList.remove('qccopied');
      }, 2200);
    });
  };

  window.qcPill = function (el, topic) {
    document.querySelectorAll('.qcpi').forEach(function (p) { p.classList.remove('qcpa'); });
    el.classList.add('qcpa');
    var msg = document.getElementById('qc-msg');
    if (topic === 'match') {
      msg.value = 'Hi, I need help cross-referencing/matching a filter part number: ';
    } else if (topic === 'crew') {
      msg.value = 'Hi, we need field service / outage support at our plant: ';
    } else {
      msg.value = '';
      msg.placeholder = 'Ask us anything\u2014bags, cages, cartridges, valves, or lead times\u2026';
    }
    msg.focus();
  };

  window.qcSend = async function () {
    var contact = document.getElementById('qc-contact').value.trim();
    var message = document.getElementById('qc-msg').value.trim();
    if (!contact || !message) {
      document.getElementById('qc-contact').focus();
      return;
    }
    var btn = document.querySelector('.qcsb');
    btn.disabled = true;
    btn.textContent = 'Sending\u2026';
    try {
      await fetch('https://formsubmit.co/ajax/43a25cb8b3fde5915648ce87075176cf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Quick Contact Bubble Inquiry - Mount Hood Filtration',
          _captcha: 'false',
          _template: 'table',
          Contact: contact,
          Message: message,
          Source: 'Quick Contact Widget \u2014 ' + window.location.pathname
        })
      });
    } catch (_) {}
    document.getElementById('qc-form').style.display = 'none';
    document.getElementById('qc-ok').style.display = 'block';
  };

  /* Close on outside click */
  document.addEventListener('click', function (e) {
    var p = document.getElementById('qc-panel');
    var t = document.getElementById('qc-trigger');
    if (p && t && p.classList.contains('qcopen') &&
        !p.contains(e.target) && !t.contains(e.target)) {
      p.classList.remove('qcopen');
    }
  });
})();
