import type { Metadata } from 'next';
import { VerifyPageClient } from '@/components/VerifyPageClient';

interface VerifyPageProps {
  params: Promise<{ objectId: string }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { objectId } = await params;

  return {
    title: 'Verified Credential · suignature',
    description:
      'This credential has been cryptographically verified and recorded on the Sui blockchain.',
    openGraph: {
      title: 'Verified Proof of Work · suignature',
      description:
        'Cryptographically verified community contribution credential.',
      url: `/verify/${objectId}`,
    },
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { objectId } = await params;
  return <VerifyPageClient objectId={objectId} />;
}
