'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

export default function RolesPage() {
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage  records</p>
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-12 shadow-sm text-center">
        <p className="text-muted-foreground">Roles module is ready. Full CRUD implementation in progress.</p>
      </div>
    </div>
  );
}