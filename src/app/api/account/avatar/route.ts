import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import { getCustomerAvatarUrlFromAdmin } from '@/lib/shopify/adminCustomerAvatar';

/**
 * Navbar vb. için oturumdaki müşterinin profil fotoğrafı URL’si (Admin metafield).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.shopifyAccessToken || !session.user?.email) {
    return NextResponse.json({ avatarUrl: null }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const avatarUrl = await getCustomerAvatarUrlFromAdmin(session.user.email);
  return NextResponse.json(
    { avatarUrl },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
