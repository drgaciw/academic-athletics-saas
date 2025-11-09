import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Chat widget state
  chatWidgetOpen: boolean;
  toggleChatWidget: () => void;
  setChatWidgetOpen: (open: boolean) => void;

  // Theme preference
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Table preferences
  tablePagination: Record<string, number>;
  setTablePageSize: (tableId: string, pageSize: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Chat widget
      chatWidgetOpen: false,
      toggleChatWidget: () => set((state) => ({ chatWidgetOpen: !state.chatWidgetOpen })),
      setChatWidgetOpen: (open) => set({ chatWidgetOpen: open }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Table pagination
      tablePagination: {},
      setTablePageSize: (tableId, pageSize) =>
        set((state) => ({
          tablePagination: { ...state.tablePagination, [tableId]: pageSize },
        })),
    }),
    {
      name: 'aah-ui-storage',
    }
  )
);