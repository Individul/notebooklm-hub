import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Support JSON body for URL fetching
    if (contentType.includes('application/json')) {
      const json = await req.json();
      const targetUrl = json.url;
      if (!targetUrl) {
        return NextResponse.json({ error: 'URL-ul este obligatoriu' }, { status: 400 });
      }

      try {
        const response = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : targetUrl;

        // Clean HTML to text
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30000);

        return NextResponse.json({
          title,
          type: 'web',
          content: cleanText || `[Conținut extras din ${targetUrl}]`,
          url: targetUrl
        });
      } catch (err: any) {
        return NextResponse.json({ error: 'Nu am putut descărca conținutul paginii web: ' + err.message }, { status: 500 });
      }
    }

    // Standard FormData file upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const urlFromForm = formData.get('url') as string | null;

    if (urlFromForm) {
      try {
        const response = await fetch(urlFromForm, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : urlFromForm;
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30000);

        return NextResponse.json({
          title,
          type: 'web',
          content: cleanText,
          url: urlFromForm
        });
      } catch (err: any) {
        return NextResponse.json({ error: 'Eroare la descărcarea URL: ' + err.message }, { status: 500 });
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'Niciun fișier nu a fost trimis.' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    let detectedType: 'pdf' | 'doc' | 'text' = 'text';

    if (fileName.toLowerCase().endsWith('.pdf') || fileType === 'application/pdf') {
      detectedType = 'pdf';
      try {
        const parser = new PDFParse({ data: buffer });
        const res: any = await parser.getText();
        extractedText = typeof res === 'string' ? res : (res?.text || '');
        await parser.destroy();
      } catch (err: any) {
        console.warn('PDF parser warning:', err?.message);
        extractedText = `[Fișier PDF: ${fileName} (${(file.size / 1024).toFixed(1)} KB) încărcat pentru analiză]`;
      }
    } else if (
      fileName.toLowerCase().endsWith('.txt') ||
      fileName.toLowerCase().endsWith('.md') ||
      fileName.toLowerCase().endsWith('.csv') ||
      fileName.toLowerCase().endsWith('.json') ||
      fileType.startsWith('text/')
    ) {
      detectedType = 'text';
      extractedText = buffer.toString('utf-8');
    } else if (fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
      detectedType = 'doc';
      const raw = buffer.toString('utf-8');
      const clean = raw.replace(/[^\x20-\x7E\t\n\r\u00A0-\u024F\u0400-\u04FF]/g, ' ').replace(/\s+/g, ' ');
      extractedText = clean.slice(0, 50000);
    } else {
      detectedType = 'text';
      extractedText = buffer.toString('utf-8');
    }

    extractedText = extractedText.replace(/\r\n/g, '\n').trim();

    return NextResponse.json({
      title: fileName,
      type: detectedType,
      content: extractedText || `[Conținut extras din ${fileName}]`,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Eroare la procesarea fișierului.' }, { status: 500 });
  }
}
