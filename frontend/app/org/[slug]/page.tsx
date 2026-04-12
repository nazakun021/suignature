import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PublicOrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const supabase = await createClient();
  if (!supabase) {
    return <div className="p-8">Database not configured.</div>;
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !org) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            suignature
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto text-4xl font-bold shadow-sm">
            {org.name.charAt(0)}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-sm font-medium">
                {org.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {org.description && (
            <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed">
              {org.description}
            </p>
          )}

          <div className="pt-8 border-t border-gray-100 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Verified Issued Credentials</h2>
            <div className="text-gray-500 text-sm">
              In the future, a list of credentials issued by this organization will appear here.
              <br/>
              (For now, Phase 2c will implement the batch issuance indexer.)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
