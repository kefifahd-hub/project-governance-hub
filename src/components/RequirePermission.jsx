import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useSession } from '@/lib/SessionContext';
import { createPageUrl } from '../utils';
import { getModule } from '@/lib/modules';

const Centered = ({ children }) => (
  <div
    className="min-h-screen flex items-center justify-center p-6"
    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E2761 100%)' }}
  >
    {children}
  </div>
);

const Spinner = () => (
  <Centered>
    <div className="w-8 h-8 border-4 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
  </Centered>
);

/**
 * Gate a page behind a module permission.
 *
 *   <RequirePermission page="RiskRegister" action="can_view">...</RequirePermission>
 *
 * - While the session resolves, shows a spinner.
 * - Core pages (alwaysAllowed) and platform admins pass straight through.
 * - Otherwise the current role's permission for (page, action) decides.
 */
export default function RequirePermission({ page, action = 'can_view', children }) {
  const { can, loading, isRegistered, isAdmin } = useSession();
  const mod = getModule(page);

  if (loading) return <Spinner />;

  const allowed = mod?.adminOnly
    ? isAdmin
    : isAdmin || mod?.alwaysAllowed || can(page, action);
  if (allowed) return children;

  const title = !isRegistered ? 'Account not provisioned' : 'Access restricted';
  const message = !isRegistered
    ? 'Your login is not yet linked to a workspace. Ask an administrator to add you.'
    : `You don't have permission to ${action.replace('can_', '')} “${mod?.label || page}”. Contact your administrator if you need access.`;

  return (
    <Centered>
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(202,220,252,0.12)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,168,150,0.12)' }}
        >
          <Lock className="w-6 h-6" style={{ color: '#00A896' }} />
        </div>
        <h1 className="text-lg font-semibold mb-2" style={{ color: '#CADCFC' }}>{title}</h1>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>{message}</p>
        <Link
          to={createPageUrl('Home')}
          className="inline-block px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #028090, #00A896)', color: '#F8FAFC' }}
        >
          Back to Home
        </Link>
      </div>
    </Centered>
  );
}
