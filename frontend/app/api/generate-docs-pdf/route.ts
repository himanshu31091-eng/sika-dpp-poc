import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(null, {
    status: 302,
    headers: { Location: '/how-it-works?print=1' },
  });
}
