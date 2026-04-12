import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BulkUploader } from '@/components/BulkUploader';

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return <div className="p-8 text-red-500">Database not configured.</div>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Event data and verify org ownership
  const { data: eventData } = await supabase
    .from('events')
    .select(`
      id, name, is_paid, created_at,
      organizations!inner(slug, organization_members!inner(role))
    `)
    .eq('id', eventId)
    .eq('organizations.slug', slug)
    .eq('organizations.organization_members.user_id', user.id)
    .single();

  if (!eventData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <p className="text-gray-500">You either do not have access, or it does not exist.</p>
        <Link href={`/org/${slug}/dashboard`} className="text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!eventData.is_paid) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-4">{eventData.name} (Pending Payment)</h1>
        <p className="text-gray-500 mb-4">You must unlock this event to start issuing credentials.</p>
        <Link href={`/org/${slug}/dashboard`} className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Go To Dashboard to Pay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/org/${slug}/dashboard`} className="text-gray-400 hover:text-gray-900 font-bold">
                &larr;
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{eventData.name} - Issuance</h1>
            </div>
            <div>
               <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                  Paid & Unlocked
               </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Shinami Gas Sponsorship</h2>
          <p className="text-sm text-gray-500 mb-6">
             Because this event is unlocked, you can mint an unlimited number of credentials for this event using Shinami&apos;s sponsored transactions. You only need to sign the transaction with your organization&apos;s wallet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Manual Issue</h3>
                <p className="text-sm text-gray-500 mb-4">Issue a credential to a single recipient right now.</p>
                {/* Future implementation: Single Issue Form */}
                <button disabled className="w-full py-2 bg-indigo-600 opacity-50 text-white rounded-lg text-sm font-medium">
                  Implement Issue Form
                </button>
             </div>
             
             <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Bulk Issue (CSV)</h3>
                <p className="text-sm text-gray-500 mb-4">Upload a CSV to batch issue credentials to hundreds of recipients at once.</p>
                <BulkUploader eventId={eventData.id} orgSlug={slug} />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
