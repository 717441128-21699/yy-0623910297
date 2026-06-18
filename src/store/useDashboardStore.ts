import { create } from 'zustand';
import type { Platform, RiskCategory, Event, HotWord } from '@/types/event';
import { mockEvents, getEventsByFilters, generateHotWordsFromEvents } from '@/data/mockEvents';

interface DashboardState {
  selectedScenic: string;
  selectedDate: Date;
  selectedPlatforms: Platform[];
  selectedCategory: RiskCategory | 'all';
  events: Event[];
  hotWords: HotWord[];
  loading: boolean;
  setSelectedScenic: (scenic: string) => void;
  setSelectedDate: (date: Date) => void;
  togglePlatform: (platform: Platform) => void;
  setSelectedCategory: (category: RiskCategory | 'all') => void;
  fetchEvents: () => void;
  getFilteredEventsByCategory: (category: RiskCategory | 'all') => Event[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  selectedScenic: 'all',
  selectedDate: new Date(),
  selectedPlatforms: [],
  selectedCategory: 'all',
  events: mockEvents,
  hotWords: generateHotWordsFromEvents(mockEvents),
  loading: false,

  setSelectedScenic: (scenic) => {
    set({ selectedScenic: scenic });
    get().fetchEvents();
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchEvents();
  },

  togglePlatform: (platform) => {
    const platforms = get().selectedPlatforms;
    const newPlatforms = platforms.includes(platform)
      ? platforms.filter(p => p !== platform)
      : [...platforms, platform];
    set({ selectedPlatforms: newPlatforms });
    get().fetchEvents();
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  fetchEvents: () => {
    set({ loading: true });
    const { selectedScenic, selectedPlatforms, selectedDate } = get();
    const filteredEvents = getEventsByFilters(
      selectedScenic,
      selectedPlatforms,
      'all',
      selectedDate
    );
    const filteredHotWords = generateHotWordsFromEvents(filteredEvents);
    set({ events: filteredEvents, hotWords: filteredHotWords, loading: false });
  },

  getFilteredEventsByCategory: (category) => {
    const { events } = get();
    if (category === 'all') return events;
    return events.filter(e => e.category === category);
  },
}));
