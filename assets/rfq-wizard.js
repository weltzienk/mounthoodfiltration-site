/* Mount Hood Filtration — Shared 3-Step RFQ Wizard (Quote Drawer)
   ---------------------------------------------------------------------------
   One source of truth for the slide-out RFQ wizard on every page.

   Usage on any page (before </body>):
     <script src="assets/rfq-wizard.js"></script>
   The page's tailwind.config must define the colours pureBlack, surface,
   surfaceHover, line and muted (see index.html).

   Open the drawer from markup with data attributes (no inline JS needed):
     <a href="mailto:..." data-rfq-mode="cages">Request a Quote</a>
     <a href="mailto:..." data-rfq-mode="services"
        data-rfq-service-type="Emergency Shutdown Support">Request Dispatch</a>

   Supported attributes (all optional except data-rfq-mode):
     data-rfq-mode          bags | cages | cartridges | valves | services
     data-rfq-oem           Collector OEM name
     data-rfq-bag-style     e.g. "Pulse-Jet Bag"
     data-rfq-media         e.g. "PTFE / Teflon® 500°F"
     data-rfq-cage-style    e.g. "Spun Venturis"
     data-rfq-end-cap       e.g. "Open / Open"
     data-rfq-valve-brand   e.g. "Goyen® (Original / Replacement)"
     data-rfq-part-num      valve / kit part number
     data-rfq-service-type  e.g. "Fluorescent UV Dust Leak Detection"
     data-rfq-note          pre-filled note text

   Or from script: openQuoteDrawer({ mode: 'valves', valveBrand: '...', partNum: '...' })
   The href is kept as a no-JS fallback; with JS it is intercepted.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  if (window.MHF_RFQ) return; // already loaded on this page

  let activeDrawerMode = 'bags';
  let currentWizardStep = 1;
  let lastPresetNote = ''; // note text auto-filled by the previous open

  // COMPLETE A-Z BAGHOUSE & COLLECTOR OEM DIRECTORY (75+ BRANDS)
  const collectorOemGridList = [
    'AAF International', 'Aerodyne', 'Aeropulse', 'Air-Cure', 'AirPol',
    'Airguard', 'Airlan', 'Airvent', 'Alanco', 'Albany International',
    'Alstom', 'Amerex', 'American Air Filter', 'American Precision', 'Astec',
    'BACT', 'Babcock & Wilcox', 'Barber-Green', 'Belco', 'Besser',
    'BHA', 'Blaw-Knox', 'Buhler-Miag', 'Camfil Farr', 'Carborundum',
    'Carothers & Son', 'Carter-Day', 'Cedar Rapids', 'Cemco', 'Chem-Pro',
    'CMI', 'Continental', 'DCE Vokes', 'Donaldson Torit', 'Ducon',
    'Dustex', 'Dynavac', 'Environmental Elements', 'Farr', 'Flex-Kleen',
    'FLSmidth', 'Fuller', 'Gencor', 'General Electric', 'Griffin',
    'Goyen', 'Hauck', 'Interel', 'Johnson-March', 'Kice',
    'Kirk & Blum', 'Lodge-Cottrell', 'MAC Equipment', 'McCarter', 'Menardi',
    'Midwesco', 'MikroPul', 'Murphy-Rodgers', 'Norblo', 'Nordson',
    'Pangborn', 'Peabody', 'Pneumafil', 'PrecipTech', 'Research-Cottrell',
    'Rees-Memphis', 'RoboVent', 'Scientific Dust Collectors', 'Sly', 'Standard Havens',
    'Steelcraft', 'Sternvent', 'Torit', 'United McGill', 'U.S. Filter',
    'Western Precipitation', 'Wheelabrator', 'Young Industries', 'Zurn', 'Other / Custom'
  ];

  const cartridgeOems = [
    'Donaldson Torit', 'Farr Gold Series', 'Camfil', 'RoboVent', 'Wheelabrator',
    'Nordson', 'AAF International', 'UAS (United Air Specialists)', 'Micro Air', 'Imperial Systems',
    'Scientific Dust Collectors', 'Sternvent', 'Pneumafil', 'MAC Equipment'
  ];

  /* ── Drawer markup (injected once per page) ───────────────────────────── */
  const DRAWER_HTML = `
  <div id="drawerBackdrop" onclick="closeQuoteDrawer()" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-xs"></div>

  <aside id="quoteDrawer" class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md translate-x-full flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-250 ease-out" aria-label="3-Step Quote Wizard">
    <!-- Compact Wizard Header -->
    <div class="flex items-center justify-between border-b border-line px-4 py-3.5">
      <div>
        <span id="wizardStepCounter" class="font-mono text-[10px] font-semibold tracking-widest text-muted uppercase">Step 1 of 3 // Style &amp; Collector</span>
        <h2 id="wizardStepTitle" class="text-sm font-bold text-white">Select Style &amp; Collector</h2>
      </div>
      <button onclick="closeQuoteDrawer()" class="rounded-md border border-line p-1.5 text-muted hover:text-white" aria-label="Close Quote Wizard">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Wizard Progress Header -->
    <div class="border-b border-line bg-pureBlack px-4 pt-2">
      <!-- Clean 3-Step Visual Progress Bar -->
      <div class="grid grid-cols-3 gap-2 py-3">
        <button type="button" onclick="goToWizardStep(1)" class="text-left focus:outline-none">
          <div id="progBar-1" class="h-1.5 w-full rounded-full bg-white transition-all"></div>
          <span id="progLabel-1" class="mt-1.5 block font-mono text-[10px] font-bold text-white">01. Spec &amp; Size</span>
        </button>
        <button type="button" onclick="goToWizardStep(2)" class="text-left focus:outline-none">
          <div id="progBar-2" class="h-1.5 w-full rounded-full bg-line transition-all"></div>
          <span id="progLabel-2" class="mt-1.5 block font-mono text-[10px] font-medium text-muted">02. Media / Ends</span>
        </button>
        <button type="button" onclick="goToWizardStep(3)" class="text-left focus:outline-none">
          <div id="progBar-3" class="h-1.5 w-full rounded-full bg-line transition-all"></div>
          <span id="progLabel-3" class="mt-1.5 block font-mono text-[10px] font-medium text-muted">03. Send RFQ</span>
        </button>
      </div>
    </div>

    <!-- Single-Step Body -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form id="quoteForm" onsubmit="submitCompactQuote(event)">

        <!-- =============================================================== -->
        <!-- STEP 1: STYLE, COLLECTOR OEM & DIMENSIONS                       -->
        <!-- =============================================================== -->
        <div id="wizardPanel-1" class="wizard-panel space-y-3.5">
          <!-- Custom Collapsible Dropdown: Product / Service Division -->
          <div class="relative">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Product / Service Division</span>
            <button type="button" onclick="toggleCustomDropdown('dd-division')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="ddLabel-division">Filter Bags</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-division" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
              <button type="button" onclick="setDrawerMode('bags'); closeAllCustomDropdowns()" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Filter Bags</button>
              <button type="button" onclick="setDrawerMode('cages'); closeAllCustomDropdowns()" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Cages &amp; Venturis</button>
              <button type="button" onclick="setDrawerMode('cartridges'); closeAllCustomDropdowns()" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Cartridges</button>
              <button type="button" onclick="setDrawerMode('valves'); closeAllCustomDropdowns()" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Valves, Kits &amp; Controller Boards</button>
              <button type="button" onclick="setDrawerMode('services'); closeAllCustomDropdowns()" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Field Services</button>
            </div>
          </div>

          <!-- Custom Collapsible Dropdown: Bag Construction Style -->
          <div id="modeFields-bags" class="mode-group relative">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Bag Construction Style</span>
            <input type="hidden" id="qBagStyle" value="Pulse-Jet Bag" />
            <button type="button" onclick="toggleCustomDropdown('dd-bagStyle')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="ddLabel-bagStyle">Pulse-Jet Bag</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-bagStyle" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Pulse-Jet Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Pulse-Jet Bag</button>
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Two-Pocket Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Two-Pocket Bag</button>
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Tri-Pocket Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Tri-Pocket Bag</button>
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Welded-Seam Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Welded-Seam Bag</button>
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Shaker Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Shaker Bag</button>
              <button type="button" onclick="pickCustomOption('qBagStyle', 'ddLabel-bagStyle', 'Reverse-Air Bag')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Reverse-Air Bag</button>
            </div>
          </div>

          <!-- Custom Collapsible Dropdown: Cage Style -->
          <div id="modeFields-cages" class="mode-group relative hidden">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Cage / Venturi Style</span>
            <input type="hidden" id="qCageStyle" value="One-Piece Pulse-Jet Cage" />
            <button type="button" onclick="toggleCustomDropdown('dd-cageStyle')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="ddLabel-cageStyle">One-Piece Pulse-Jet Cage</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-cageStyle" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
              <button type="button" onclick="pickCustomOption('qCageStyle', 'ddLabel-cageStyle', 'One-Piece Pulse-Jet Cage')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">One-Piece Pulse-Jet Cage</button>
              <button type="button" onclick="pickCustomOption('qCageStyle', 'ddLabel-cageStyle', 'Two-Piece Twist-Lock Cage')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Two-Piece Twist-Lock Cage</button>
              <button type="button" onclick="pickCustomOption('qCageStyle', 'ddLabel-cageStyle', '3-Piece Multi-Pocket Retainer Cage')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">3-Piece Multi-Pocket Retainer Cage</button>
              <button type="button" onclick="pickCustomOption('qCageStyle', 'ddLabel-cageStyle', 'Spun Venturis')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">6&quot; Spun Venturis</button>
            </div>
          </div>

          <!-- Custom Collapsible Dropdown: Cartridge Endcap -->
          <div id="modeFields-cartridges" class="mode-group relative hidden">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Cartridge Endcap Style</span>
            <input type="hidden" id="qCartCap" value="Open / Closed w/ Bolt Hole" />
            <button type="button" onclick="toggleCustomDropdown('dd-cartCap')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="ddLabel-cartCap">Open / Closed w/ Bolt Hole</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-cartCap" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
              <button type="button" onclick="pickCustomOption('qCartCap', 'ddLabel-cartCap', 'Open / Closed w/ Bolt Hole')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Open / Closed w/ Bolt Hole</button>
              <button type="button" onclick="pickCustomOption('qCartCap', 'ddLabel-cartCap', 'Open / Open')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Open / Open</button>
              <button type="button" onclick="pickCustomOption('qCartCap', 'ddLabel-cartCap', '3-Lug / 4-Lug Twist-Lock')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">3-Lug / 4-Lug Twist-Lock</button>
              <button type="button" onclick="pickCustomOption('qCartCap', 'ddLabel-cartCap', 'Oval Cartridge (BCSOVSB / BCSOVNF)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Oval Cartridge (BCSOVSB / BCSOVNF)</button>
            </div>
          </div>

          <!-- Custom Collapsible Dropdown: Field Service Scope -->
          <div id="modeFields-services" class="mode-group relative hidden">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Field Service Scope</span>
            <input type="hidden" id="qServiceScope" value="Turnkey Baghouse Change-Out" />
            <button type="button" onclick="toggleCustomDropdown('dd-serviceScope')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="ddLabel-serviceScope">Turnkey Baghouse Change-Out</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-serviceScope" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
              <button type="button" onclick="pickCustomOption('qServiceScope', 'ddLabel-serviceScope', 'Turnkey Baghouse Change-Out')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Turnkey Baghouse Change-Out</button>
              <button type="button" onclick="pickCustomOption('qServiceScope', 'ddLabel-serviceScope', 'Fluorescent UV Dust Leak Detection')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Fluorescent UV Dust Leak Detection</button>
              <button type="button" onclick="pickCustomOption('qServiceScope', 'ddLabel-serviceScope', 'Ultrasonic Cleaning & Tubesheet Inspection')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Ultrasonic Cleaning &amp; Tubesheet Inspection</button>
              <button type="button" onclick="pickCustomOption('qServiceScope', 'ddLabel-serviceScope', 'Emergency Shutdown Support')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Emergency Shutdown Support</button>
            </div>
          </div>

          <!-- Valves, Kits & Controller Boards Step 1 Controls -->
          <div id="modeFields-valves" class="mode-group hidden space-y-3.5">
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Valve / Control Brand</span>
              <input type="hidden" id="qValveBrand" value="Goyen® (Original / Replacement)" />
              <button type="button" onclick="toggleCustomDropdown('dd-valveBrand')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-valveBrand">Goyen&reg; (Original / Replacement)</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-valveBrand" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Goyen® (Original / Replacement)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Goyen&reg; (Original / Replacement)</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'ASCO® Replacements')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">ASCO&reg; Replacements</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Mecair® (Original / Replacement)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Mecair&reg; (Original / Replacement)</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Taeha™ Replacements')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Taeha&trade; Replacements</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Turbo™ Replacements')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Turbo&trade; Replacements</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Autel™ / Timer & Controller Boards')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Autel&trade; / Timer &amp; Controller Boards</button>
                <button type="button" onclick="pickCustomOption('qValveBrand', 'ddLabel-valveBrand', 'Other / Cross-Reference Brand')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Other / Cross-Reference Brand</button>
              </div>
            </div>

            <div class="rounded-lg border border-line bg-pureBlack p-3">
              <label for="qValvePartNum" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-white uppercase">Part Number or Port Size *</label>
              <input
                id="qValvePartNum"
                type="text"
                oninput="updateWizardSummaryBadges()"
                placeholder="e.g. Goyen RCA25T, ASCO 8353, or 1-1/2&quot; NPT"
                class="w-full rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"
              />
              <span class="mt-1.5 block font-mono text-[10px] text-muted">Enter pulse valve, diaphragm repair kit, solenoid, or timer board SKU(s).</span>
            </div>
          </div>

          <!-- Collector OEM Click-to-Open Dropdown -->
          <div id="wizStep1OemBlock" class="relative">
            <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Collector OEM Brand (75+ Brands)</span>
            <button type="button" onclick="toggleCustomDropdown('dd-oemMenu')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
              <span id="qOemBadge">Donaldson Torit</span>
              <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div id="dd-oemMenu" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-2 shadow-2xl">
              <input
                id="qOemInput"
                type="text"
                value="Donaldson Torit"
                oninput="renderDrawerOemChips(this.value)"
                placeholder="Type to filter all 75+ OEMs..."
                class="mb-1.5 w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"
              />
              <div id="drawerOemChips" class="max-h-44 space-y-0.5 overflow-y-auto"></div>
            </div>
          </div>

          <!-- Dimensions Inputs (Always Visible Underneath Collector OEM) -->
          <div id="wizStep1DimensionsBlock" class="space-y-2 rounded-lg border border-line bg-pureBlack p-3">
            <span class="block font-mono text-[10px] font-semibold tracking-wider text-white uppercase">Dimensions (Diameter &times; Length)</span>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="qDiameter" class="mb-1 block font-mono text-[10px] text-muted uppercase">Diameter / Flat *</label>
                <input id="qDiameter" type="text" oninput="updateWizardSummaryBadges()" placeholder='e.g. 6.00" or 14" Flat' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
              </div>
              <div>
                <label for="qLength" class="mb-1 block font-mono text-[10px] text-muted uppercase">Overall Length *</label>
                <input id="qLength" type="text" oninput="updateWizardSummaryBadges()" placeholder='e.g. 120" or 86"' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
              </div>
            </div>

            <!-- Quick-Fill Common Sizes -->
            <div class="pt-1">
              <span class="mb-1.5 block font-mono text-[10px] text-muted uppercase tracking-wider">Common Sizes:</span>
              <div class="flex flex-wrap gap-1.5">
                <button type="button" onclick="fillCommonSize('4.50&quot;','96&quot;')" class="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-white transition hover:border-white hover:bg-surfaceHover">4.50&quot; &times; 96&quot;</button>
                <button type="button" onclick="fillCommonSize('5.75&quot;','120&quot;')" class="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-white transition hover:border-white hover:bg-surfaceHover">5.75&quot; &times; 120&quot;</button>
                <button type="button" onclick="fillCommonSize('6.00&quot;','144&quot;')" class="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-white transition hover:border-white hover:bg-surfaceHover">6.00&quot; &times; 144&quot;</button>
                <button type="button" onclick="fillCommonSize('6.25&quot;','168&quot;')" class="rounded border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-white transition hover:border-white hover:bg-surfaceHover">6.25&quot; &times; 168&quot;</button>
              </div>
            </div>
          </div>

          <!-- OEM / Universal Part Number Block (Cartridges only) -->
          <div id="wizStep1CartridgePartBlock" class="hidden rounded-xl border border-white/10 bg-[#111113] p-4 space-y-3">
            <span class="block font-mono text-[10px] font-semibold tracking-wider text-white uppercase">OEM OR CROSS-REFERENCE PART NUMBER *</span>
            <input
              id="cartridgePartNumber"
              type="text"
              oninput="updateWizardSummaryBadges()"
              placeholder="e.g. P191115, 211303-002, C16400..."
              class="w-full rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"
            />
            <p class="font-mono text-[10px] leading-relaxed text-muted">Universal part numbers cross-reference directly to exact OD, length, pleat count, and endcap specs&mdash;no manual measurements required.</p>
            <details>
              <summary class="cursor-pointer font-mono text-[10px] font-semibold text-muted hover:text-white list-none select-none">
                &#9654; Don&rsquo;t have a part number? Enter optional OD &times; Length
              </summary>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label for="qCartOptOD" class="mb-1 block font-mono text-[10px] text-muted uppercase">OD (Optional)</label>
                  <input id="qCartOptOD" type="text" oninput="updateWizardSummaryBadges()" placeholder='e.g. 12.75"' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
                </div>
                <div>
                  <label for="qCartOptLen" class="mb-1 block font-mono text-[10px] text-muted uppercase">Length (Optional)</label>
                  <input id="qCartOptLen" type="text" oninput="updateWizardSummaryBadges()" placeholder='e.g. 26"' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
                </div>
              </div>
            </details>
          </div>

          <!-- Unknown Dimensions Toggle (hidden for Cartridges, Services, Valves) -->
          <label id="wizStep1UnknownDimsLabel" class="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-pureBlack px-3 py-2.5 transition hover:border-white/40">
            <input type="checkbox" id="qUnknownDims" onchange="toggleUnknownDims(this.checked)" class="mt-0.5 h-3.5 w-3.5 shrink-0 accent-white" />
            <span class="font-mono text-[11px] leading-relaxed text-muted">I don&rsquo;t have exact dimensions &mdash; cross-reference by OEM model or physical sample</span>
          </label>
        </div>

        <!-- =============================================================== -->
        <!-- STEP 2: FILTER MEDIA + TOP / BOTTOM CONSTRUCTION                -->
        <!-- =============================================================== -->
        <div id="wizardPanel-2" class="wizard-panel hidden space-y-3.5">
          <!-- Live Summary Badge of Step 1 -->
          <div class="flex items-center justify-between rounded-lg border border-white/30 bg-pureBlack px-3 py-2">
            <div class="min-w-0 pr-2">
              <span class="block font-mono text-[9px] tracking-widest text-muted uppercase">Step 1 Spec Locked</span>
              <p id="step1SummaryBadge" class="truncate font-mono text-xs font-semibold text-white">Pulse-Jet Bag &bull; Donaldson Torit</p>
            </div>
            <button type="button" onclick="goToWizardStep(1)" class="shrink-0 font-mono text-[10px] font-semibold text-white hover:underline">Edit</button>
          </div>

          <!-- Bags Step 2 Dropdown (Filter Media) -->
          <div id="step2BagControls" class="space-y-3.5">
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Filter Media / Material</span>
              <input type="hidden" id="qBagMedia" value="Polyester Felt 275°F" oninput="updateWizardSummaryBadges()" />
              <button type="button" onclick="toggleCustomDropdown('dd-bagMedia')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-bagMedia">Polyester Felt 275&deg;F</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-bagMedia" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden max-h-64 overflow-y-auto rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Polyester Felt 275°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Polyester Felt 275&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Polypropylene 190°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Polypropylene 190&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Acrylic 260°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Acrylic 260&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Nomex® / Aramid 400°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Nomex&reg; / Aramid 400&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'P84® Polyimide 500°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">P84&reg; Polyimide 500&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'PPS / Ryton® 375°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">PPS / Ryton&reg; 375&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'PTFE / Teflon® 500°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">PTFE / Teflon&reg; 500&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Woven Fiberglass 500°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Woven Fiberglass 500&deg;F</button>
                <div class="my-1 border-t border-line"></div>
                <p class="px-2.5 py-1 font-mono text-[10px] text-muted uppercase tracking-wider">&mdash; w/ ePTFE Membrane &mdash;</p>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Polyester Felt w/ ePTFE Membrane 275°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Polyester Felt w/ ePTFE Membrane 275&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'Nomex® / Aramid w/ ePTFE Membrane 400°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Nomex&reg; / Aramid w/ ePTFE Membrane 400&deg;F</button>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'PPS / Ryton® w/ ePTFE Membrane 375°F')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">PPS / Ryton&reg; w/ ePTFE Membrane 375&deg;F</button>
                <div class="my-1 border-t border-line"></div>
                <button type="button" onclick="pickCustomOption('qBagMedia', 'ddLabel-bagMedia', 'No Clue — Help Me Pick for My Dust &amp; Temp')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">No Clue — Help Me Pick for My Dust &amp; Temp</button>
              </div>
            </div>

            <!-- Fabric Weight / Membrane Finish Selector -->
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Fabric Weight / Membrane Finish</span>
              <input type="hidden" id="qFabricWeight" value="14 oz/sq. yd. (Standard Felt)" />
              <button type="button" onclick="toggleCustomDropdown('dd-fabricWeight')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-fabricWeight">14 oz/sq. yd. (Standard Felt)</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-fabricWeight" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qFabricWeight', 'ddLabel-fabricWeight', '14 oz/sq. yd. (Standard Felt)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">14 oz/sq. yd. (Standard Felt)</button>
                <button type="button" onclick="pickCustomOption('qFabricWeight', 'ddLabel-fabricWeight', '16 oz/sq. yd. (Heavy-Duty Felt)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">16 oz/sq. yd. (Heavy-Duty Felt)</button>
                <button type="button" onclick="pickCustomOption('qFabricWeight', 'ddLabel-fabricWeight', '14 oz + ePTFE Membrane Laminate')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">14 oz + ePTFE Membrane Laminate</button>
                <button type="button" onclick="pickCustomOption('qFabricWeight', 'ddLabel-fabricWeight', '16 oz + ePTFE Membrane Laminate')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">16 oz + ePTFE Membrane Laminate</button>
                <button type="button" onclick="pickCustomOption('qFabricWeight', 'ddLabel-fabricWeight', 'Not Sure / Match OEM Spec')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Not Sure / Match OEM Spec</button>
              </div>
            </div>
          </div>

          <!-- Top & Bottom Construction Dropdowns (For Bags) -->
          <div id="wizStep2EndConstBlock" class="space-y-3 rounded-lg border border-line bg-pureBlack p-3">
            <span class="block font-mono text-[10px] font-semibold tracking-wider text-white uppercase">Top &amp; Bottom Construction</span>
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] text-muted uppercase">Top Construction</span>
              <input type="hidden" id="qTopConst" value="Stainless Snap-Band" />
              <button type="button" onclick="toggleCustomDropdown('dd-topConst')" class="flex w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-topConst">Stainless Snap-Band</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-topConst" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qTopConst', 'ddLabel-topConst', 'Stainless Snap-Band')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Stainless Snap-Band</button>
                <button type="button" onclick="pickCustomOption('qTopConst', 'ddLabel-topConst', 'Rolled Flange Top')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Rolled Flange Top</button>
                <button type="button" onclick="pickCustomOption('qTopConst', 'ddLabel-topConst', 'Steel Ring Top')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Steel Ring Top</button>
                <button type="button" onclick="pickCustomOption('qTopConst', 'ddLabel-topConst', 'Raw Edge / Corded Cuff')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Raw Edge / Corded Cuff</button>
                <button type="button" onclick="pickCustomOption('qTopConst', 'ddLabel-topConst', 'Loop / Strap / Grommet')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Loop / Strap / Grommet</button>
              </div>
            </div>

            <!-- Conditional: Cell Plate specs (Stainless Snap-Band only) -->
            <div id="cellPlatePanel" style="overflow:hidden; max-height:12rem; opacity:1; transition:max-height .25s ease, opacity .2s ease, margin .25s ease;">
              <div class="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface/40 p-2.5">
                <label class="block">
                  <span class="mb-1 block font-mono text-[10px] text-muted uppercase">Cell Plate Diameter</span>
                  <input id="qCellPlateDia" type="text" inputmode="decimal" oninput="updateWizardSummaryBadges()" placeholder='e.g., 6.125" or mm' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
                </label>
                <label class="block">
                  <span class="mb-1 block font-mono text-[10px] text-muted uppercase">Cell Plate Thickness</span>
                  <input id="qCellPlateThk" type="text" inputmode="decimal" oninput="updateWizardSummaryBadges()" placeholder='e.g., 0.1875" / 10 ga' class="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none" />
                </label>
              </div>
            </div>

            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] text-muted uppercase">Bottom Construction</span>
              <input type="hidden" id="qBottomConst" value="Standard Sewn Disc Bottom" />
              <button type="button" onclick="toggleCustomDropdown('dd-botConst')" class="flex w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-botConst">Standard Sewn Disc Bottom</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-botConst" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qBottomConst', 'ddLabel-botConst', 'Standard Sewn Disc Bottom')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Standard Sewn Disc Bottom</button>
                <button type="button" onclick="pickCustomOption('qBottomConst', 'ddLabel-botConst', 'Folded / Flat-Sewn Bottom')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Folded / Flat-Sewn Bottom</button>
                <button type="button" onclick="pickCustomOption('qBottomConst', 'ddLabel-botConst', 'Open / Beaded / Raw Edge')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Open / Beaded / Raw Edge</button>
              </div>
            </div>

            <div>
              <span id="wearCuffLabel" class="mb-1 block font-mono text-[10px] text-muted uppercase">Wear Cuff Needed?</span>
              <input type="hidden" id="qWearCuff" value="No" />
              <div class="flex gap-2" role="radiogroup" aria-labelledby="wearCuffLabel">
                <button type="button" id="wearCuffBtn-Yes" role="radio" aria-checked="false" onclick="setWearCuff('Yes')" class="flex-1 rounded-md border px-3 py-2 font-mono text-xs transition border-line bg-surface text-muted hover:border-white hover:text-white">Yes</button>
                <button type="button" id="wearCuffBtn-No" role="radio" aria-checked="true" onclick="setWearCuff('No')" class="flex-1 rounded-md border px-3 py-2 font-mono text-xs transition border-white bg-white font-bold text-black">No</button>
              </div>
            </div>
          </div>

          <!-- Cages Step 2: 3 Core Hardware Selects -->
          <div id="step2CageControls" class="hidden space-y-3.5">

            <!-- 1: Material / Finish -->
            <div>
              <label for="qCageMaterial" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Material / Finish</label>
              <select id="qCageMaterial" onchange="updateWizardSummaryBadges()" class="w-full rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white focus:border-white focus:outline-none">
                <option>Galvanized Steel (Standard)</option>
                <option>Carbon / Basic Steel</option>
                <option>304 Stainless Steel</option>
                <option>316 Stainless Steel</option>
                <option>No Clue — Match My Application</option>
              </select>
            </div>

            <!-- 2: Construction & Top/Bottom Style -->
            <div>
              <label for="qCageConstruction" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Construction &amp; Top / Bottom Style</label>
              <select id="qCageConstruction" onchange="updateWizardSummaryBadges()" class="w-full rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white focus:border-white focus:outline-none">
                <option>1-Piece — Turned Flange Top / Welded Cup</option>
                <option>2-Piece Split — Twist-Lok</option>
                <option>3-Piece Split — Asphalt / Multi-Pocket</option>
                <option>Split Collar Top</option>
                <option>Other / Custom (Specify in Notes)</option>
              </select>
            </div>

            <!-- 3: Wire Count & Venturi -->
            <div>
              <label for="qCageWireVenturi" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Wire Count &amp; Venturi</label>
              <select id="qCageWireVenturi" onchange="updateWizardSummaryBadges()" class="w-full rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white focus:border-white focus:outline-none">
                <option>10 Vertical Wires (No Venturi)</option>
                <option>12 Vertical Wires (No Venturi)</option>
                <option>20 Vertical Wires (No Venturi)</option>
                <option>10 Vertical Wires + Spun Venturi</option>
                <option>12 Vertical Wires + Spun Venturi</option>
                <option>20 Vertical Wires + Spun Venturi</option>
              </select>
            </div>

          </div>

          <!-- Cartridges Step 2 Dropdown -->
          <div id="step2CartridgeControls" class="hidden space-y-3.5">
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Cartridge Filter Media</span>
              <input type="hidden" id="qCartMedia" value="Nanofiber Flame-Retardant (MERV 15)" />
              <button type="button" onclick="toggleCustomDropdown('dd-cartMedia')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-cartMedia">Nanofiber Flame-Retardant (MERV 15)</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-cartMedia" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qCartMedia', 'ddLabel-cartMedia', 'Nanofiber Flame-Retardant (MERV 15)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Nanofiber Flame-Retardant (MERV 15)</button>
                <button type="button" onclick="pickCustomOption('qCartMedia', 'ddLabel-cartMedia', '80/20 Cellulose-Polyester Blend')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">80/20 Cellulose-Polyester Blend</button>
                <button type="button" onclick="pickCustomOption('qCartMedia', 'ddLabel-cartMedia', 'Spunbond Polyester (Washable)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Spunbond Polyester (Washable)</button>
                <button type="button" onclick="pickCustomOption('qCartMedia', 'ddLabel-cartMedia', 'PTFE Membrane Spunbond')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">PTFE Membrane Spunbond</button>
                <div class="my-1 border-t border-line"></div>
                <button type="button" onclick="pickCustomOption('qCartMedia', 'ddLabel-cartMedia', 'No Clue — I Just Catch Dust (Match My Part # / Application)')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">No Clue — I Just Catch Dust (Match My Part # / Application)</button>
              </div>
            </div>
          </div>

          <!-- Field Services Step 2 Dropdown -->
          <div id="step2ServiceControls" class="hidden space-y-3.5">
            <div class="relative">
              <span class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Outage Window &amp; Add-On Hardware</span>
              <input type="hidden" id="qServiceWindow" value="Planned Shutdown Outage" />
              <button type="button" onclick="toggleCustomDropdown('dd-serviceWindow')" class="flex w-full items-center justify-between rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white transition hover:border-white">
                <span id="ddLabel-serviceWindow">Planned Shutdown Outage</span>
                <svg class="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div id="dd-serviceWindow" class="custom-dd-menu absolute inset-x-0 z-30 mt-1 hidden rounded-md border border-line bg-pureBlack p-1 shadow-2xl">
                <button type="button" onclick="pickCustomOption('qServiceWindow', 'ddLabel-serviceWindow', 'Planned Shutdown Outage')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Planned Shutdown Outage</button>
                <button type="button" onclick="pickCustomOption('qServiceWindow', 'ddLabel-serviceWindow', 'Weekend / Off-Shift Crew')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Weekend / Off-Shift Crew</button>
                <button type="button" onclick="pickCustomOption('qServiceWindow', 'ddLabel-serviceWindow', 'Emergency Rapid Mobilization')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Emergency Rapid Mobilization</button>
                <button type="button" onclick="pickCustomOption('qServiceWindow', 'ddLabel-serviceWindow', 'Include UV Tracer Powder & Pre-Coat')" class="block w-full rounded px-2.5 py-1.5 text-left font-mono text-xs text-white hover:bg-surface">Include UV Tracer Powder &amp; Pre-Coat</button>
              </div>
            </div>
          </div>

          <!-- Valves, Kits & Controller Boards Step 2 Controls -->
          <div id="step2ValveControls" class="hidden space-y-3.5">

            <!-- 1: Connection & Size -->
            <div>
              <label for="qValveConn" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Connection &amp; Size</label>
              <select id="qValveConn" onchange="updateWizardSummaryBadges()" class="w-full rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white focus:border-white focus:outline-none">
                <option>3/4&quot; NPT / Dresser</option>
                <option>1&quot; NPT / Dresser</option>
                <option>1-1/2&quot; NPT / Dresser</option>
                <option>2&quot; &ndash; 3&quot; NPT / Flange</option>
                <option>Repair Kit / Timer Only</option>
              </select>
            </div>

            <!-- 2: Elastomer & Voltage -->
            <div>
              <label for="qValveElast" class="mb-1 block font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">Elastomer &amp; Voltage</label>
              <select id="qValveElast" onchange="updateWizardSummaryBadges()" class="w-full rounded-md border border-line bg-pureBlack px-3 py-2 font-mono text-xs text-white focus:border-white focus:outline-none">
                <option>Standard TPE / Buna-N &mdash; 110V/120V AC</option>
                <option>Standard TPE / Buna-N &mdash; 24V DC</option>
                <option>High-Temp Viton &mdash; 110V/120V AC</option>
                <option>High-Temp Viton &mdash; 24V DC</option>
                <option>No Clue &mdash; Just Match My Valve Model</option>
              </select>
            </div>

          </div>
        </div>

        <!-- =============================================================== -->
        <!-- STEP 3: QUANTITY & CONTACT                                       -->
        <!-- =============================================================== -->
        <div id="wizardPanel-3" class="wizard-panel hidden space-y-3.5">

          <!-- Configuration Summary Card -->
          <div class="rounded-xl border border-white/10 bg-[#111113] p-4">
            <span class="mb-2 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Your Configuration</span>
            <p id="step3ConfigLine" class="font-mono text-xs font-semibold text-white leading-snug"></p>
            <p id="step3ConfigSub" class="mt-1 font-mono text-[10px] text-muted leading-snug"></p>
            <button type="button" onclick="goToWizardStep(1)" class="mt-2 font-mono text-[10px] font-semibold text-muted transition hover:text-white">Edit Specs ↩</button>
          </div>

          <!-- Step 3 form fields -->
          <div id="step3FormBody" class="space-y-3">

            <!-- Qty + Ship Date -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Estimated Qty *</label>
                <input id="qQty" name="Estimated Quantity" type="number" min="1" required placeholder="100" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Target Ship Date</label>
                <input id="qShipDate" name="Target Ship Date" type="text" placeholder="e.g. Dec 2026" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
            </div>

            <!-- Name + Company -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Full Name *</label>
                <input id="qName" name="Full Name" type="text" required placeholder="Jane Smith" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Company *</label>
                <input id="qCompany" name="Company / Plant Name" type="text" required placeholder="Acme Plant LLC" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Work Email *</label>
              <input id="qEmail" name="Work Email" type="email" required placeholder="jane@acmeplant.com" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
            </div>

            <!-- Phone + Zip -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Phone *</label>
                <input id="qPhone" name="Phone Number" type="tel" required placeholder="503-555-0100" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
              <div>
                <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Ship-To Zip</label>
                <input id="qZip" name="Shipping Zip Code" type="text" placeholder="97031" class="w-full rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"/>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="mb-1 block font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">Additional Specs / Notes</label>
              <textarea id="qNotes" name="Additional Notes" rows="3" placeholder="Part numbers, operating temp, special requirements..." class="w-full resize-none rounded-lg border border-line bg-pureBlack px-3 py-2.5 font-mono text-xs text-white placeholder-muted/50 focus:border-white focus:outline-none"></textarea>
            </div>

          </div><!-- /step3FormBody -->

          <!-- Success / Error state -->
          <div id="step3SuccessBody" class="hidden space-y-4 py-4 text-center">
            <div id="step3ResultIcon" class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#2ea836]/40 bg-[#2ea836]/10">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#2ea836" stroke-width="2.2"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <h3 id="step3ResultTitle" class="text-base font-bold text-white">RFQ Received</h3>
              <p id="step3ResultMsg" class="mt-1 text-xs text-muted">Our engineering team will review your specs and follow up shortly.</p>
            </div>
            <div id="step3SuccessSummary" class="rounded-xl border border-white/10 bg-[#111113] p-3 text-left font-mono text-[10px] text-muted whitespace-pre-wrap"></div>
            <div id="step3FallbackArea" class="hidden space-y-1">
              <p class="text-xs text-muted">Network issue? Use this direct link:</p>
              <a id="qMailLink" href="#" class="font-mono text-xs font-semibold text-[#2ea836] hover:underline">Email RFQ directly →</a>
            </div>
          </div><!-- /step3SuccessBody -->

        </div><!-- /wizardPanel-3 -->

      </form>
    </div>

    <!-- Live Specification Summary Card -->
    <div id="step1SpecSummaryCard" class="border-t border-line bg-pureBlack px-4 py-3">
      <div class="rounded-lg border border-line bg-surface px-3 py-2.5">
        <span class="mb-1.5 block font-mono text-[9px] font-semibold tracking-[0.18em] text-muted uppercase">Specification Summary</span>
        <p id="specSummaryLine" class="font-mono text-xs font-semibold text-white">Filter Bags &bull; Pulse-Jet &bull; Donaldson Torit</p>
        <ul class="mt-1.5 space-y-0.5 font-mono text-[10px] text-muted">
          <li>&bull; Same-day engineering cross-reference from Hood River, OR</li>
          <li>&bull; 100% OEM tube-sheet fitment guarantee</li>
        </ul>
      </div>
    </div>

    <!-- Sticky Wizard Step Navigation Footer (Back / Continue / Submit RFQ) -->
    <div id="wizardFooter" class="flex items-center justify-between gap-3 border-t border-line bg-pureBlack px-4 py-3">
      <button
        type="button"
        id="wizardBackBtn"
        onclick="prevWizardStep()"
        class="hidden rounded-md border border-line bg-surface px-4 py-2 font-mono text-xs font-semibold text-white transition hover:border-white"
      >
        &larr; Back
      </button>
      <div id="wizardBackSpacer"></div>

      <button
        type="button"
        id="wizardNextBtn"
        onclick="nextWizardStep()"
        class="rounded-md bg-white px-5 py-2 text-xs font-bold tracking-wider text-black uppercase transition hover:bg-neutral-200"
      >
        Continue &rarr;
      </button>

      <button
        type="submit"
        form="quoteForm"
        id="wizardSubmitBtn"
        class="hidden w-full rounded-lg bg-white py-3.5 text-xs font-bold tracking-wider text-black uppercase transition hover:bg-zinc-200"
      >
        SUBMIT RFQ &rarr;
      </button>
    </div>
  </aside>
`;

  /* ── Wizard logic ─────────────────────────────────────────────────────── */
  function setDrawerOem(oemName) {
    const inp = document.getElementById('qOemInput');
    const badge = document.getElementById('qOemBadge');
    if (inp) inp.value = oemName;
    if (badge) badge.textContent = oemName;
    closeAllCustomDropdowns();
    updateWizardSummaryBadges();
  }

  function renderDrawerOemChips(filterQuery = '') {
    const container = document.getElementById('drawerOemChips');
    if (!container) return;
    const q = filterQuery.trim().toLowerCase();
    const sourceList = activeDrawerMode === 'cartridges'
      ? Array.from(new Set([...cartridgeOems, ...collectorOemGridList]))
      : collectorOemGridList;

    const currentVal = (document.getElementById('qOemBadge')?.textContent || '').trim().toLowerCase();
    const matches = q
      ? sourceList.filter((o) => o.toLowerCase().includes(q))
      : sourceList;

    container.innerHTML = matches.map((oem) => {
      const isSelected = oem.toLowerCase() === currentVal;
      return `
        <button
          type="button"
          onclick="setDrawerOem('${oem.replace(/'/g, "\\'")}')"
          class="block w-full rounded px-2.5 py-1 text-left font-mono text-xs transition ${isSelected ? 'bg-white font-bold text-black' : 'text-muted hover:bg-surface hover:text-white'}"
        >
          ${oem}
        </button>
      `;
    }).join('');
  }

  function closeAllCustomDropdowns() {
    document.querySelectorAll('.custom-dd-menu').forEach((menu) => menu.classList.add('hidden'));
  }

  function toggleCustomDropdown(menuId) {
    const target = document.getElementById(menuId);
    if (!target) return;
    const wasHidden = target.classList.contains('hidden');
    closeAllCustomDropdowns();
    if (wasHidden) {
      target.classList.remove('hidden');
      if (menuId === 'dd-oemMenu') {
        const inp = document.getElementById('qOemInput');
        if (inp) {
          inp.value = '';
          renderDrawerOemChips('');
          setTimeout(() => inp.focus(), 10);
        }
      }
    }
  }

  const CELL_PLATE_TOP = 'Stainless Snap-Band';

  function isCellPlateActive() {
    return activeDrawerMode === 'bags' && (document.getElementById('qTopConst')?.value || CELL_PLATE_TOP) === CELL_PLATE_TOP;
  }

  // Show the Cell Plate inputs only for Stainless Snap-Band tops; hide + clear otherwise.
  function syncCellPlatePanel() {
    const panel = document.getElementById('cellPlatePanel');
    if (!panel) return;
    const show = (document.getElementById('qTopConst')?.value || CELL_PLATE_TOP) === CELL_PLATE_TOP;
    panel.style.maxHeight = show ? '12rem' : '0px';
    panel.style.opacity = show ? '1' : '0';
    panel.style.marginTop = show ? '' : '-0.75rem'; // collapse the space-y gap too
    panel.setAttribute('aria-hidden', show ? 'false' : 'true');
    panel.querySelectorAll('input').forEach((inp) => {
      inp.disabled = !show;
      if (!show) inp.value = '';
    });
  }

  function setWearCuff(value) {
    const val = value === 'Yes' ? 'Yes' : 'No';
    const hidden = document.getElementById('qWearCuff');
    if (hidden) hidden.value = val;
    ['Yes', 'No'].forEach((opt) => {
      const btn = document.getElementById(`wearCuffBtn-${opt}`);
      if (!btn) return;
      const on = opt === val;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      ['border-white', 'bg-white', 'font-bold', 'text-black'].forEach((c) => btn.classList.toggle(c, on));
      ['border-line', 'bg-surface', 'text-muted', 'hover:border-white', 'hover:text-white'].forEach((c) => btn.classList.toggle(c, !on));
    });
    updateWizardSummaryBadges();
  }

  function getEndConstructionText() {
    const top = document.getElementById('qTopConst')?.value || CELL_PLATE_TOP;
    const bot = document.getElementById('qBottomConst')?.value || 'Standard Sewn Disc Bottom';
    let text = `${top} / ${bot}`;
    if (isCellPlateActive()) {
      const dia = document.getElementById('qCellPlateDia')?.value.trim();
      const thk = document.getElementById('qCellPlateThk')?.value.trim();
      if (dia || thk) text = `${top} (Cell Plate ${dia || '?'} × ${thk || '?'}) / ${bot}`;
    }
    const cuff = document.getElementById('qWearCuff')?.value || 'No';
    return `${text} · Wear Cuff: ${cuff}`;
  }

  function pickCustomOption(hiddenInputId, labelId, value) {
    const hidden = document.getElementById(hiddenInputId);
    const label = document.getElementById(labelId);
    if (hidden) hidden.value = value;
    if (label) label.textContent = value;
    if (hiddenInputId === 'qTopConst') syncCellPlatePanel();
    closeAllCustomDropdowns();
    updateWizardSummaryBadges();
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
      closeAllCustomDropdowns();
    }
  });

  function setDrawerMode(modeName) {
    activeDrawerMode = ['bags', 'cages', 'cartridges', 'valves', 'services'].includes(modeName) ? modeName : 'bags';
    const labels = {
      bags: 'Filter Bags',
      cages: 'Cages & Venturis',
      cartridges: 'Cartridges',
      valves: 'Valves, Kits & Controller Boards',
      services: 'Field Services'
    };
    const divLabel = document.getElementById('ddLabel-division');
    if (divLabel) divLabel.textContent = labels[activeDrawerMode];

    document.querySelectorAll('.mode-group').forEach((el) => el.classList.add('hidden'));
    const activeModeEl = document.getElementById(`modeFields-${activeDrawerMode}`);
    if (activeModeEl) activeModeEl.classList.remove('hidden');

    const step2Groups = {
      bags: 'step2BagControls',
      cages: 'step2CageControls',
      cartridges: 'step2CartridgeControls',
      valves: 'step2ValveControls',
      services: 'step2ServiceControls'
    };
    Object.values(step2Groups).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    const activeStep2El = document.getElementById(step2Groups[activeDrawerMode]);
    if (activeStep2El) activeStep2El.classList.remove('hidden');

    const oemBlock = document.getElementById('wizStep1OemBlock');
    if (oemBlock) oemBlock.classList.toggle('hidden', activeDrawerMode === 'valves');

    const dimBlock = document.getElementById('wizStep1DimensionsBlock');
    if (dimBlock) dimBlock.classList.toggle('hidden', activeDrawerMode === 'services' || activeDrawerMode === 'valves' || activeDrawerMode === 'cartridges');

    const cartPartBlock = document.getElementById('wizStep1CartridgePartBlock');
    if (cartPartBlock) cartPartBlock.classList.toggle('hidden', activeDrawerMode !== 'cartridges');

    const unknownDimsLabel = document.getElementById('wizStep1UnknownDimsLabel');
    if (unknownDimsLabel) unknownDimsLabel.classList.toggle('hidden', activeDrawerMode === 'services' || activeDrawerMode === 'valves' || activeDrawerMode === 'cartridges');

    const endConstBlock = document.getElementById('wizStep2EndConstBlock');
    if (endConstBlock) endConstBlock.classList.toggle('hidden', activeDrawerMode !== 'bags');

    renderDrawerOemChips('');
    updateWizardSummaryBadges();
  }

  function getStep1SummaryText() {
    if (activeDrawerMode === 'valves') {
      const brand = document.getElementById('qValveBrand')?.value || 'Goyen® (Original / Replacement)';
      const partNum = document.getElementById('qValvePartNum')?.value.trim() || 'Part # TBD';
      return `${brand} • Part #: ${partNum}`;
    }

    let style = '';
    if (activeDrawerMode === 'bags') style = document.getElementById('qBagStyle')?.value || 'Pulse-Jet Bag';
    if (activeDrawerMode === 'cages') style = document.getElementById('qCageStyle')?.value || 'One-Piece Pulse-Jet Cage';
    if (activeDrawerMode === 'cartridges') style = document.getElementById('qCartCap')?.value || 'Open / Closed w/ Bolt Hole';
    if (activeDrawerMode === 'services') style = document.getElementById('qServiceScope')?.value || 'Turnkey Baghouse Change-Out';

    const oem = document.getElementById('qOemBadge')?.textContent.trim() || 'Other / Custom';
    if (activeDrawerMode === 'services') return `${style} • ${oem}`;

    if (activeDrawerMode === 'cartridges') {
      const partNum = document.getElementById('cartridgePartNumber')?.value.trim();
      const optOD = document.getElementById('qCartOptOD')?.value.trim();
      const optLen = document.getElementById('qCartOptLen')?.value.trim();
      const dimsStr = (optOD || optLen) ? `${optOD || '?'} × ${optLen || '?'}` : 'Per Universal Part Number';
      if (partNum) return `${style} • ${oem} • Part #: ${partNum} (${dimsStr})`;
      return `${style} • ${oem} (Dimensions TBD)`;
    }

    const dia = document.getElementById('qDiameter')?.value.trim();
    const len = document.getElementById('qLength')?.value.trim();
    const dims = (dia || len) ? `${dia || '?'} × ${len || '?'}` : 'Dimensions TBD';
    return `${style} • ${oem} (${dims})`;
  }

  function getStep2SummaryText() {
    if (activeDrawerMode === 'valves') {
      const conn  = document.getElementById('qValveConn')?.value  || '1" NPT / Dresser';
      const elast = document.getElementById('qValveElast')?.value || 'Standard TPE / Buna-N — 110V/120V AC';
      return `${conn} · ${elast}`;
    }
    if (activeDrawerMode === 'bags') {
      const media = document.getElementById('qBagMedia')?.value || 'Polyester Felt 275°F';
      const weight = document.getElementById('qFabricWeight')?.value || '14 oz/sq. yd. (Standard Felt)';
      return `${media} · ${weight} (${getEndConstructionText()})`;
    }
    if (activeDrawerMode === 'cages') {
      const mat   = document.getElementById('qCageMaterial')?.value || 'Galvanized Steel (Standard)';
      const build = document.getElementById('qCageConstruction')?.value || '1-Piece — Turned Flange Top / Welded Cup';
      const wire  = document.getElementById('qCageWireVenturi')?.value || '10 Vertical Wires (No Venturi)';
      return `${mat} · ${build} · ${wire}`;
    }
    if (activeDrawerMode === 'cartridges') {
      return document.getElementById('qCartMedia')?.value || 'Nanofiber Flame-Retardant (MERV 15)';
    }
    return document.getElementById('qServiceWindow')?.value || 'Planned Shutdown Outage';
  }

  function updateWizardSummaryBadges() {
    const s1 = getStep1SummaryText();
    const s2 = getStep2SummaryText();
    const badge1 = document.getElementById('step1SummaryBadge');
    const badge12 = document.getElementById('step12ReviewBadge');
    if (badge1) badge1.textContent = s1;
    if (badge12) badge12.textContent = `${s1} • ${s2}`;
    // Update live spec summary card
    const summaryLine = document.getElementById('specSummaryLine');
    if (summaryLine) {
      const dim = buildDimSummary();
      summaryLine.textContent = s1 + (dim ? ' • ' + dim : '');
    }
  }

  function buildDimSummary() {
    const d = (document.getElementById('qDiameter') || {}).value || '';
    const l = (document.getElementById('qLength') || {}).value || '';
    const unknown = (document.getElementById('qUnknownDims') || {}).checked;
    if (unknown) return 'Dims: OEM / Sample Cross-Ref';
    if (d && l) return d + ' × ' + l;
    if (d) return 'Ø ' + d;
    return '';
  }

  function fillCommonSize(diameter, length) {
    const dEl = document.getElementById('qDiameter');
    const lEl = document.getElementById('qLength');
    if (dEl) dEl.value = diameter;
    if (lEl) lEl.value = length;
    // Uncheck unknown dims if a size was picked
    const unkEl = document.getElementById('qUnknownDims');
    if (unkEl) { unkEl.checked = false; toggleUnknownDims(false); }
    updateWizardSummaryBadges();
  }

  function toggleUnknownDims(isUnknown) {
    const dimBlock = document.getElementById('wizStep1DimensionsBlock');
    if (!dimBlock) return;
    const inputs = dimBlock.querySelectorAll('input');
    inputs.forEach(function(inp) {
      inp.disabled = isUnknown;
      inp.classList.toggle('opacity-40', isUnknown);
    });
    const pills = dimBlock.querySelectorAll('button');
    pills.forEach(function(btn) {
      btn.disabled = isUnknown;
      btn.classList.toggle('opacity-40', isUnknown);
    });
    updateWizardSummaryBadges();
  }

  function goToWizardStep(stepNum) {
    currentWizardStep = Math.max(1, Math.min(3, stepNum));
    closeAllCustomDropdowns();
    updateWizardSummaryBadges();

    document.querySelectorAll('.wizard-panel').forEach((p) => p.classList.add('hidden'));
    const activePanel = document.getElementById(`wizardPanel-${currentWizardStep}`);
    if (activePanel) activePanel.classList.remove('hidden');

    const stepMeta = {
      1: {
        counter: activeDrawerMode === 'valves' ? 'Step 1 of 3 // Brand & Part #' : 'Step 1 of 3 // Style & Collector',
        title: activeDrawerMode === 'valves' ? 'Select Brand & Part Number(s)' : 'Select Style & Collector'
      },
      2: {
        counter: activeDrawerMode === 'valves' ? 'Step 2 of 3 // Connection & Elastomer' : activeDrawerMode === 'cages' ? 'Step 2 of 3 // Cage Hardware' : 'Step 2 of 3 // Filter Media',
        title: activeDrawerMode === 'valves' ? 'Connection Size & Elastomer / Voltage' : activeDrawerMode === 'cages' ? 'Cage Hardware & Finish' : 'Select Filter Media'
      },
      3: { counter: 'Step 3 of 3 // Quantity & Contact', title: 'Quantity & Send RFQ' }
    };
    const counterEl = document.getElementById('wizardStepCounter');
    const titleEl = document.getElementById('wizardStepTitle');
    if (counterEl) counterEl.textContent = stepMeta[currentWizardStep].counter;
    if (titleEl) titleEl.textContent = stepMeta[currentWizardStep].title;

    [1, 2, 3].forEach((idx) => {
      const bar = document.getElementById(`progBar-${idx}`);
      const lbl = document.getElementById(`progLabel-${idx}`);
      if (bar) {
        bar.classList.toggle('bg-white', idx <= currentWizardStep);
        bar.classList.toggle('bg-line', idx > currentWizardStep);
      }
      if (lbl) {
        lbl.classList.toggle('text-white', idx <= currentWizardStep);
        lbl.classList.toggle('text-muted', idx > currentWizardStep);
      }
    });

    const backBtn = document.getElementById('wizardBackBtn');
    const backSpacer = document.getElementById('wizardBackSpacer');
    const nextBtn = document.getElementById('wizardNextBtn');
    const submitBtn = document.getElementById('wizardSubmitBtn');

    if (backBtn && backSpacer) {
      backBtn.classList.toggle('hidden', currentWizardStep === 1);
      backSpacer.classList.toggle('hidden', currentWizardStep !== 1);
    }
    if (nextBtn) nextBtn.classList.toggle('hidden', currentWizardStep === 3);
    if (submitBtn) submitBtn.classList.toggle('hidden', currentWizardStep !== 3);
    // Show spec summary card only on step 1
    const summaryCard = document.getElementById('step1SpecSummaryCard');
    if (summaryCard) summaryCard.classList.toggle('hidden', currentWizardStep !== 1);

    // Populate Step 3 config summary when arriving at step 3
    if (currentWizardStep === 3) {
      const configLine = document.getElementById('step3ConfigLine');
      const configSub = document.getElementById('step3ConfigSub');
      if (configLine) configLine.textContent = getStep1SummaryText();
      if (configSub) configSub.textContent = getStep2SummaryText();
    }
  }

  function nextWizardStep() {
    if (currentWizardStep < 3) goToWizardStep(currentWizardStep + 1);
  }

  function prevWizardStep() {
    if (currentWizardStep > 1) goToWizardStep(currentWizardStep - 1);
  }

  function openQuoteDrawer(preset = {}) {
    closeAllCustomDropdowns();
    setDrawerMode(preset.mode || 'bags');

    if (preset.oem) {
      setDrawerOem(preset.oem);
    } else {
      renderDrawerOemChips('');
    }

    if (preset.bagStyle) {
      pickCustomOption('qBagStyle', 'ddLabel-bagStyle', preset.bagStyle);
    }
    if (preset.cageStyle) {
      pickCustomOption('qCageStyle', 'ddLabel-cageStyle', preset.cageStyle);
    }
    if (preset.endCap) {
      pickCustomOption('qCartCap', 'ddLabel-cartCap', preset.endCap);
    }
    if (preset.serviceType) {
      pickCustomOption('qServiceScope', 'ddLabel-serviceScope', preset.serviceType);
    }
    if (preset.valveBrand) {
      pickCustomOption('qValveBrand', 'ddLabel-valveBrand', preset.valveBrand);
    }
    if (preset.partNum !== undefined) {
      const partEl = document.getElementById('qValvePartNum');
      if (partEl) partEl.value = preset.partNum;
    }
    if (preset.valveVoltage !== undefined) {
      const voltEl = document.getElementById('qValveVoltage');
      if (voltEl) voltEl.value = preset.valveVoltage;
    }
    if (preset.media) {
      pickCustomOption('qBagMedia', 'ddLabel-bagMedia', preset.media);
    }
    if (preset.diameter !== undefined) {
      const diaEl = document.getElementById('qDiameter');
      if (diaEl) diaEl.value = preset.diameter;
    }
    if (preset.length !== undefined) {
      const lenEl = document.getElementById('qLength');
      if (lenEl) lenEl.value = preset.length;
    }
    const notesEl = document.getElementById('qNotes');
    if (notesEl) {
      if (preset.note) {
        notesEl.value = preset.note;
      } else if (lastPresetNote && notesEl.value === lastPresetNote) {
        // Clear a note left over from a previous preset, unless the visitor edited it
        notesEl.value = '';
      }
      lastPresetNote = preset.note || '';
    }

    // Reset step 3 state for fresh open
    const s3form = document.getElementById('step3FormBody');
    const s3success = document.getElementById('step3SuccessBody');
    const s3submitBtn = document.getElementById('wizardSubmitBtn');
    const drawerFooter = document.getElementById('wizardFooter');
    if (s3form) s3form.classList.remove('hidden');
    if (s3success) s3success.classList.add('hidden');
    if (s3submitBtn) { s3submitBtn.disabled = false; s3submitBtn.textContent = 'SUBMIT RFQ →'; }
    if (drawerFooter) drawerFooter.classList.remove('hidden');

    goToWizardStep(1);

    const backdrop = document.getElementById('drawerBackdrop');
    const drawer = document.getElementById('quoteDrawer');
    if (backdrop) backdrop.classList.remove('hidden');
    if (drawer) drawer.classList.remove('translate-x-full');
  }

  function closeQuoteDrawer() {
    closeAllCustomDropdowns();
    const backdrop = document.getElementById('drawerBackdrop');
    const drawer = document.getElementById('quoteDrawer');
    if (backdrop) backdrop.classList.add('hidden');
    if (drawer) drawer.classList.add('translate-x-full');
  }

  async function submitCompactQuote(e) {
    e.preventDefault();

    const qty      = document.getElementById('qQty')?.value.trim() || 'TBD';
    const shipDate = document.getElementById('qShipDate')?.value.trim() || 'N/A';
    const name     = document.getElementById('qName')?.value.trim() || '';
    const company  = document.getElementById('qCompany')?.value.trim() || '';
    const email    = document.getElementById('qEmail')?.value.trim() || '';
    const phone    = document.getElementById('qPhone')?.value.trim() || 'N/A';
    const zip      = document.getElementById('qZip')?.value.trim() || 'N/A';
    const notes    = document.getElementById('qNotes')?.value.trim() || 'None';

    let specFields = {};
    let subjectTag = '';

    if (activeDrawerMode === 'valves') {
      const vBrand = document.getElementById('qValveBrand')?.value  || 'Goyen® (Original / Replacement)';
      const vPart  = document.getElementById('qValvePartNum')?.value.trim() || 'TBD';
      const vConn  = document.getElementById('qValveConn')?.value  || '1" NPT / Dresser';
      const vElast = document.getElementById('qValveElast')?.value || 'Standard TPE / Buna-N — 110V/120V AC';
      specFields = {
        'Division':              'VALVES, KITS & CONTROLLER BOARDS',
        'Brand':                 vBrand,
        'Part # / Port Size':    vPart,
        'Connection & Size':     vConn,
        'Elastomer & Voltage':   vElast
      };
      subjectTag = `${vBrand} [${vPart}]`;
    } else {
      const oem  = document.getElementById('qOemBadge')?.textContent.trim() || 'Other / Custom';

      if (activeDrawerMode === 'cartridges') {
        const partNum = document.getElementById('cartridgePartNumber')?.value.trim() || 'TBD';
        const optOD = document.getElementById('qCartOptOD')?.value.trim();
        const optLen = document.getElementById('qCartOptLen')?.value.trim();
        const dims = (optOD || optLen) ? `${optOD || '?'} × ${optLen || '?'}` : 'Per Universal Part Number';
        specFields = {
          'Division':     'CARTRIDGES',
          'Part Number':  partNum,
          'Endcap Style': document.getElementById('qCartCap')?.value || 'Open / Closed w/ Bolt Hole',
          'Filter Media': getStep2SummaryText(),
          'Collector OEM': oem,
          'Dimensions':   dims
        };
        subjectTag = `${oem} [Part #: ${partNum}]`;
      } else if (activeDrawerMode === 'cages') {
        const dia  = document.getElementById('qDiameter')?.value.trim() || 'TBD';
        const len  = document.getElementById('qLength')?.value.trim() || 'TBD';
        const mat   = document.getElementById('qCageMaterial')?.value || 'Galvanized Steel (Standard)';
        const build = document.getElementById('qCageConstruction')?.value || '1-Piece — Turned Flange Top / Welded Cup';
        const wire  = document.getElementById('qCageWireVenturi')?.value || '10 Vertical Wires (No Venturi)';
        specFields = {
          'Division':              'CAGES & VENTURIS',
          'Cage Style':            document.getElementById('qCageStyle')?.value || 'One-Piece Pulse-Jet Cage',
          'Collector OEM':         oem,
          'Outside Diameter (OD)': dia,
          'Overall Length':        len,
          'Material / Finish':     mat,
          'Construction & Style':  build,
          'Wire Count & Venturi':  wire
        };
        subjectTag = `${oem} [${dia} × ${len}]`;
      } else {
        const dia  = document.getElementById('qDiameter')?.value.trim();
        const len  = document.getElementById('qLength')?.value.trim();
        const dims = (dia || len) ? `${dia || '?'} × ${len || '?'}` : 'TBD';
        const fw   = activeDrawerMode === 'bags' ? (document.getElementById('qFabricWeight')?.value || null) : null;
        const ends = activeDrawerMode === 'bags'
          ? ((document.getElementById('qTopConst')?.value || 'Stainless Snap-Band') + ' / ' + (document.getElementById('qBottomConst')?.value || 'Standard Sewn Disc Bottom'))
          : getStep2SummaryText();
        const bagExtras = {};
        if (activeDrawerMode === 'bags') {
          if (isCellPlateActive()) {
            bagExtras['Cell Plate Diameter']  = document.getElementById('qCellPlateDia')?.value.trim() || 'TBD';
            bagExtras['Cell Plate Thickness'] = document.getElementById('qCellPlateThk')?.value.trim() || 'TBD';
          }
          bagExtras['Wear Cuff Needed'] = document.getElementById('qWearCuff')?.value || 'No';
        }
        specFields = {
          'Division':    activeDrawerMode.toUpperCase(),
          'Style':       getStep1SummaryText(),
          'Media / Spec': document.getElementById('qBagMedia')?.value || getStep2SummaryText(),
          'Collector OEM': oem,
          'Dimensions':  dims,
          'End Construction': ends,
          ...bagExtras,
          ...(fw ? { 'Fabric Weight': fw } : {})
        };
        subjectTag = `${oem} [${dims}]`;
      }
    }

    const allFields = {
      ...specFields,
      'Quantity':          qty,
      'Target Ship Date':  shipDate,
      'Full Name':         name,
      'Company / Plant':   company,
      'Work Email':        email,
      'Phone':             phone,
      'Ship-To Zip':       zip,
      'Notes':             notes
    };

    const summaryLines = Object.entries(allFields).map(([k, v]) => `${k}: ${v}`);
    const summaryText = [
      'MOUNT HOOD FILTRATION — RFQ',
      '─'.repeat(38),
      ...summaryLines,
      '─'.repeat(38)
    ].join('\n');

    const mailSubject = encodeURIComponent(`RFQ: ${subjectTag} (${qty}) — ${company}`);
    const mailBody    = encodeURIComponent(summaryText);
    const mailHref    = `mailto:info@mounthoodfiltration.com?subject=${mailSubject}&body=${mailBody}`;

    // UI refs
    const formBody    = document.getElementById('step3FormBody');
    const successBody = document.getElementById('step3SuccessBody');
    const resultIcon  = document.getElementById('step3ResultIcon');
    const resultTitle = document.getElementById('step3ResultTitle');
    const resultMsg   = document.getElementById('step3ResultMsg');
    const summaryBox  = document.getElementById('step3SuccessSummary');
    const fallback    = document.getElementById('step3FallbackArea');
    const mailLink    = document.getElementById('qMailLink');
    const submitBtn   = document.getElementById('wizardSubmitBtn');
    const footer      = document.getElementById('wizardFooter');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    function showResult(ok) {
      if (formBody)    formBody.classList.add('hidden');
      if (successBody) successBody.classList.remove('hidden');
      if (summaryBox)  summaryBox.textContent = summaryText;
      if (mailLink)    mailLink.href = mailHref;
      if (footer)      footer.classList.add('hidden');
      if (!ok) {
        if (resultIcon)  { resultIcon.className = 'mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10'; resultIcon.innerHTML = '<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'; }
        if (resultTitle) resultTitle.textContent = 'Submission Note';
        if (resultMsg)   resultMsg.textContent = 'Network issue. Please use the direct email link below.';
        if (fallback)    fallback.classList.remove('hidden');
      }
    }

    try {
      const res  = await fetch('https://formsubmit.co/ajax/43a25cb8b3fde5915648ce87075176cf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: 'New Baghouse RFQ — Mount Hood Filtration',
          _template: 'table',
          _captcha: 'false',
          ...allFields
        })
      });
      const data = await res.json().catch(() => ({}));
      showResult(res.ok && data.success !== false);
      if (!res.ok || data.success === false) {
        if (fallback) fallback.classList.remove('hidden');
      }
    } catch (_err) {
      showResult(false);
    }
  }

  function copySpecText() {
    const summaryEl = document.getElementById('qSummaryText');
    const copyBtn = document.getElementById('qCopyBtn');
    if (!summaryEl) return;

    const tempArea = document.createElement('textarea');
    tempArea.value = summaryEl.textContent;
    tempArea.style.position = 'fixed';
    tempArea.style.opacity = '0';
    document.body.appendChild(tempArea);
    tempArea.select();
    try {
      document.execCommand('copy');
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Summary';
        }, 1800);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
    document.body.removeChild(tempArea);
  }

  /* ── data-rfq-* hooks ─────────────────────────────────────────────────── */
  const PRESET_KEYS = ['mode', 'oem', 'bagStyle', 'media', 'cageStyle', 'endCap', 'valveBrand', 'partNum', 'serviceType', 'note', 'diameter', 'length', 'valveVoltage'];

  function presetFromElement(el) {
    const preset = {};
    PRESET_KEYS.forEach((key) => {
      const attr = 'rfq' + key.charAt(0).toUpperCase() + key.slice(1);
      if (el.dataset[attr] !== undefined) preset[key] = el.dataset[attr];
    });
    return preset;
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-rfq-mode]');
    if (!trigger) return;
    e.preventDefault();
    openQuoteDrawer(presetFromElement(trigger));
  });

  /* ── Mount ────────────────────────────────────────────────────────────── */
  function mount() {
    if (!document.getElementById('quoteDrawer')) {
      document.body.insertAdjacentHTML('beforeend', DRAWER_HTML);
    }
    renderDrawerOemChips();
    syncCellPlatePanel();
    setDrawerMode('bags');
    goToWizardStep(1);
  }

  // Functions referenced by the drawer's inline handlers and by pages.
  Object.assign(window, {
    openQuoteDrawer, closeQuoteDrawer, setDrawerMode, setDrawerOem,
    renderDrawerOemChips, closeAllCustomDropdowns, toggleCustomDropdown,
    pickCustomOption, updateWizardSummaryBadges, fillCommonSize,
    toggleUnknownDims, goToWizardStep, nextWizardStep, prevWizardStep,
    submitCompactQuote, copySpecText, setWearCuff
  });

  window.MHF_RFQ = {
    open: openQuoteDrawer,
    close: closeQuoteDrawer,
    collectorOemGridList,
    cartridgeOems
  };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
