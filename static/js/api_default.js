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
        const DEFAULT_LANG = 'it';
        const globalTimelineLang = resolveLang(
            cfg.LANG,
            container.dataset.lang,
            typeof document !== 'undefined'
                ? (document.documentElement && document.documentElement.lang)
                : ''
        );

        const MIN_NATIVE_ISO_YEAR = -271821;
        const MAX_NATIVE_ISO_YEAR = 275760;

        function yearSuffix(year, lang = DEFAULT_LANG) {
            const isBC = Number.isFinite(year) && year < 0;
            if (lang === 'en') return isBC ? 'BCE' : 'CE';
            return isBC ? 'a.C.' : 'd.C.';
        }
        function formatYearNumber(absYear, lang = DEFAULT_LANG) {
            const locale = lang === 'it' ? 'it-IT' : 'en-US';
            const useCompact = absYear >= 1000;
            try {
                const formatter = new Intl.NumberFormat(locale, {
                    notation: useCompact ? 'compact' : 'standard',
                    compactDisplay: 'short',
                    maximumFractionDigits: useCompact ? 1 : 0
                });
                return formatter.format(absYear);
            } catch (e) {
                return String(absYear);
            }
        }
        function formatYearCompact(year, lang = DEFAULT_LANG) {
            if (!Number.isFinite(year)) return '';
            const abs = Math.abs(year);
            const number = formatYearNumber(abs, lang);
            const suffix = yearSuffix(year, lang);
            return number ? `${number} ${suffix}` : suffix;
        }
        function formatYearExact(year, lang = DEFAULT_LANG) {
            if (!Number.isFinite(year)) return '';
            const locale = lang === 'it' ? 'it-IT' : 'en-US';
            try {
                return new Intl.NumberFormat(locale, {
                    notation: 'standard',
                    maximumFractionDigits: 0
                }).format(Math.abs(year));
            } catch (e) {
                return String(Math.abs(year));
            }
        }
        function formatSingleYearLabel(year, lang = DEFAULT_LANG, preferExact = false) {
            if (!Number.isFinite(year)) return '';
            if (preferExact) {
                return `${formatYearExact(year, lang)} ${yearSuffix(year, lang)}`.trim();
            }
            const compact = formatYearNumber(Math.abs(year), lang);
            return `${compact} ${yearSuffix(year, lang)}`.trim();
        }
        function formatRangeLabel(startYear, endYear, lang = DEFAULT_LANG, preferExact = false) {
            const hasStart = Number.isFinite(startYear);
            const hasEnd = Number.isFinite(endYear);
            if (!hasStart && !hasEnd) return '';
            if (hasStart && hasEnd) {
                const suffixStart = yearSuffix(startYear, lang);
                const suffixEnd = yearSuffix(endYear, lang);
                const numStart = formatYearNumber(Math.abs(startYear), lang);
                const numEnd = formatYearNumber(Math.abs(endYear), lang);
                const exactStart = formatYearExact(startYear, lang);
                const exactEnd = formatYearExact(endYear, lang);
                const sameActual = Math.abs(startYear - endYear) < 1e-9;
                if (suffixStart === suffixEnd) {
                    if (sameActual) return `${exactStart} ${suffixStart}`.trim();
                    const startVal = preferExact ? exactStart : numStart;
                    const endVal = preferExact ? exactEnd : numEnd;
                    return `${startVal}\u2013${endVal} ${suffixStart}`.trim();
                }
                const startOut = preferExact ? exactStart : numStart;
                const endOut = preferExact ? exactEnd : numEnd;
                return `${startOut} ${suffixStart} \u2013 ${endOut} ${suffixEnd}`.trim();
            }
            return hasStart ? formatYearCompact(startYear, lang) : formatYearCompact(endYear, lang);
        }
        function coerceYearValue(value) {
            if (value == null || value === '') return NaN;
            if (typeof value === 'object' && value !== null && 'value' in value) return coerceYearValue(value.value);
            if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
            const str = String(value).trim();
            if (!str) return NaN;
            const edtf = str.match(/^Y(-?\d+)(?:-.*)?$/i);
            if (edtf) {
                const year = Number(edtf[1]);
                if (Number.isFinite(year)) return year;
            }
            if (/^-?\d+$/.test(str)) return Number(str);
            const date = new Date(str);
            return Number.isFinite(date.getTime()) ? date.getUTCFullYear() : NaN;
        }
        function getYearUTC(x) { return coerceYearValue(x); }
        function representativeYear(a, b) {
            return (a === b) ? a : Math.round((a + b) / 2);
        }
        function safeIsoFromYear(year, { endOfYear = false } = {}) {
            if (!Number.isFinite(year)) return null;
            if (year < MIN_NATIVE_ISO_YEAR || year > MAX_NATIVE_ISO_YEAR) return null;
            const month = endOfYear ? 11 : 0;
            const day = endOfYear ? 31 : 1;
            const hour = endOfYear ? 23 : 0;
            const minute = endOfYear ? 59 : 0;
            const second = endOfYear ? 59 : 0;
            const ms = endOfYear ? 999 : 0;
            const date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
            return Number.isFinite(date.getTime()) ? date.toISOString() : null;
        }
        function pickYear(...candidates) {
            for (const candidate of candidates) {
                const y = getYearUTC(candidate);
                if (Number.isFinite(y)) return y;
            }
            return NaN;
        }
        function floorToBinStart(y, binSize) {
            return Math.floor(y / binSize) * binSize;
        }
        function makeBinLabel(start, end, preferExact = false, lang = DEFAULT_LANG) {
            return formatRangeLabel(start, end, lang, preferExact);
        }

        function normalizeRef(value) { let out = String(value || "").trim(); if (out.startsWith("<") && out.endsWith(">")) out = out.slice(1, -1); out = out.toLowerCase(); out = out.replace(/[\\/#]+$/, ""); out = out.replace(/^http:\/\//, "https://"); return out; }
        const ROW_URI_KEYS = ['item', 'id', 'uri', 'itemUri', 'item_uri', 'itemId', 'itemID', 'entity', 'entityId', 'uri1', 'uri2', 'source', 'target', 'subject', 'object', 'work', 'expression', 'manifestation'];
        function ensureRowItem(row, normalizedTarget = '') {
            if (!row || typeof row !== 'object') return '';
            if (row.__normalizedItem && (!normalizedTarget || row.__normalizedItem === normalizedTarget)) {
                return row.__normalizedItem;
            }
            const assignValue = (candidate) => {
                if (!candidate) return '';
                let raw = candidate;
                if (typeof candidate === 'object' && candidate !== null && 'value' in candidate) {
                    raw = candidate.value;
                }
                if (typeof raw !== 'string') return '';
                const trimmed = raw.trim();
                if (!trimmed) return '';
                if (!row.item) row.item = trimmed;
                const normalized = normalizeRef(trimmed);
                row.__normalizedItem = normalized;
                return normalized;
            };
            if (row.item) {
                const normalizedExisting = assignValue(row.item);
                if (!normalizedTarget || normalizedExisting === normalizedTarget) return normalizedExisting;
            }
            for (const key of ROW_URI_KEYS) {
                if (key === 'item') continue;
                const normalized = assignValue(row[key]);
                if (normalized && (!normalizedTarget || normalized === normalizedTarget)) return normalized;
            }
            if (normalizedTarget) {
                for (const value of Object.values(row)) {
                    const normalized = assignValue(value);
                    if (normalized === normalizedTarget) return normalized;
                }
            }
            return row.__normalizedItem || '';
        }

        // Chart.js loader (must be defined before any passive rendering attempts)
        // Chart.js is shipped under /vendors/chart.js/ via public/ static mount
        const CHART_JS_SRC = '/vendors/chart.js/chart.umd.js';
        console.log('Melody item sidebar Chart.js source:', CHART_JS_SRC);
        let chartLoaderPromise = null;
        let timelinePluginRegistered = false;

        function resolveLang(...candidates) {
            for (const candidate of candidates) {
                if (candidate == null) continue;
                const normalized = String(candidate).trim().toLowerCase();
                if (!normalized) continue;
                if (normalized.startsWith('en')) return 'en';
                if (normalized.startsWith('it')) return 'it';
                if (normalized.length >= 2) return normalized.slice(0, 2);
            }
            return DEFAULT_LANG;
        }

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

        function createYearTransform(years, opts = {}) {
            if (!years.length) {
                return { forward: (value) => value, inverse: (value) => value };
            }
            if (opts.disableLogCompression) {
                return { forward: (value) => value, inverse: (value) => value };
            }
            const spanRaw = Number(opts.logThreshold);
            const span = Number.isFinite(spanRaw) && spanRaw > 0 ? spanRaw : 1000;
            const compressPos = Boolean(opts.logCompressPositive);
            const forward = (year) => {
                if (!Number.isFinite(year)) return NaN;
                if (year < -span) {
                    const ratio = Math.max(1, (-year) / span);
                    return -1 - Math.log10(ratio);
                }
                if (compressPos && year > span) {
                    const ratio = Math.max(1, year / span);
                    return 1 + Math.log10(ratio);
                }
                return year / span;
            };
            const inverse = (value) => {
                if (!Number.isFinite(value)) return NaN;
                if (value < -1) {
                    const ratio = Math.pow(10, -(value + 1));
                    return -span * ratio;
                }
                if (compressPos && value > 1) {
                    const ratio = Math.pow(10, value - 1);
                    return span * ratio;
                }
                return value * span;
            };
            return { forward, inverse };
        }

        function chooseBinSize(minYear, maxYear, opts = {}) {
            const range = Math.max(0, (maxYear ?? 0) - (minYear ?? 0) + 1);
            const target = Math.max(4, Number(opts.targetBins) || 64);
            const minBins = Math.max(3, Number(opts.minBins) || 24);
            const maxBins = Math.max(minBins, Number(opts.maxBins) || 128);
            const candidates = Array.isArray(opts.allowed)
                ? opts.allowed
                : [
                    0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5,
                    1, 2, 5, 10, 20, 25, 50, 75, 100,
                    200, 250, 500, 1000, 2000, 2500, 5000, 7500, 10000,
                    20000, 25000, 50000, 100000, 200000, 250000, 500000,
                    1000000, 2000000, 2500000, 5000000,
                    10000000, 20000000, 25000000, 50000000,
                    100000000, 200000000, 250000000, 500000000,
                    1000000000
                ];
            if (!range || range <= 1) return 1;
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

        function processToBins(data, opts = {}) {
            const langPref = resolveLang(opts.lang);
            const years = [];
            let actualMin = Infinity;
            let actualMax = -Infinity;
            for (const obj of data) {
                const by = pickYear(obj.beginYear, obj.begin, obj?.begin?.value, obj.start, obj.dateBegin, obj.from);
                let ey = pickYear(obj.endYear, obj.end, obj?.end?.value, obj.finish, obj.dateEnd, obj.to);
                if (!Number.isFinite(by)) continue;
                if (!Number.isFinite(ey)) ey = by;
                actualMin = Math.min(actualMin, by, ey);
                actualMax = Math.max(actualMax, by, ey);
                years.push(representativeYear(by, ey));
            }
            if (!years.length || !Number.isFinite(actualMin) || !Number.isFinite(actualMax)) {
                return {
                    starts: [],
                    labels: [],
                    counts: [],
                    maxCount: 0,
                    minYear: null,
                    maxYear: null,
                    binSize: 0,
                    ranges: []
                };
            }
            const preferExactBins = Boolean(opts.preferExactBins);
            const transform = createYearTransform(years, opts);
            const transformedYears = years.map(transform.forward).filter(Number.isFinite);
            if (!transformedYears.length) {
                return {
                    starts: [],
                    labels: [],
                    counts: [],
                    maxCount: 0,
                    minYear: null,
                    maxYear: null,
                    binSize: 0,
                    ranges: []
                };
            }
            const minTrans = Math.min(...transformedYears);
            const maxTrans = Math.max(...transformedYears);
            const binSize = chooseBinSize(minTrans, maxTrans, opts);
            const bucketCount = Math.max(1, Math.ceil((maxTrans - minTrans) / binSize));
            const countsByBucket = new Array(bucketCount + 1).fill(0);
            for (const value of transformedYears) {
                const idx = Math.max(0, Math.min(bucketCount, Math.floor((value - minTrans) / binSize)));
                countsByBucket[idx] = (countsByBucket[idx] || 0) + 1;
            }
            const starts = [];
            const labels = [];
            const counts = [];
            const ranges = [];
            for (let idx = 0; idx <= bucketCount; idx++) {
                const startTrans = minTrans + idx * binSize;
                const endTrans = Math.min(maxTrans, startTrans + binSize);
                let startActual = transform.inverse(startTrans);
                let endActual = transform.inverse(endTrans);
                if (Number.isFinite(startActual)) startActual = Math.max(actualMin, Math.min(actualMax, startActual));
                if (Number.isFinite(endActual)) endActual = Math.max(actualMin, Math.min(actualMax, endActual));
                if (Number.isFinite(startActual) && Number.isFinite(endActual) && endActual < startActual) {
                    const tmp = startActual;
                    startActual = endActual;
                    endActual = tmp;
                }
                starts.push(startActual);
                labels.push(makeBinLabel(startActual, endActual, preferExactBins, langPref));
                counts.push(countsByBucket[idx] || 0);
                ranges.push({ start: startActual, end: endActual });
            }
            const maxCount = counts.length ? Math.max(...counts) : 0;
            return { starts, labels, counts, maxCount, minYear: actualMin, maxYear: actualMax, binSize, ranges };
        }

        function buildEqualWidthDatasets(starts, labels, counts, maxCount, highlightIndex, opts = {}) {
            const datasets = [];
            const rgbWhite = hexToRgb('#fdf9fb');
            const rgbAccent = hexToRgb('#A62176');
            const denom = maxCount > 0 ? maxCount : 1;
            const displayLabels = Array.isArray(opts.displayLabels) && opts.displayLabels.length === labels.length
                ? opts.displayLabels
                : labels;
            const rangeLabels = Array.isArray(opts.rangeLabels) && opts.rangeLabels.length === labels.length
                ? opts.rangeLabels
                : labels;
            for (let i = 0; i < starts.length; i++) {
                const c = counts[i];
                const t = c / denom;
                const isHighlight = i === highlightIndex;
                const baseRgb = lerpColorRGB(rgbWhite, rgbAccent, t || 0);
                const backgroundColor = rgbToCss(baseRgb, isHighlight ? 1 : 0.85);
                const label = displayLabels[i] ?? labels[i];
                datasets.push({
                    label,
                    data: [1],
                    backgroundColor,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    stack: 'timeline',
                    clip: false,
                    _realCount: c,
                    _isHighlight: isHighlight,
                    _rangeLabel: rangeLabels[i] ?? label
                });
            }
            return datasets;
        }

        function dedupeTimelineRows(rows, normalizedTarget = '') {
            const seen = new Set();
            const out = [];
            for (const r of rows) {
                const normalizedItem = ensureRowItem(r, normalizedTarget);
                const item = r.item || r.id || r.uri;
                const begin = r.begin ?? r.start ?? r.dateBegin ?? r.from;
                const end = r.end ?? r.finish ?? r.dateEnd ?? r.to ?? begin;
                if (!begin) continue;
                const key = normalizedItem ? `item:${normalizedItem}` : (item ? `item:${normalizeRef(item)}` : `range:${begin}|${end}`);
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
                const entry = byKey.get(key) || { item: item || null, minY: Infinity, maxY: -Infinity, minRaw: null, maxRaw: null };
                const by = getYearUTC(beginRaw);
                const ey = getYearUTC(endRaw);
                if (Number.isFinite(by)) {
                    if (!(Number.isFinite(entry.minY)) || by < entry.minY) {
                        entry.minY = by;
                        entry.minRaw = beginRaw;
                    }
                }
                if (Number.isFinite(ey)) {
                    if (!(Number.isFinite(entry.maxY)) || ey > entry.maxY) {
                        entry.maxY = ey;
                        entry.maxRaw = endRaw;
                    }
                }
                byKey.set(key, entry);
            }
            const result = [];
            for (const value of byKey.values()) {
                if (!Number.isFinite(value.minY) || !Number.isFinite(value.maxY)) continue;
                const beginISO = safeIsoFromYear(value.minY) ?? (value.minRaw != null ? String(value.minRaw) : null) ?? String(value.minY);
                const endISO = safeIsoFromYear(value.maxY, { endOfYear: true }) ?? (value.maxRaw != null ? String(value.maxRaw) : null) ?? String(value.maxY);
                result.push({ item: value.item, begin: beginISO, end: endISO, beginYear: value.minY, endYear: value.maxY });
            }
            return result;
        }

        function filterRowsByRange(rows, range) {
            if (!Array.isArray(rows) || !rows.length || !range) return [];
            const start = Number(range.start);
            const end = Number(range.end);
            if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
            const minRange = Math.min(start, end);
            const maxRange = Math.max(start, end);
            return rows.filter(r => {
                const beginYear = Number.isFinite(r.beginYear) ? r.beginYear : getYearUTC(r.begin);
                let endYear = Number.isFinite(r.endYear) ? r.endYear : getYearUTC(r.end ?? r.begin);
                if (!Number.isFinite(beginYear)) return false;
                if (!Number.isFinite(endYear)) endYear = beginYear;
                const rowStart = Math.min(beginYear, endYear);
                const rowEnd = Math.max(beginYear, endYear);
                return rowEnd >= minRange && rowStart <= maxRange;
            });
        }

        function findHighlightIndex(rows, ranges, normalizedTarget) {
            if (!normalizedTarget || !Array.isArray(ranges) || !ranges.length) return -1;
            const match = rows.find(r => ensureRowItem(r, normalizedTarget) === normalizedTarget);
            if (!match) return -1;
            const beginYear = Number.isFinite(match.beginYear) ? match.beginYear : getYearUTC(match.begin);
            let endYear = Number.isFinite(match.endYear) ? match.endYear : getYearUTC(match.end ?? match.begin);
            if (!Number.isFinite(beginYear)) return -1;
            if (!Number.isFinite(endYear)) endYear = beginYear;
            const year = representativeYear(beginYear, endYear);
            if (!Number.isFinite(year)) return -1;
            return ranges.findIndex(range => {
                if (!range) return false;
                const start = Number.isFinite(range.start) ? range.start : year;
                const end = Number.isFinite(range.end) ? range.end : start;
                return year >= Math.min(start, end) && year <= Math.max(start, end);
            });
        }

        function renderTimelineChart(canvas, rawRows, itemUri, lang = globalTimelineLang || DEFAULT_LANG, blockTitle = '') {
            const normalizedTarget = itemUri ? normalizeRef(itemUri) : '';
            const deduped = dedupeTimelineRows(rawRows, normalizedTarget);
            const normalized = normalizeTimelineRows(deduped);
            if (!normalized.length) return;
            let rowsForChart = normalized;
            let bucketed = processToBins(rowsForChart, { lang, disableLogCompression: false });
            if (!bucketed.starts.length) return;
            let { starts, labels, counts, maxCount, ranges } = bucketed;
            const approxDetailBins = Math.min(32, Math.max(12, (ranges?.length || 16)));
            let usingDetailBins = false;
            const initialHighlight = findHighlightIndex(rowsForChart, ranges, normalizedTarget);
            if (initialHighlight >= 0 && ranges && ranges[initialHighlight]) {
                console.log('melody_item: attempting detail bins for range', ranges[initialHighlight]);
                const detailRows = filterRowsByRange(normalized, ranges[initialHighlight]);
                console.log('melody_item: detail rows count', detailRows.length);
                if (detailRows.length > 3) {
                    const detailBucketed = processToBins(detailRows, {
                        targetBins: approxDetailBins,
                        minBins: 8,
                        maxBins: 30,
                        preferExactBins: true,
                        lang,
                        disableLogCompression: true
                    });
                    console.log('melody_item: detail bin results', {
                        starts: detailBucketed.starts ? detailBucketed.starts.length : 0,
                        binSize: detailBucketed.binSize,
                        minYear: detailBucketed.minYear,
                        maxYear: detailBucketed.maxYear
                    });
                    if (detailBucketed.starts.length) {
                        rowsForChart = detailRows;
                        bucketed = detailBucketed;
                        console.log('melody_item: using detail bins for rendering');
                        ({ starts, labels, counts, maxCount, ranges } = detailBucketed);
                        usingDetailBins = true;
                    }
                }
            }
            if (!starts.length) return;
            const highlightIndex = findHighlightIndex(rowsForChart, ranges, normalizedTarget);
            const rangeLabels = ranges && ranges.length
                ? ranges.map(r => formatRangeLabel(r?.start, r?.end, lang, usingDetailBins))
                : labels;
            const globalStartLabel = ranges.length
                ? formatSingleYearLabel(ranges[0]?.start, lang, usingDetailBins)
                : '';
            const globalEndLabel = ranges.length
                ? formatSingleYearLabel(ranges[ranges.length - 1]?.end, lang, usingDetailBins)
                : '';
            console.log('melody_item: final bins', ranges);
            const datasets = buildEqualWidthDatasets(
                starts,
                labels,
                counts,
                maxCount || 0,
                highlightIndex,
                { displayLabels: rangeLabels, rangeLabels }
            );
            console.log('melody_item: chart bins', labels.length, 'rows', rowsForChart.length, 'highlight', highlightIndex);

            ensureTimelinePlugins();
            if (typeof Chart === 'undefined') return;

            const ctx = canvas.getContext('2d');
            if (canvas._chart) canvas._chart.destroy();
            canvas.style.height = canvas.dataset.height || '160px';

            const n = labels.length;
            const tickEvery = Math.max(1, Math.ceil(n / 10));
            canvas._chart = new Chart(ctx, {
                type: 'bar',
                data: { labels: [''], datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    layout: { padding: 8 },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0,
                            max: n,
                            stacked: true,
                            position: 'top',
                            ticks: {
                                stepSize: 1,
                                autoSkip: false,
                                callback: (val) => {
                                    const idx = Math.round(val - 0.5);
                                    if (!(idx >= 0 && idx < n)) return '';
                                    if (idx === 0) return globalStartLabel || '';
                                    if (idx === n - 1) return globalEndLabel || '';
                                    return '';
                                },
                                maxRotation: 0,
                                minRotation: 0,
                                align: 'inner',
                                crossAlign: 'center',
                                padding: 12
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
                                title: items => {
                                    const dataset = items[0]?.dataset || {};
                                    return blockTitle || dataset._rangeLabel || dataset.label || '';
                                },
                                label: (item) => {
                                    const dataset = item.dataset || {};
                                    const count = dataset._realCount ?? 0;
                                    const isItalian = String(lang || '').toLowerCase().startsWith('it');
                                    if (dataset._isHighlight) {
                                        return isItalian
                                            ? [
                                                'Questo oggetto appartiene a questo periodo.',
                                                `${count} oggetti provengono da questo periodo.`
                                            ]
                                            : [
                                                'This object belongs to this period.',
                                                `${count} other objects come from this period.`
                                            ];
                                    }
                                    return isItalian
                                        ? `${count} oggetti provengono da questo periodo.`
                                        : `${count} objects come from this period.`;
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
            if (!rootEl) return;
            const itemUri = (cfgObj && cfgObj.ITEM_URI) || rootEl.dataset.itemUri || (window.MELODY_CONFIG && window.MELODY_CONFIG.ITEM_URI) || '';
            const blocks = Array.from(rootEl.querySelectorAll('.melody-data-viz'));
            console.log('melody_item: found viz blocks', blocks.length, 'itemUri set:', !!itemUri);
            if (!blocks.length) return;
            const normalizedTarget = itemUri ? normalizeRef(itemUri) : '';
            const pending = [];
            for (const block of blocks) {
                const canvas = block.querySelector('canvas');
                const rawCfg = block.dataset.config;
                if (!canvas || !rawCfg) continue;
                const parsed = parseJsonSafe(rawCfg);
                console.log('melody_item: block config parsed', parsed);
                const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
                if (!rows.length) continue;
                const blockItemUri = parsed?.item_uri || parsed?.itemUri || itemUri;
                const blockNormalizedTarget = blockItemUri ? normalizeRef(blockItemUri) : normalizedTarget;
                const encodingCfg = parsed?.encoding || parsed?.encodings || {};
                const blockLang = resolveLang(
                    encodingCfg?.language,
                    parsed?.language,
                    block.dataset?.lang,
                    globalTimelineLang
                );
                const blockTitle = typeof encodingCfg?.title === 'string' ? encodingCfg.title : '';
                const includesItem = blockNormalizedTarget ? rows.some(r => ensureRowItem(r, blockNormalizedTarget) === blockNormalizedTarget) : true;
                if (!includesItem) {
                    console.log('melody_item: block skipped (no match for ITEM_URI)'); const canvas = block.querySelector('canvas');
                    if (canvas) {
                        canvas.remove();
                    }
                } else {
                    const titleEl = document.querySelector('.melody-data-viz-title');
                    if (titleEl) titleEl.style.removeProperty('display');
                }
                pending.push({ canvas, rows, itemUri: blockItemUri || itemUri, lang: blockLang, title: blockTitle || parsed?.title || '' });
            }
            console.log('melody_item: pending charts to render', pending.length); if (!pending.length) return;
            try {
                await ensureChartJS();
            } catch (err) {
                console.warn('Chart.js not available for melody visualization', err);
                return;
            }
            for (const { canvas, rows, itemUri: blockTarget, lang, title: blockTitle } of pending) {
                try {
                    renderTimelineChart(canvas, rows, blockTarget || itemUri, lang || globalTimelineLang, blockTitle || '');
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
