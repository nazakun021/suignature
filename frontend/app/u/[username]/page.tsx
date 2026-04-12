import type { Metadata } from 'next';
import { PortfolioPageClient } from './PortfolioPageClient';

interface PortfolioPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} · suignature`,
    description: `View ${username}'s verified credentials portfolio on suignature.`,
    openGraph: {
      title: `@${username}'s Verified Portfolio · suignature`,
      description: 'Verified community contributions and skills, recorded on the Sui blockchain.',
      url: `/u/${username}`,
    },
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { username } = await params;
  return <PortfolioPageClient username={username} />;
}
