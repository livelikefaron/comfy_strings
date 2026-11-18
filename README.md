# Cast Presets for ComfyUI

Two nodes, category **Cast Presets**. They let you save named groups of prompt text inside the graph and pick one from a dropdown. Nothing reads or writes text files. The text is stored in the nodes, so it's saved with the workflow and comes along when you copy and paste.

Flow: **strings → String Set → (chain) → String Set Picker (dropdown) → strings**

## The nodes

**String Set**
- `name`: what appears in the dropdown, e.g. `Example Character - Casual`.
- `string_1` … `string_6`: any text you like, e.g. identity, hair, face, body, outfit, shoes. Leave unused boxes empty.
- `previous` (optional input) / `sets` (output): connect one String Set's `sets` output into the next one's `previous` input to build a list. Each set adds itself to the end of the list.

**String Set Picker**
- `sets` input: connect the **last** String Set in the chain.
- `parent` dropdown: lists the names of every set in the chain. It updates by itself when you rename, add, connect or disconnect sets.
- `separator`: what goes between pieces in `joined` (default `, `).
- Outputs: `name`, `string_1` … `string_6` (the picked set's boxes exactly as typed, with leading and trailing spaces trimmed), and `joined` (all the non-empty boxes in order, separated by `separator`; trailing `,` or `;` is removed from each piece so you don't get doubled commas).

## Adding a character or outfit
1. Copy and paste an existing String Set (Ctrl+C / Ctrl+V), or add one from the menu at Cast Presets → String Set.
2. Give it a new name and fill in the boxes. For different outfits, make one set per outfit, e.g. `Example Character - Casual` and `Example Character - Formal`.
3. Connect the previous last set's `sets` output to its `previous` input, then connect its `sets` output to the Picker. The new name appears in the dropdown.

If two sets have the same name, the first one in the chain wins. Give every set its own name.

## Wiring into a prompt
- **CLIPTextEncode / TextEncodeQwenImage21**: drag from the Picker's `joined` output (or a single `string_N`) onto the encoder's `text` box. The box becomes an input.
- **Mixing with your own text**: use core **String Concatenate** (`string_a`, `string_b`, `delimiter`), or KJNodes **Join String Multi** for several pieces. For example, `string_a` = Picker `joined` and `string_b` = your scene or pose text.
- Two characters in one prompt: use two Pickers on the same chain, then concatenate their outputs.

## Moving it between workflows
Select the String Sets **and** the Picker, copy, and paste into the other workflow. The text and the dropdown choice come with them. A Picker pasted alone keeps its chosen name, but it needs a set chain connected before it can run.

## Notes
- If the picked name isn't in the connected chain when you queue (for example, you deleted that set), the run stops with a message listing the names that are available.
- `example_workflows/string_sets_example.json` has a two-set placeholder example you can drag onto the canvas.
- Tested on ComfyUI v0.44.0 with frontend 1.57.6. No pip requirements. MIT license.
