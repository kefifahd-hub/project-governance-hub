import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Building2, Mail, Shield, Trash2, AlertTriangle, Loader2, BookOpen, LogOut, LifeBuoy } from 'lucide-react';

// Where "Contact Administrator" routes to. Change to a shared mailbox if needed.
const ADMIN_EMAIL = 'kefi.fahd@gmail.com';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await base44.auth.logout();
      qc.clear();
      window.location.href = '/';
    } catch (err) {
      setLoggingOut(false);
    }
  };

  const handleContactAdmin = () => {
    const subject = encodeURIComponent('Support request — PMO Governance Platform');
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}`;
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // The platform does not expose a direct delete-account endpoint from the client.
      // We sign the user out and clear caches; full account deletion is handled
      // by an admin in the dashboard per platform constraints.
      await base44.auth.logout();
      qc.clear();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err?.message || 'Could not complete request. Please contact your administrator.');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }} className="shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold" style={{ color: '#CADCFC' }}>Settings</h1>
          <p className="mt-2" style={{ color: '#94A3B8' }}>Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="mb-6">
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>User Profile</CardTitle>
            <CardDescription style={{ color: '#94A3B8' }}>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
              <User className="w-5 h-5" style={{ color: '#028090' }} />
              <div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>Full Name</div>
                <div className="font-medium" style={{ color: '#CADCFC' }}>{user.full_name || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
              <Mail className="w-5 h-5" style={{ color: '#028090' }} />
              <div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>Email</div>
                <div className="font-medium" style={{ color: '#CADCFC' }}>{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
              <Shield className="w-5 h-5" style={{ color: '#028090' }} />
              <div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>Role</div>
                <div className="font-medium" style={{ color: '#CADCFC' }}>{user.role}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="mb-6">
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" style={{ color: '#028090' }} />
              <div>
                <div className="font-semibold" style={{ color: '#CADCFC' }}>PMO Governance Platform</div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>Integrated project management and governance</div>
              </div>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('UserManual'))}
              variant="outline"
              className="w-full sm:w-auto"
              style={{ borderColor: 'rgba(0,168,150,0.4)', color: '#00A896', background: 'rgba(0,168,150,0.08)' }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Feature User Manual
            </Button>
          </CardContent>
        </Card>

        {/* Support — log out & contact admin */}
        <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }} className="mb-6">
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>Support</CardTitle>
            <CardDescription style={{ color: '#94A3B8' }}>Session and help</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={handleLogOut}
              disabled={loggingOut}
              variant="outline"
              className="w-full sm:w-auto"
              style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}
            >
              {loggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
              {loggingOut ? 'Signing out…' : 'Log Off'}
            </Button>
            <Button
              onClick={handleContactAdmin}
              variant="outline"
              className="w-full sm:w-auto"
              style={{ borderColor: 'rgba(0,168,150,0.4)', color: '#00A896', background: 'rgba(0,168,150,0.08)' }}
            >
              <LifeBuoy className="w-4 h-4 mr-2" />
              Contact Administrator
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#ef4444' }}>
              <Trash2 className="w-4 h-4" /> Delete Account
            </CardTitle>
            <CardDescription style={{ color: '#94A3B8' }}>
              Permanently remove your account and sign out of this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg mb-4" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
              <div className="text-xs" style={{ color: '#fca5a5' }}>
                This will sign you out immediately. Full account data deletion is performed by a workspace administrator and cannot be undone.
              </div>
            </div>
            {deleteError && (
              <div className="text-xs mb-3 p-2 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{deleteError}</div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {deleting ? 'Deleting…' : 'Delete Account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: '#CADCFC' }}>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription style={{ color: '#94A3B8' }}>
                    This action will sign you out and request account deletion. You will need to be re-invited to access the platform again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel style={{ color: '#94A3B8', borderColor: 'rgba(202, 220, 252, 0.2)' }}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                    style={{ background: '#ef4444', color: '#fff' }}
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}