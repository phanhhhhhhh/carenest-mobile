import api from './client';

export interface InviteTokenData {
  token: string;
  expiresAt: string; // ISO date string
}

export interface RedeemedLink {
  id: number;
  elderlyId: number;
  elderlyName: string;
  familyId: number;
  familyName: string;
  relationship: string;
  status: string;
  createdAt: string;
}

/**
 * Called by ELDERLY — generates a short-lived QR token from the backend.
 * Returns { token, expiresAt }.
 */
export async function generateInviteToken(): Promise<InviteTokenData> {
  const resp = await api.post('/invite/generate');
  return resp.data as InviteTokenData;
}

/**
 * Called by FAMILY after scanning the QR code.
 * Redeems the token and creates an ACTIVE FamilyLink.
 */
export async function redeemInviteToken(
  token: string,
  relationship = 'Người thân',
): Promise<RedeemedLink> {
  const resp = await api.post('/invite/redeem', { token, relationship });
  return resp.data as RedeemedLink;
}
