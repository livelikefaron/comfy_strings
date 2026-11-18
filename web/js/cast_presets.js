// Cast Presets frontend: fills the String Set Picker's "parent" dropdown from the
// String Set nodes wired into it. Reads widget values only; no files, no server calls.
import { app } from "../../scripts/app.js";

const SET = "CastPresetsStringSet";
const PICKER = "CastPresetsStringSetPicker";
const PLACEHOLDER = "(connect a String Set)";

function widget(node, name) {
  return (node.widgets || []).find((w) => w.name === name);
}

function inputNode(node, inputName) {
  const slot = (node.inputs || []).findIndex((i) => i.name === inputName);
  if (slot < 0 || node.inputs[slot].link == null) return null;
  try { return node.getInputNode(slot); } catch (e) { return null; }
}

// Follow legacy Reroute nodes so routing through them still works.
function skipReroutes(node) {
  let guard = 0;
  while (node && node.type === "Reroute" && guard++ < 50) {
    node = node.inputs && node.inputs[0] && node.inputs[0].link != null ? node.getInputNode(0) : null;
  }
  return node;
}

// The name widget may have been turned into an input fed by a text node; read that node's text.
function readName(setNode) {
  const w = widget(setNode, "name");
  const src = inputNode(setNode, "name");
  if (src) {
    const sw = (src.widgets || []).find((x) => typeof x.value === "string");
    if (sw) return String(sw.value).trim();
  }
  return w ? String(w.value ?? "").trim() : "";
}

// Returns names in chain order (first set in the chain first), or null if nothing is connected.
function collectNames(picker) {
  let node = skipReroutes(inputNode(picker, "sets"));
  if (!node) return null;
  const names = [];
  const seen = new Set();
  while (node && node.type === SET && !seen.has(node.id)) {
    seen.add(node.id);
    names.unshift(readName(node));
    node = skipReroutes(inputNode(node, "previous"));
  }
  const out = [];
  for (const n of names) if (n && !out.includes(n)) out.push(n);
  return out;
}

function refreshPicker(picker) {
  const w = widget(picker, "parent");
  if (!w) return false;
  const names = collectNames(picker);
  let values;
  if (!names || names.length === 0) {
    // Nothing connected (or graph still loading): keep the saved choice visible and selectable.
    values = w.value && w.value !== PLACEHOLDER ? [w.value] : [PLACEHOLDER];
  } else {
    values = names;
    if (!names.includes(w.value)) {
      const last = picker.__castLastNames;
      const i = last ? last.indexOf(w.value) : -1;
      // A set was renamed: follow it to its new name. Otherwise fall back to the first set.
      const next = i >= 0 && last.length === names.length ? names[i] : names[0];
      w.value = next;
      if (w.callback) try { w.callback(next); } catch (e) {}
    }
    picker.__castLastNames = names.slice();
  }
  const old = w.options.values;
  if (!Array.isArray(old) || old.join("\u0000") !== values.join("\u0000")) {
    w.options.values = values;
    return true;
  }
  return false;
}

function graphs() {
  const out = new Set();
  if (app.graph) out.add(app.graph);
  if (app.canvas && app.canvas.graph) out.add(app.canvas.graph);
  return [...out];
}

function refreshAll() {
  let changed = false;
  for (const g of graphs()) {
    for (const n of g._nodes || g.nodes || []) {
      if (n.type === PICKER) changed = refreshPicker(n) || changed;
    }
    if (changed && g.setDirtyCanvas) g.setDirtyCanvas(true, true);
  }
}

let pending = null;
function scheduleRefresh() {
  if (pending) return;
  pending = setTimeout(() => { pending = null; try { refreshAll(); } catch (e) { console.warn("cast-presets", e); } }, 0);
}

app.registerExtension({
  name: "castPresets.stringSetPicker",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== SET && nodeData.name !== PICKER) return;
    if (nodeData.name === PICKER) {
      const onCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () {
        const r = onCreated ? onCreated.apply(this, arguments) : undefined;
        if (this.size && this.size[0] < 320) this.size[0] = 320; // room for long names
        return r;
      };
    }
    const onConn = nodeType.prototype.onConnectionsChange;
    nodeType.prototype.onConnectionsChange = function () {
      const r = onConn ? onConn.apply(this, arguments) : undefined;
      scheduleRefresh();
      return r;
    };
    const onChanged = nodeType.prototype.onWidgetChanged;
    nodeType.prototype.onWidgetChanged = function () {
      const r = onChanged ? onChanged.apply(this, arguments) : undefined;
      scheduleRefresh();
      return r;
    };
    const onRemoved = nodeType.prototype.onRemoved;
    nodeType.prototype.onRemoved = function () {
      const r = onRemoved ? onRemoved.apply(this, arguments) : undefined;
      scheduleRefresh();
      return r;
    };
  },
  afterConfigureGraph() { scheduleRefresh(); },
  nodeCreated() { scheduleRefresh(); },
  setup() {
    // Safety net: typing in a multiline/name box doesn't always fire an event, so re-check twice a second.
    setInterval(() => { try { refreshAll(); } catch (e) {} }, 500);
  },
});
