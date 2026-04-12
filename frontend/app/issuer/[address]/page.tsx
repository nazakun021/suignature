import type { Metadata } from 'next';
import { IssuerProfileClient } from '@/app/issuer/[address]/IssuerProfileClient';

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    title: `${short} — Credential Issuer on suignature`,
    description: `All credentials issued by ${short} on Sui.`,
    openGraph: {
      title: `${short} — Credential Issuer · suignature`,
      description: 'View all verified credentials issued by this address on the Sui blockchain.',
      url: `/issuer/${address}`,
    },
  };
}

export default async function IssuerProfilePage({ params }: Props) {
  const { address } = await params;
  return <IssuerProfileClient address={address} />;
}
