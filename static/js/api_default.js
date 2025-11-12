// app/static/js/melody_item.js
(function () {
    function init() {
        try {
            window.MELODY_ITEM_LOADED = Date.now();
            window.dispatchEvent(new CustomEvent('melody:item:boot'));
        } catch (e) { /* no-op */ }
        console.log('melody_item: boot');

        const container =
            document.getElementById('api-sidebar-content') ||
            document.getElementById('InfoContainer') ||
            document.getElementById('idInfoContainer');
        if (!container) {
            console.warn('melody_item: container not found (looked for #api-sidebar-content, #InfoContainer, #idInfoContainer)');
            return;
        }
        console.log('melody_item: using container', { id: container.id });
        const datasetCfg = {
            API_URL: container.dataset.apiUrl || '',
            CONFIG_URL: container.dataset.configUrl || '',
            ITEM_URI: container.dataset.itemUri || '',
        };
        const cfg = (window.MELODY_CONFIG && Object.keys(window.MELODY_CONFIG).length)
            ? window.MELODY_CONFIG
            : datasetCfg;
        console.log('Melody item sidebar config:', cfg);

        // Chart.js loader (must be defined before any passive rendering attempts)
        // Chart.js is shipped under /vendors/chart.js/ via public/ static mount
        const CHART_JS_SRC = '/vendors/chart.js/chart.umd.js';
        console.log('Melody item sidebar Chart.js source:', CHART_JS_SRC);
        let chartLoaderPromise = null;
        let timelinePluginRegistered = false;

        // Timeline plugins (must be initialized regardless of active/passive mode)
        const highlightGlowPlugin = {
            id: 'melodyHighlightGlow',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                const datasets = chart.data && chart.data.datasets ? chart.data.datasets : [];
                for (let i = 0; i < datasets.length; i++) {
                    const ds = datasets[i];
                    if (!ds || !ds._isHighlight) continue;
                    const meta = chart.getDatasetMeta(i);
                    if (!meta || !meta.data || !meta.data.length) continue;
                    const bar = meta.data[0];
                    const props = bar.getProps(['x', 'base', 'y', 'height'], true);
                    const left = Math.min(props.base, props.x);
                    const width = Math.abs(props.x - props.base);
                    if (!Number.isFinite(left) || !Number.isFinite(width)) continue;
                    const inflate = Math.min(8, Math.max(4, (props.height || 0) * 0.35));
                    const height = (props.height || 0) + inflate;
                    const top = (props.y || 0) - height / 2;
                    ctx.save();
                    ctx.shadowColor = 'rgba(67, 97, 121, 0.4)';
                    ctx.shadowBlur = 18;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    const bg = typeof ds.backgroundColor === 'function'
                        ? ds.backgroundColor({ chart, dataIndex: 0, datasetIndex: i })
                        : ds.backgroundColor || '#A62176';
                    ctx.fillStyle = bg;
                    ctx.fillRect(left, top, width, height);
                    ctx.restore();
                }
            }
        };
        const barBackgroundPlugin = {
            id: 'melodyBarBackground',
            beforeDatasetsDraw(chart, args, opts) {
                const { ctx, scales } = chart;
                const xScale = scales.x;
                if (!xScale) return;
                let element = null;
                for (const datasetMeta of chart.getSortedVisibleDatasetMetas()) {
                    if (datasetMeta.data && datasetMeta.data[0]) {
                        element = datasetMeta.data[0];
                        break;
                    }
                }
                if (!element) return;
                const y = element.y;
                const h = element.height ?? 0;
                ctx.save();
                ctx.fillStyle = opts && opts.color ? opts.color : '#faf5f8';
                ctx.fillRect(xScale.left, y - h / 2, xScale.right - xScale.left, h);
                ctx.restore();
            }
        };
        function ensureTimelinePlugins() { if (timelinePluginRegistered || typeof Chart === 'undefined') return; Chart.register(barBackgroundPlugin, highlightGlowPlugin); timelinePluginRegistered = true; console.log('melody_item: timeline plugins registered'); }
        if (!cfg.API_URL) {
            // If API_URL is missing, we might be in passive mode where the
            // server-side HTML (with .melody-data-viz) is injected by another script.
            // In that case, just render when content is available.
            const hasViz = (root) => !!root.querySelector('.melody-data-viz');
            const renderIfReady = async () => {
                if (!hasViz(container)) return false;
                try {
                    await ensureChartJS();
                    const effectiveCfg = Object.assign({}, cfg, { ITEM_URI: container.dataset.itemUri || (cfg.ITEM_URI || (window.MELODY_CONFIG && window.MELODY_CONFIG.ITEM_URI) || '') }); await renderMelodyVisualizations(container, effectiveCfg);
                    console.log('melody_item: rendered existing content');
                } catch (err) {
                    console.warn('melody_item: failed rendering existing content', err);
                }
                return true;
            };
            if (hasViz(container)) {
                renderIfReady();
            } else {
                console.log('melody_item: waiting for content to appear');
                const obs = new MutationObserver(async () => {
                    if (await renderIfReady()) obs.disconnect();
                });
                obs.observe(container, { childList: true, subtree: true });
            }
            return; // passive path
        }

        function deepReplace(obj, token, replacement) {
            if (obj == null) return obj;
            if (typeof obj === 'string') return obj.replaceAll(token, replacement);
            if (Array.isArray(obj)) return obj.map(v => deepReplace(v, token, replacement));
            if (typeof obj === 'object') {
                const out = {};
                for (const [k, v] of Object.entries(obj)) out[k] = deepReplace(v, token, replacement);
                return out;
            }
            return obj;
        }

        function normalizeRef(value) { let out = String(value || "").trim(); if (out.startsWith("<") && out.endsWith(">")) out = out.slice(1, -1); out = out.toLowerCase(); out = out.replace(/[\\/#]+$/, ""); out = out.replace(/^http:\/\//, "https://"); return out; }

        function parseJsonSafe(raw) {
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (err) {
                console.warn('Unable to parse melody data-config JSON', err);
                return null;
            }
        }

        function ensureChartJS() {
            if (typeof Chart !== 'undefined') return Promise.resolve();
            if (chartLoaderPromise) return chartLoaderPromise;
            chartLoaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = CHART_JS_SRC;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Chart.js from ' + CHART_JS_SRC));
                document.head.appendChild(script);
            });
            return chartLoaderPromise;
        }

        function hexToRgb(hex) {
            const m = (hex || '').replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (!m) return { r: 0, g: 0, b: 0 };
            return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
        }
        function lerpColorRGB(a, b, t) {
            return {
                r: Math.round(a.r + (b.r - a.r) * t),
                g: Math.round(a.g + (b.g - a.g) * t),
                b: Math.round(a.b + (b.b - a.b) * t)
            };
        }
        function rgbToCss(rgb, alpha = 1) {
            const { r = 0, g = 0, b = 0 } = rgb || {};
            return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        function getYearUTC(x) {
            const d = new Date(x);
            return Number.isFinite(d.getTime()) ? d.getUTCFullYear() : NaN;
        }
        function representativeYear(a, b) {
            return (a === b) ? a : Math.round((a + b) / 2);
        }
        function floorToBinStart(y, binSize) {
            return Math.floor(y / binSize) * binSize;
        }
        function makeBinLabel(start, binSize, clampEndToYear = null) {
            if (binSize <= 1) return String(start);
            let end = start + binSize - 1;
            if (Number.isFinite(clampEndToYear)) end = Math.min(end, clampEndToYear);
            return String(start) + '-' + String(end);
        }

        function chooseBinSize(minYear, maxYear) {
            const range = Math.max(0, (maxYear ?? 0) - (minYear ?? 0) + 1);
            if (!range || range <= 1) return 1;
            const candidates = [1, 2, 5, 10, 20, 25, 50, 75, 100, 200, 250, 500, 1000, 5000, 10000];
            const target = 32;
            const minBins = 12;
            const maxBins = 64;
            let best = candidates[0];
            let bestScore = Infinity;
            for (const s of candidates) {
                if (!(Number.isFinite(s) && s > 0)) continue;
                const bins = Math.ceil(range / s);
                const outside = (bins < minBins) ? (minBins - bins) : (bins > maxBins ? (bins - maxBins) : 0);
                const score = Math.abs(bins - target) + outside * 2;
                if (score < bestScore) {
                    bestScore = score;
                    best = s;
                }
            }
            return best;
        }

        function processToBins(data) {
            const years = [];
            for (const obj of data) {
                const beginRaw = obj.begin ?? obj?.begin?.value ?? obj.start ?? obj.dateBegin ?? obj.from;
                const endRaw = obj.end ?? obj?.end?.value ?? obj.finish ?? obj.dateEnd ?? obj.to ?? beginRaw;
                if (!beginRaw || !endRaw) continue;
                const by = getYearUTC(beginRaw);
                const ey = getYearUTC(endRaw);
                if (!Number.isFinite(by) || !Number.isFinite(ey)) continue;
                years.push(representativeYear(by, ey));
            }
            if (!years.length) {
                return {
                    starts: [],
                    labels: [],
                    counts: [],
                    maxCount: 0,
                    minYear: null,
                    maxYear: null,
                    binSize: 0
                };
            }
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const binSize = chooseBinSize(minYear, maxYear);
            const countMap = {};
            for (const y of years) {
                const bucket = floorToBinStart(y, binSize);
                countMap[bucket] = (countMap[bucket] || 0) + 1;
            }
            const starts = [];
            const labels = [];
            const counts = [];
            for (let b = floorToBinStart(minYear, binSize); b <= maxYear; b += binSize) {
                starts.push(b);
                labels.push(makeBinLabel(b, binSize, maxYear));
                counts.push(countMap[b] ?? 0);
            }
            const maxCount = counts.length ? Math.max(...counts) : 0;
            return { starts, labels, counts, maxCount, minYear, maxYear, binSize };
        }

        function buildEqualWidthDatasets(starts, labels, counts, maxCount, highlightIndex) {
            const datasets = [];
            const rgbWhite = { r: 255, g: 255, b: 255 };
            const rgbAccent = hexToRgb('#A62176');
            const denom = maxCount > 0 ? maxCount : 1;
            for (let i = 0; i < starts.length; i++) {
                const c = counts[i];
                const t = c / denom;
                const isHighlight = i === highlightIndex;
                const baseRgb = lerpColorRGB(rgbWhite, rgbAccent, t || 0);
                const backgroundColor = rgbToCss(baseRgb, isHighlight ? 1 : 0.85);
                datasets.push({
                    label: labels[i],
                    data: [1],
                    backgroundColor,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    stack: 'timeline',
                    clip: false,
                    _realCount: c,
                    _isHighlight: isHighlight
                });
            }
            return datasets;
        }

        function dedupeTimelineRows(rows) {
            const seen = new Set();
            const out = [];
            for (const r of rows) {
                const item = r.item || r.id || r.uri;
                const begin = r.begin ?? r.start ?? r.dateBegin ?? r.from;
                const end = r.end ?? r.finish ?? r.dateEnd ?? r.to ?? begin;
                if (!begin) continue;
                const key = item ? `item:${item}` : `range:${begin}|${end}`;
                if (seen.has(key)) continue;
                seen.add(key);
                out.push(r);
            }
            return out;
        }

        function normalizeTimelineRows(rows) {
            const byKey = new Map();
            for (const r of rows) {
                const item = r.item || r.id || r.uri;
                const beginRaw = r.begin ?? r.start ?? r.dateBegin ?? r.from;
                const endRaw = r.end ?? r.finish ?? r.dateEnd ?? r.to ?? beginRaw;
                if (!beginRaw) continue;
                const key = item || `range:${beginRaw}|${endRaw}`;
                const entry = byKey.get(key) || { item: item || null, minY: Infinity, maxY: -Infinity };
                const by = getYearUTC(beginRaw);
                const ey = getYearUTC(endRaw);
                if (Number.isFinite(by)) entry.minY = Math.min(entry.minY, by);
                if (Number.isFinite(ey)) entry.maxY = Math.max(entry.maxY, ey);
                byKey.set(key, entry);
            }
            const result = [];
            for (const value of byKey.values()) {
                if (!Number.isFinite(value.minY) || !Number.isFinite(value.maxY)) continue;
                const beginISO = new Date(Date.UTC(value.minY, 0, 1)).toISOString();
                const endISO = new Date(Date.UTC(value.maxY, 11, 31, 23, 59, 59)).toISOString();
                result.push({ item: value.item, begin: beginISO, end: endISO });
            }
            return result;
        }

        function findHighlightIndex(rows, starts, binSize, itemUri) {
            if (!itemUri || !starts.length || !binSize) return -1;
            const normalizedTarget = normalizeRef(itemUri); const match = rows.find(r => normalizeRef(r.item || r.id || r.uri) === normalizedTarget); if (!match) { console.log('melody_item: no highlight match for', normalizedTarget); return -1; }
            const beginYear = getYearUTC(match.begin);
            const endYear = getYearUTC(match.end ?? match.begin);
            if (!Number.isFinite(beginYear)) return -1;
            const year = Number.isFinite(endYear) ? representativeYear(beginYear, endYear) : beginYear;
            if (!Number.isFinite(year)) return -1;
            const bucketStart = floorToBinStart(year, binSize);
            const idx = starts.indexOf(bucketStart); console.log('melody_item: highlight index', idx, 'year', year, 'bucketStart', bucketStart); return idx;
        }

        function renderTimelineChart(canvas, rawRows, itemUri) {
            const deduped = dedupeTimelineRows(rawRows);
            const normalized = normalizeTimelineRows(deduped);
            if (!normalized.length) return;
            const bucketed = processToBins(normalized);
            const { starts, labels, counts, maxCount, binSize } = bucketed;
            if (!starts.length) return;
            const highlightIndex = findHighlightIndex(normalized, starts, binSize || 1, itemUri);
            const datasets = buildEqualWidthDatasets(starts, labels, counts, maxCount || 0, highlightIndex); console.log('melody_item: chart bins', labels.length, 'rows', normalized.length, 'highlight', highlightIndex);

            ensureTimelinePlugins();
            if (typeof Chart === 'undefined') return;

            const ctx = canvas.getContext('2d');
            if (canvas._chart) canvas._chart.destroy();
            canvas.style.height = canvas.dataset.height || '160px';

            const n = labels.length;
            const tickEvery = Math.max(1, Math.ceil(n / 20));
            canvas._chart = new Chart(ctx, {
                type: 'bar',
                data: { labels: [''], datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    layout: { padding: 5 },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0,
                            max: n,
                            stacked: true,
                            position: 'top',
                            ticks: {
                                stepSize: 1,
                                callback: (val) => {
                                    const idx = Math.round(val - 0.5);
                                    if (!(idx >= 0 && idx < n)) return '';
                                    if (idx % tickEvery !== 0) return '';
                                    const lab = labels[idx] || '';
                                    const start = String(lab).split(/[^0-9]/)[0] || lab;
                                    return start;
                                },
                                maxRotation: 0,
                                minRotation: 0,
                                align: 'center',
                                crossAlign: 'center',
                                padding: 5
                            },
                            grid: { drawOnChartArea: false, drawTicks: false, drawBorder: false },
                            border: { display: false }
                        },
                        y: {
                            stacked: true,
                            ticks: { display: false },
                            grid: { display: false, drawOnChartArea: false, drawTicks: false, drawBorder: false },
                            border: { display: false }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            displayColors: false,
                            callbacks: {
                                title: items => items[0]?.dataset?.label || '',
                                label: (item) => {
                                    const dataset = item.dataset || {};
                                    const count = dataset._realCount ?? 0;
                                    if (dataset._isHighlight) {
                                        return `Count: ${count} (current item)`;
                                    }
                                    return `Count: ${count}`;
                                }
                            }
                        },
                        melodyBarBackground: { color: '#faf5f8' }
                    },
                    animation: { duration: 0 }
                }
            });
        }

        async function renderMelodyVisualizations(rootEl, cfgObj) {
            if (!rootEl) return; const itemUri = (cfgObj && cfgObj.ITEM_URI) || rootEl.dataset.itemUri || (window.MELODY_CONFIG && window.MELODY_CONFIG.ITEM_URI) || '';
            const blocks = Array.from(rootEl.querySelectorAll('.melody-data-viz')); console.log('melody_item: found viz blocks', blocks.length, 'itemUri set:', !!itemUri); if (!blocks.length) return;
            const pending = [];
            for (const block of blocks) {
                const canvas = block.querySelector('canvas');
                const rawCfg = block.dataset.config;
                if (!canvas || !rawCfg) continue;
                const parsed = parseJsonSafe(rawCfg);
                const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
                if (!rows.length) continue;
                const includesItem = itemUri ? rows.some(r => normalizeRef(r.item || r.id || r.uri) === normalizeRef(itemUri)) : true;
                if (!includesItem) { console.log('melody_item: block skipped (no match for ITEM_URI)'); continue; }
                pending.push({ canvas, rows });
            }
            console.log('melody_item: pending charts to render', pending.length); if (!pending.length) return;
            try {
                await ensureChartJS();
            } catch (err) {
                console.warn('Chart.js not available for melody visualization', err);
                return;
            }
            for (const { canvas, rows } of pending) {
                try {
                    renderTimelineChart(canvas, rows, itemUri);
                } catch (err) {
                    console.error('Failed to render melody timeline', err);
                }
            }
        }

        (async () => {
            let configObj = null;
            const lang = (window.MELODY_CONFIG && window.MELODY_CONFIG.LANG) || (container.dataset.lang || '');
            if (cfg.CONFIG_URL) {
                try {
                    const r = await fetch(cfg.CONFIG_URL, { credentials: 'same-origin' });
                    configObj = await r.json();
                    if (lang) configObj = deepReplace(configObj, '$LANG$', String(lang));
                } catch (e) {
                    console.warn('Failed to fetch/parse config file', e);
                }
            }

            const payload = {
                format: 'html',
                uri1: cfg.ITEM_URI || ''
            };
            if (configObj) payload.config_file = configObj;

            const res = await fetch(cfg.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text || 'Request failed');
            container.innerHTML = text;
            const effectiveCfg = Object.assign({}, cfg, { ITEM_URI: container.dataset.itemUri || (cfg.ITEM_URI || (window.MELODY_CONFIG && window.MELODY_CONFIG.ITEM_URI) || '') }); await renderMelodyVisualizations(container, effectiveCfg);
        })().catch(err => {
            console.error('Melody API error:', err);
            container.innerHTML = '<div class="small opacity-75">Failed to load sidebar data.</div>';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();



