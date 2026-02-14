import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { User, Building2, Mail, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

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

        <Card style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
          <CardHeader>
            <CardTitle style={{ color: '#CADCFC' }}>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" style={{ color: '#028090' }} />
              <div>
                <div className="font-semibold" style={{ color: '#CADCFC' }}>PMO Governance Platform</div>
                <div className="text-sm" style={{ color: '#94A3B8' }}>Integrated project management and governance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}