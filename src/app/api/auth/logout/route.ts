import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';
import { jsonSuccess } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  const response = jsonSuccess({ message: 'Logged out successfully' });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}

