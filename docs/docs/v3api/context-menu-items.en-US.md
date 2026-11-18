---
title: Item Types and Native Actions
order: 2
sidebar_parent: Page Context Menu
group:
  title: Menus
  order: 3.5
---

# Item Types and Native Actions

Each row of a page context-menu template has a `kind` and may bind an action through `role`. See [Page Context Menu](/en-US/docs/v3api/context-menu-api) for the full API and examples.

## Item kinds

| kind | Type | Description | Platform |
|---:|---|---|---|
| 0 | Command | Performs an action; without `role` it reports `context-menu-click` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 1 | Submenu | Children point to its `id` through `parent_id` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 2 | Separator | Not clickable | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 3 | Checkbox | Toggles checked state; `flags` bit 1 means checked | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 4 | Radio | Mutually exclusive in its group; `flags` bit 1 means checked | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

`role` applies to commands, checkboxes, and radios only; submenus and separators do not need it.

## Actions (`role`)

### Editing

| Action | role | Platform |
|---|---|---|
| Undo | `undo` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Redo | `redo` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Cut | `cut` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy | `copy` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Paste | `paste` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Paste as plain text | `pasteAndMatchStyle` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Delete | `delete` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Select all | `selectAll` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Emoji | `emoji` | ![Windows](/platform-windows.svg) |

### Navigation

| Action | role | Platform |
|---|---|---|
| Back | `back` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Forward | `forward` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Reload | `reload` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Force reload | `forceReload` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

### Page

| Action | role | Platform |
|---|---|---|
| Print | `print` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Save as | `saveAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| View source | `viewSource` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Inspect element | `inspectElement` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| DevTools | `toggleDevTools` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Zoom in | `zoomIn` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Zoom out | `zoomOut` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Reset zoom | `resetZoom` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Toggle full screen | `togglefullscreen` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Minimize | `minimize` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Close window | `close` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Quit | `quit` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

### Link

| Action | role | Platform |
|---|---|---|
| Open in new window | `openLinkInNewWindow` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Save link as | `saveLinkAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy link | `copyLink` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy link to highlight | `copyLinkToHighlight` | ![Windows](/platform-windows.svg) |

### Image

| Action | role | Platform |
|---|---|---|
| Save image as | `saveImageAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy image | `copyImage` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy image address | `copyImageAddress` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Magnify image | `magnifyImage` | ![Windows](/platform-windows.svg) |
| Share | `share` | ![Windows](/platform-windows.svg) |

### Media

| Action | role | Platform |
|---|---|---|
| Save media as | `saveMediaAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Copy link | `copyLink` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Show/hide controls | `toggleMediaControls` | ![Linux](/platform-linux.svg) |

The platform column shows availability; other platforms are disabled. `role` names ignore case and separators.
