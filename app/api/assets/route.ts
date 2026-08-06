import { NextRequest, NextResponse } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';

function getBucket() {
  try {
    const { env } = getCloudflareContext();
    return (env as any).UPLOAD_BUCKET;
  } catch (e) {
    return (process.env.UPLOAD_BUCKET || (globalThis as any).UPLOAD_BUCKET) as any;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const bucket = getBucket();

  if (!bucket) {
    return new NextResponse('R2 Bucket not configured', { status: 500 });
  }

  if (!key) {
    return new NextResponse('Missing key', { status: 400 });
  }

  try {
    const object = await bucket.get(key);

    if (!object) {
      return new NextResponse('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(object.body, {
      headers,
    });
  } catch (error) {
    return new NextResponse('Error fetching from R2', { status: 500 });
  }
}
