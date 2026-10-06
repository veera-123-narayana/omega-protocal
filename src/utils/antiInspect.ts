/**
 * SYSTEM OMEGA - Anti-Inspect & Source Code Tamper Guard
 * Strictly restricts browser DevTools inspection, right-click context menu,
 * and key shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U) to preserve event integrity.
 */

type WarningCallback = (msg: string) => void;
let onWarningTriggered: WarningCallback | null = null;

export function registerSecurityWarningCallback(cb: WarningCallback) {
  onWarningTriggered = cb;
}

export function initAntiInspectSecurity() {
  if (typeof window === 'undefined') return;

  const triggerSecurityAlert = (reason: string) => {
    const alertMsg = `⚠️ RESTRICTED ACTION: ${reason}. Code inspection is prohibited under SYSTEM OMEGA protocol.`;
    if (onWarningTriggered) {
      onWarningTriggered(alertMsg);
    }
    // Also log warning in console
    console.warn(
      '%c[SYSTEM OMEGA SECURITY GUARD]%c\nUnauthorized source inspection or console tampering detected.\nActions are logged to the authoritative team ledger.',
      'background: #7f1d1d; color: #fecaca; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;',
      'color: #f87171; font-family: monospace; font-size: 12px; margin-top: 4px;'
    );
  };

  // Right-click context menu is explicitly ALLOWED to enable copy and paste across all sectors and inputs.
  // Standard clipboard operations (copy, paste, cut, select-all) are fully enabled for operatives.

  // 2. Intercept Developer Tools Keyboard Shortcuts
  window.addEventListener(
    'keydown',
    (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Allow our secret admin shortcut Ctrl+Shift+O
      if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'o') {
        return; // Handled by App
      }

      // Block F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('DevTools Key F12 Intercepted');
        return;
      }

      // Block Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i') || (e.altKey && e.metaKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Inspect Element Shortcut Blocked');
        return;
      }

      // Block Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'j') || (e.altKey && e.metaKey && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('DevTools Console Shortcut Blocked');
        return;
      }

      // Block Ctrl+Shift+C / Cmd+Option+C (Inspect Element cursor)
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') || (e.altKey && e.metaKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Element Picker Shortcut Blocked');
        return;
      }

      // Block Ctrl+U / Cmd+Option+U (View Page Source)
      if ((cmdOrCtrl && e.key.toLowerCase() === 'u') || (e.altKey && e.metaKey && e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('View Source Shortcut Blocked');
        return;
      }

      // Block Ctrl+S / Cmd+S (Save Page)
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Page Save Restricted');
        return;
      }
    },
    { capture: true }
  );

  // 3. Clear Console Header & Display Anti-Cheat Warning
  try {
    console.clear();
    console.log(
      '%c███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗    ██████╗ ███╗   ███╗███████╗ ██████╗  █████╗ \n██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║   ██╔═══██╗████╗ ████║██╔════╝██╔════╝ ██╔══██╗\n███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║   ██║   ██║██╔████╔██║█████╗  ██║  ███╗███████║\n╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║   ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║\n███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║   ╚██████╔╝██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║\n╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝',
      'color: #06b6d4; font-family: monospace; font-size: 10px; font-weight: bold;'
    );
    console.log(
      '%c[SECURITY DIRECTIVE] Code tampering, script injection, and browser inspection are prohibited during SYSTEM OMEGA execution.',
      'color: #f59e0b; font-family: monospace; font-size: 12px; font-weight: bold;'
    );
  } catch {}
}
