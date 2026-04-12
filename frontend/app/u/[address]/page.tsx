import type { Metadata } from 'next';
import { VolunteerPortfolioClient } from '@/app/u/[address]/VolunteerPortfolioClient';

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    title: `${short}'s Credentials — suignature`,
    description: `Verified proof-of-work credentials for ${short} on Sui.`,
    openGraph: {
      title: `${short}'s Verified Portfolio · suignature`,
      description: 'Verified community contributions and skills, recorded on the Sui blockchain.',
      url: `/u/${address}`,
    },
  };
}

export default async function VolunteerPortfolioPage({ params }: Props) {
  const { address } = await params;
  return <VolunteerPortfolioClient address={address} />;
}
