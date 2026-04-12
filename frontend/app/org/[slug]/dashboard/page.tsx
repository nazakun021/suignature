import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createCheckoutSession } from '@/lib/actions/stripe';
import { createEvent } from '@/lib/actions/orgs';

// Using async params for Next.js 15+ compatibility
export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="p-8 text-red-500">
        Database not configured. Orgs dashboard is unavailable.
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch org data & events
  const { data: orgData } = await supabase
    .from('organizations')
    .select(`
      id, name, slug, description, website,
      organization_members!inner(role),
      events(id, name, is_paid, created_at)
    `)
    .eq('slug', slug)
    .eq('organization_members.user_id', user.id)
    .single();

  if (!orgData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
        <p className="text-gray-500">You either do not have access, or it does not exist.</p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {orgData.name.charAt(0)}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{orgData.name} Dashboard</h1>
            </div>
            <div>
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                &larr; Back to Personal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Events Section */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Issuance Events</h2>
              <p className="text-sm text-gray-500">Manage your credentials by grouping them into paid events.</p>
            </div>
            
            <form action={async (formData) => {
                'use server';
                await createEvent(formData);
              }}
              className="flex gap-2 items-center"
            >
              <input type="hidden" name="orgSlug" value={slug} />
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="New Event Name"
                className="block w-64 appearance-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 select-none cursor-pointer"
              >
                Create Event
              </button>
            </form>
          </div>

          {!orgData.events || orgData.events.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mt-4 text-sm text-gray-500">No events found. Create your first issuance event to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {orgData.events.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(event => (
                <div key={event.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{event.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Created on {new Date(event.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {event.is_paid ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200 shadow-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        Paid & Active
                      </span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200">
                          Pending Payment
                        </span>
                        
                        <form action={createCheckoutSession}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="orgSlug" value={slug} />
                          <button
                            type="submit"
                            className="text-xs font-medium bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 shadow-sm cursor-pointer"
                          >
                            Pay $20 to Unlock
                          </button>
                        </form>
                      </div>
                    )}

                    {event.is_paid && (
                      <Link 
                        href={`/org/${slug}/events/${event.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Manage &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
