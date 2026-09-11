import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type jsPDF from 'jspdf';

/**
 * Por qué hacía falta esto:
 * `doc.save(filename)` de jsPDF y el patrón `<a download> + click()` para
 * CSV funcionan perfecto en un navegador de escritorio, porque ahí el
 * atributo `download` del link realmente dispara una descarga al disco.
 *
 * Pero dentro de la app empacada con Capacitor (el WebView de iOS/Android),
 * ese mismo mecanismo casi siempre NO hace nada: WKWebView en iOS ignora el
 * atributo `download` en la práctica, y no hay una carpeta de "Descargas"
 * a la que el WebView pueda escribir directamente. Por eso el botón no
 * reaccionaba en el iPhone, aunque en la web sí funcionara.
 *
 * La solución estándar en apps Capacitor es: si estamos en la app nativa,
 * escribir el archivo con el plugin Filesystem (que sí tiene permiso para
 * escribir dentro del sandbox de la app) y luego abrir la hoja nativa de
 * "Compartir" con el plugin Share — desde ahí el usuario puede guardarlo
 * en Archivos (iOS), Drive, WhatsApp, etc. Ambos plugins ya estaban en tu
 * package.json (@capacitor/filesystem y @capacitor/share), solo no se
 * estaban usando para esto.
 */

/** Convierte un string UTF-8 (con tildes, ñ, etc.) a base64 de forma segura. */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

async function writeAndShare(filename: string, base64Data: string, mimeType: string) {
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });

  await Share.share({
    title: filename,
    text: filename,
    url: result.uri,
    dialogTitle: 'Guardar o compartir documento',
  }).catch(async (e) => {
    // Si el usuario cierra la hoja de compartir sin elegir nada,
    // Share.share() puede rechazar la promesa — no es un error real de
    // guardado (el archivo ya quedó escrito en el dispositivo).
    console.warn('Compartir cancelado o falló:', e?.message);
  });
}

/**
 * Guarda/descarga un documento jsPDF.
 * - En navegador web: se comporta exactamente igual que antes (doc.save()).
 * - En la app nativa (Android/iOS): escribe el PDF y abre la hoja de compartir.
 */
export async function savePdf(doc: jsPDF, filename: string) {
  if (!Capacitor.isNativePlatform()) {
    doc.save(filename);
    return;
  }
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];
  await writeAndShare(filename, base64, 'application/pdf');
}

/**
 * Guarda/descarga un archivo de texto plano (usado hoy para el CSV del
 * Historial P2P, pero sirve para cualquier .txt/.csv/.json).
 * - En navegador web: igual que antes (Blob + <a download>).
 * - En la app nativa: escribe el archivo y abre la hoja de compartir.
 */
export async function saveTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return;
  }
  const base64 = utf8ToBase64(content);
  await writeAndShare(filename, base64, mimeType);
}
