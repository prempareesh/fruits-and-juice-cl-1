import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Store {
  id: string;
  name: string;
  image_url: string;
  status: 'open' | 'closed';
  location: string;
}

interface AppState {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentStore: null,
      setCurrentStore: (store) => set({ currentStore: store }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'juicy-admin-storage',
    }
  )
);
