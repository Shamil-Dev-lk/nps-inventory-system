import { create } from 'zustand';
import type { Organization } from '@/types';

interface OrgState {
  org: Organization | null;
  setOrg: (org: Organization) => void;
  primaryColor: string;
  systemName: string;
}

export const useOrgStore = create<OrgState>()((set, get) => ({
  org: null,
  primaryColor: '#006838',
  systemName: 'ANTIGRAVITY',

  setOrg: (org) => {
    set({ org, primaryColor: org.primary_color, systemName: org.system_name });

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--gov-primary', org.primary_color);
      root.style.setProperty('--gov-secondary', org.secondary_color);
      root.style.setProperty('--gov-accent', org.accent_color);

      if (org.system_name && org.name_en) {
        document.title = `${org.system_name} — ${org.name_en}`;
      }
    }
  },
}));
