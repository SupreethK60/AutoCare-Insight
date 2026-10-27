import { NextResponse } from 'next/server';
import { AppError } from '../db/errors';

export function jsonSuccess<T = any>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonCreated<T = any>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'APP_ERROR',
          message: error.message,
          ...(error as any).errors ? { details: (error as any).errors } : {}
        }
      },
      { status: error.statusCode }
    );
  }

  const err = error as any;
  console.error('[Unhandled API Error]', err);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal error occurred'
      }
    },
    { status: 500 }
  );
}

