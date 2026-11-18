"""Two nodes: String Set (a named group of strings, chainable) and String Set Picker (dropdown -> strings)."""

SLOTS = 6
SET_TYPE = "STRING_SET_LIST"
PLACEHOLDER = "(connect a String Set)"


class StringSet:
    """A parent name plus up to 6 strings. Chain several via 'previous' to build a list."""

    @classmethod
    def INPUT_TYPES(cls):
        req = {"name": ("STRING", {"default": "Example Character", "multiline": False})}
        for i in range(1, SLOTS + 1):
            req[f"string_{i}"] = ("STRING", {"default": "", "multiline": True})
        return {"required": req, "optional": {"previous": (SET_TYPE,)}}

    RETURN_TYPES = (SET_TYPE,)
    RETURN_NAMES = ("sets",)
    FUNCTION = "build"
    CATEGORY = "Cast Presets"

    def build(self, name, previous=None, **strings):
        items = list(previous) if previous else []
        items.append({
            "name": str(name).strip(),
            "strings": [str(strings.get(f"string_{i}", "") or "") for i in range(1, SLOTS + 1)],
        })
        return (items,)


def _clean(s):
    return s.strip().rstrip(",;").strip()


class StringSetPicker:
    """Pick one String Set by name; outputs its strings separately and joined."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sets": (SET_TYPE,),
                # Options are filled in by the frontend from the connected String Set nodes.
                "parent": ([PLACEHOLDER],),
                "separator": ("STRING", {"default": ", ", "multiline": False}),
            }
        }

    RETURN_TYPES = ("STRING",) * (SLOTS + 2)
    RETURN_NAMES = ("name",) + tuple(f"string_{i}" for i in range(1, SLOTS + 1)) + ("joined",)
    FUNCTION = "pick"
    CATEGORY = "Cast Presets"

    @classmethod
    def VALIDATE_INPUTS(cls, parent):
        # The dropdown list is dynamic (built from the graph), so skip ComfyUI's fixed-list check.
        # The real check happens in pick(), against the sets actually connected.
        if not isinstance(parent, str) or not parent.strip():
            return "No parent selected"
        return True

    def pick(self, sets, parent, separator):
        target = parent.strip()
        match = next((s for s in (sets or []) if s["name"] == target), None)
        if match is None:
            names = ", ".join(repr(s["name"]) for s in (sets or [])) or "none"
            raise ValueError(f"String Set Picker: '{parent}' is not in the connected sets (available: {names})")
        strings = [s.strip() for s in match["strings"]]
        joined = separator.join(c for c in (_clean(s) for s in strings) if c)
        return (match["name"], *strings, joined)


NODE_CLASS_MAPPINGS = {
    "CastPresetsStringSet": StringSet,
    "CastPresetsStringSetPicker": StringSetPicker,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "CastPresetsStringSet": "String Set",
    "CastPresetsStringSetPicker": "String Set Picker",
}
