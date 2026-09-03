---
title: Cache Directory Cleanup
order: 3
group:
  title: "Core Concepts"
  order: 2
---

# EBWebView Cache Directory Cleanup Report

## 1. Purpose of This Report

This report aims to guide developers and operations personnel in safely cleaning up the temporary cache files under the EBWebView directory, optimizing storage usage and improving WebView performance without affecting core functionality and persistent data.

## 2. Cleanup Principles

Without removing **persistent data** (such as configuration, login state, and core functional data), only delete **various temporary caches, crash reports, trial data, and rendering caches** and other non-core files/folders. Core persistent files/folders must be strictly preserved.

## 3. Content That Can Be Safely Deleted

### 3.1 Folders (all temporary caches / non-core data)

| Folder Name | Type | Description |
|---------|------|------|
| AutoLaunchProtocolsComponent | Temporary cache | Auto-launch protocol component cache |
| CertificateRevocation | Temporary cache | Certificate revocation list cache |
| component_crx_cache | Temporary cache | Component CRX cache |
| Crashpad | Crash report | Crash reports and dump files |
| Domain Actions | Temporary cache | Domain action cache |
| extensions_crx_cache | Temporary cache | Extension CRX cache |
| GraphiteDawnCache | Rendering cache | Graphics rendering cache |
| GrShaderCache | Shader cache | Graphics shader cache |
| hyphen-data | Temporary cache | Hyphenation data cache |
| MEIPreload | Temporary cache | MEI preload data |
| OriginTrials | Trial data | Origin trial feature cache |
| PKIMetadata | Temporary cache | PKI metadata cache |
| ShaderCache | Shader cache | WebGL shader cache |
| SmartScreen | Temporary cache | SmartScreen filter cache |
| Speech Recognition | Speech cache | Speech recognition feature cache |
| Subresource Filter | Filter cache | Subresource filtering rules cache |
| Trust Protection Lists | Temporary cache | Trust protection list cache |
| TrustTokenKeyCommitments | Temporary cache | Trust token key commitments cache |

### 3.2 Files (temporary / cache type)

| File Name | Type | Description |
|-------|------|------|
| Last Version | Temporary file | Last version record |
| RevisitationBloomfilter | Cache file | Page revisitation Bloom filter |
| Variations | Temporary file | Feature variation configuration |

## 4. Core Persistent Data That Must Not Be Deleted

| File/Folder Name | Type | Description | Risk |
|---------------|------|------|------|
| **Local State** | Configuration file | WebView core local configuration file, containing settings, preferences, and other persistent information | Deletion will lose all WebView configurations |
| **WidevineCdm** | Core module | DRM content decryption module | Deletion will prevent protected videos (such as certain online streaming media) from playing |
| **Default** | User data | Default user data directory (containing persistent data such as Cookies, LocalStorage, IndexedDB) | Deleting the entire folder is prohibited; only internal cache subdirectories may be deleted |

### 4.1 Default Directory Cleanup Recommendations

Although the Default directory must not be deleted as a whole, some of its subdirectories can be safely cleaned up:

| Default Subdirectory | Cleanup Status | Description |
|---------------|------------|------|
| Cache | ✅ Cleanable | Page resource cache |
| Code Cache | ✅ Cleanable | JavaScript code cache |
| GPUCache | ✅ Cleanable | GPU acceleration cache |
| Media Cache | ✅ Cleanable | Media resource cache |
| Service Worker/CacheStorage | ✅ Cleanable | Service Worker cache |
| Cookies | ❌ Must not be cleaned | User login state data |
| Local Storage | ❌ Must not be cleaned | Local storage data |
| IndexedDB | ❌ Must not be cleaned | Indexed database |
| WebSQL | ❌ Must not be cleaned | Web SQL database |

## 5. Cleanup Impact Assessment

| Impact Category | Impact Level | Description |
|---------|----------|------|
| Core functionality | No impact | Only temporary caches are deleted, which does not affect WebView core functionality |
| Login state | No impact | Login state is usually stored in Cookies or LocalStorage and will not be cleaned |
| Configuration preferences | No impact | Core configuration files are protected and will not be cleaned |
| First-load performance | Minor impact | After cleanup, the first page load will re-download resources, with a brief impact |
| Storage space | Significant optimization | A large amount of storage space occupied by temporary caches can be freed |
| Privacy and security | Beneficial | Clearing caches can reduce the risk of privacy data leakage |

## 6. Cleanup Recommendations

1. **Periodic cleanup**: It is recommended to perform a cache cleanup every 1-3 months, adjusted according to application usage frequency
2. **On-demand cleanup**: When the application experiences performance issues or insufficient storage space, a temporary cleanup can be performed
3. **Automated cleanup**: Consider automatically cleaning up temporary caches at application startup or periodically in the background
4. **Selective cleanup**: Selectively clean up specific types of caches based on actual needs
5. **Backup recommendation**: Before performing a large-scale cleanup, it is recommended to back up core configuration files to prevent accidents

## 7. Cleanup Execution Methods

### 7.1 Manual Cleanup

1. Close all applications using EBWebView
2. Navigate to the EBWebView directory
3. Delete the safely cleanable files and folders according to this report
4. Restart the application; WebView will automatically regenerate the necessary cache files

### 7.2 Programmatic Cleanup

Automated cleanup can be implemented through the WebView API or the file system API.

JadeView also provides the programmatic entry point **`clear_data_directory(confirm_token)`**: when `confirm_token` equals `"I_UNDERSTAND_CLEAR_DATA"`, it **clears the entire data directory** (i.e. the `data_directory` passed to `JadeView_init`), returning `1` on success and `0` on failure or when the confirmation token does not match.

> ⚠️ Note the distinction: this API clears the **entire data directory** (including the "core persistent data that must not be deleted" listed above) and is a "reset/uninstall"-level operation. It is **not** the same as the EBWebView temporary-cache subdirectory cleanup described in this document. If you only want to reclaim space while preserving login state and configuration, follow Section 3 to manually/selectively clean the cache subdirectories and do not use `clear_data_directory`.

## 8. Notes

1. **Cleanup timing**: It is recommended to perform cleanup before application startup or when the background is idle
2. **Permission requirements**: Cleanup operations may require file system read/write permissions
3. **Cross-platform differences**: WebView cache structures may differ across platforms; adjust according to actual conditions
4. **Version compatibility**: Different versions of EBWebView may have different cache directory structures; pay attention to version updates
5. **Test verification**: Before deploying cleanup logic to a production environment, it is recommended to thoroughly verify it in a test environment
