"""Cast Presets: keep named sets of prompt strings inside the graph and pick one from a dropdown.

All data lives in node widgets, so it is saved in the workflow JSON and travels with copy/paste.
No files are read or written.
"""
from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

WEB_DIRECTORY = "./web/js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
