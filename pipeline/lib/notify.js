// Windows toast notification + auto-open the review HTML in default browser.
//
// Uses PowerShell's BurntToast-free path: a minimal WinRT toast via
// Windows.UI.Notifications. Falls back to a console message if PowerShell
// isn't available.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const PS_TEMPLATE = (title, body) => `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$xml = @"
<toast><visual><binding template='ToastGeneric'><text>${escapeXml(title)}</text><text>${escapeXml(body)}</text></binding></visual></toast>
"@
$doc = New-Object Windows.Data.Xml.Dom.XmlDocument
$doc.LoadXml($xml)
$toast = New-Object Windows.UI.Notifications.ToastNotification $doc
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Porcellia Ads').Show($toast)
`;

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function toast(title, body) {
  if (process.platform !== 'win32') {
    console.log(`\n[notify] ${title} — ${body}`);
    return;
  }
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PS_TEMPLATE(title, body)], {
      stdio: 'ignore',
      windowsHide: true,
    });
    ps.on('exit', () => resolve());
    ps.on('error', () => resolve()); // best-effort; never crash the pipeline on notify failure
  });
}

export async function openInBrowser(filePath) {
  if (!existsSync(filePath)) return;
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '""', filePath], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [filePath], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' }).unref();
  }
}
