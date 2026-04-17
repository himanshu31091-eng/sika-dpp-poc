import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const version = searchParams.get('version');

  if (!slug || !version) {
    return new Response('Missing slug or version', { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(
      `${apiUrl}/docs/${slug}/v/${version}/download`,
      { redirect: 'follow' }
    );

    if (!response.ok) {
      return new Response('PDF not found', { status: 404 });
    }

    const pdf = await response.arrayBuffer();

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response('Failed to fetch PDF', { status: 500 });
  }
}
