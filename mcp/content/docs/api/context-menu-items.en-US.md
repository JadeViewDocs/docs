---
title: Menu Item Types & Native Menu Items
order: 4
group:
  title: Native UI
  order: 4
---

# Menu Item Types & Native Menu Items

## kind Parameter

When creating a menu item, the `kind` parameter specifies the menu item's type and behavior.

| kind | Type | Behavior |
|------|------|------|
| 0 | Normal command | Triggers the callback on click and performs the action |
| 1 | Separator | Visual separation, not clickable |
| 2 | Checkbox | Has a checked state; click toggles the check |
| 3 | Radio | Mutually exclusive selection within the same group; click selects the item |
| 4 | Submenu | Expands the sub-level menu |
| **5** | **Default menu item** | **WebView2 native operation, fires no event** |

When `kind=5`, the `label` parameter is set to the Name of a WebView2 default menu item; on click WebView2 performs the native operation and **does not fire the `menu-item-clicked` event**.

> The following data is collected from the actual runtime output of the WebView2 Runtime. For some menu items (separators, extension-injected items, etc.) WebView2 does not expose a programmatic Name (returns `"other"`); such items cannot be referenced via `jade_menu_item_create(kind=5)` and have been excluded from the list.

---

## Native Menu Item Name List

### Categorized by Context Menu Context

#### Page blank area (kind=page)

| Name | Label | Type |
|------|-------|------|
| `back` | Back(&B) | Command |
| `forward` | Forward(&F) | Command |
| `reload` | Reload(&R) | Command |
| separator | | Separator |
| `saveAs` | Save as(&A) | Command |
| `print` | Print(&P) | Command |
| separator | | Separator |
| `moreTools` | More tools(&L) | Submenu |
| ↳ `share` | Share(&S) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Selected text (kind=selected_text)

| Name | Label | Type |
|------|-------|------|
| `copy` | Copy(&C) | Command |
| `copyLinkToHighlight` | Copy link to highlight | Command |
| `print` | Print(&P) | Command |
| separator | | Separator |
| `moreTools` | More tools(&L) | Submenu |
| ↳ `share` | Share(&S) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Editable area (is_editable=true)

| Name | Label | Type |
|------|-------|------|
| `emoji` | Emoji(&E) | Command |
| separator | | Separator |
| `undo` | Undo(&U) | Command |
| `redo` | Redo(&R) | Command |
| separator | | Separator |
| `cut` | Cut(&T) | Command |
| `copy` | Copy(&C) | Command |
| `paste` | Paste(&P) | Command |
| `pasteAndMatchStyle` | Paste as plain text(&A) | Command |
| `selectAll` | Select all(&A) | Command |
| separator | | Separator |
| `moreTools` | More tools(&L) | Submenu |
| ↳ `share` | Share(&S) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Link (has_link=true)

| Name | Label | Type |
|------|-------|------|
| `openLinkInNewWindow` | Open link in new window(&W) | Command |
| separator | | Separator |
| `saveLinkAs` | Save link as(&K) | Command |
| `copyLinkLocation` | Copy link(&O) | Command |
| separator | | Separator |
| `moreTools` | More tools(&L) | Submenu |
| ↳ `share` | Share(&S) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Image (kind=image)

| Name | Label | Type |
|------|-------|------|
| `saveImageAs` | Save image as(&V) | Command |
| `copyImage` | Copy image(&Y) | Command |
| `copyImageLocation` | Copy image link(&M) | Command |
| separator | | Separator |
| `moreTools` | More tools(&L) | Submenu |
| ↳ `magnifyImage` | Magnify image(&M) | Command |
| ↳ `share` | Share(&S) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Video (kind=video)

| Name | Label | Type |
|------|-------|------|
| `saveMediaAs` | Save video as | Command |
| `copyLink` | Copy link(&O) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

#### Audio (kind=audio)

| Name | Label | Type |
|------|-------|------|
| `saveMediaAs` | Save audio as(&V) | Command |
| `copyLink` | Copy link(&O) | Command |
| separator | | Separator |
| `inspectElement` | Inspect(&N) | Command |

### Complete Name Index

| # | Name | Description | Appears in |
|---|------|------|----------|
| 1 | `back` | Back | Page |
| 2 | `forward` | Forward | Page |
| 3 | `reload` | Reload | Page |
| 4 | `cut` | Cut | Editable area |
| 5 | `copy` | Copy | Selected text / Editable area |
| 6 | `paste` | Paste | Editable area |
| 7 | `pasteAndMatchStyle` | Paste as plain text | Editable area |
| 8 | `selectAll` | Select all | Editable area |
| 9 | `undo` | Undo | Editable area |
| 10 | `redo` | Redo | Editable area |
| 11 | `emoji` | Emoji | Editable area |
| 12 | `saveAs` | Save as | Page |
| 13 | `saveLinkAs` | Save link as | Link |
| 14 | `saveImageAs` | Save image as | Image |
| 15 | `saveMediaAs` | Save media as | Video / Audio |
| 16 | `copyImage` | Copy image | Image |
| 17 | `copyImageLocation` | Copy image address | Image |
| 18 | `copyLinkLocation` | Copy link | Link |
| 19 | `copyLink` | Copy link | Video / Audio |
| 20 | `copyLinkToHighlight` | Copy link to highlight | Selected text |
| 21 | `openLinkInNewWindow` | Open link in new window | Link |
| 22 | `print` | Print | Page / Selected text |
| 23 | `inspectElement` | Inspect element | All contexts |
| 24 | `moreTools` | More tools (submenu) | Most contexts |
| 25 | `magnifyImage` | Magnify image | Image (moreTools subitem) |
| 26 | `share` | Share | Most contexts (moreTools subitem) |
| 27 | `spellCheck` | Spell check (submenu) | Editable area (depends on WebView2 version) |
| 28 | `extension` | Extension (submenu) | Depends on installed extensions |

:::warning
The Name list depends on the WebView2 Runtime version and the context menu context; some items are only available in specific contexts (e.g. `copy` only exists when text is selected). If the specified Name does not exist in the current context menu context, `jade_menu_item_create` returns `0`. The `default_menu_names` field of the [context-menu](/en-US/docs/api/context-menu-api) event returns the complete list actually available in the current context menu context.
:::
