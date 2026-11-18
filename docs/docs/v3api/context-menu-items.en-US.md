---
title: Item Types and Native Actions
order: 2
sidebar_parent: Page Context Menu
group:
  title: Menus
  order: 3.5
---

# Item Types and Native Actions

Each row of a page context-menu template has a `kind` and may bind a native action through `role` or `native_name`. See [Page Context Menu](/en-US/docs/v3api/context-menu-api) for the full API and examples.

## Item kinds

| kind | Type | Description |
|---:|---|---|
| 0 | Command | Performs an action; without `role`/`native_name` it reports `context-menu-click` |
| 1 | Submenu | Children point to its `id` through `parent_id` |
| 2 | Separator | Not clickable |
| 3 | Checkbox | Toggles checked state; `flags` bit 1 means checked |
| 4 | Radio | Mutually exclusive in its group; `flags` bit 1 means checked |

`role`/`native_name` apply to commands, checkboxes, and radios only; submenus and separators do not need them.

## Native actions

- `role`: a cross-platform action such as `copy`, `paste`, `print`, `reload`, or `toggleDevTools`. The runtime resolves the native item of the current context; if none exists it uses the fallback or disables the item.
- `native_name`: directly references the current platform's native item. Windows uses WebView2 names (below); Linux uses WebKitGTK `gio::Action` names such as `go-back`, `go-forward`, `reload`, `copy`, `cut`, `paste`, and `select-all`.

When the current context has no such native item, the item is disabled. Share and import-password items are filtered by default.

## Windows WebView2 native names

The data below was collected from actual WebView2 Runtime output; the list depends on the WebView2 version and the right-click context. `native_name` matches these names.

### Page background

| Name | Description | Type |
|---|---|---|
| `back` | Back | Command |
| `forward` | Forward | Command |
| `reload` | Reload | Command |
| `saveAs` | Save as | Command |
| `print` | Print | Command |
| `moreTools` | More tools | Submenu |
| `inspectElement` | Inspect | Command |

### Selected text

| Name | Description | Type |
|---|---|---|
| `copy` | Copy | Command |
| `copyLinkToHighlight` | Copy link to highlight | Command |
| `print` | Print | Command |
| `moreTools` | More tools | Submenu |
| `inspectElement` | Inspect | Command |

### Editable area

| Name | Description | Type |
|---|---|---|
| `emoji` | Emoji | Command |
| `undo` | Undo | Command |
| `redo` | Redo | Command |
| `cut` | Cut | Command |
| `copy` | Copy | Command |
| `paste` | Paste | Command |
| `pasteAndMatchStyle` | Paste and match style | Command |
| `selectAll` | Select all | Command |
| `moreTools` | More tools | Submenu |
| `inspectElement` | Inspect | Command |

### Link

| Name | Description | Type |
|---|---|---|
| `openLinkInNewWindow` | Open link in new window | Command |
| `saveLinkAs` | Save link as | Command |
| `copyLinkLocation` | Copy link | Command |
| `moreTools` | More tools | Submenu |
| `inspectElement` | Inspect | Command |

### Image

| Name | Description | Type |
|---|---|---|
| `saveImageAs` | Save image as | Command |
| `copyImage` | Copy image | Command |
| `copyImageLocation` | Copy image address | Command |
| `magnifyImage` | Magnify image | Command |
| `share` | Share (filtered by default) | Command |
| `inspectElement` | Inspect | Command |

### Video / audio

| Name | Description | Type |
|---|---|---|
| `saveMediaAs` | Save media as | Command |
| `copyLink` | Copy link | Command |
| `inspectElement` | Inspect | Command |

## Full name index

| Name | Description | Context |
|---|---|---|
| `back` | Back | Page |
| `forward` | Forward | Page |
| `reload` | Reload | Page |
| `cut` | Cut | Editable |
| `copy` | Copy | Selection / editable |
| `paste` | Paste | Editable |
| `pasteAndMatchStyle` | Paste and match style | Editable |
| `selectAll` | Select all | Editable |
| `undo` | Undo | Editable |
| `redo` | Redo | Editable |
| `emoji` | Emoji | Editable |
| `saveAs` | Save as | Page |
| `saveLinkAs` | Save link as | Link |
| `saveImageAs` | Save image as | Image |
| `saveMediaAs` | Save media as | Video / audio |
| `copyImage` | Copy image | Image |
| `copyImageLocation` | Copy image address | Image |
| `copyLinkLocation` | Copy link | Link |
| `copyLink` | Copy link | Video / audio |
| `copyLinkToHighlight` | Copy link to highlight | Selection |
| `openLinkInNewWindow` | Open link in new window | Link |
| `print` | Print | Page / selection |
| `inspectElement` | Inspect | All contexts |
| `moreTools` | More tools (submenu) | Most contexts |
| `magnifyImage` | Magnify image | Image |
| `share` | Share (filtered by default) | Most contexts |
| `spellCheck` | Spell check (submenu) | Editable, depends on WebView2 |
| `extension` | Extensions (submenu) | Depends on installed extensions |

> `share` and import-password items are filtered by default; implement similar behavior yourself if needed.
