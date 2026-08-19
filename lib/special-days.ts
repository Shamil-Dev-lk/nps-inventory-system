'use client';

export interface SpecialDay {
  id: string;
  month: number; // 1-12
  day: number;   // 1-31
  title: string;
  badge: string;
  emoji: string;
  subtitle: string;
  bgGradient: string;
  accentColor: string;
  quote: string;
  actionText: string;
  actionHref?: string;
  interactiveType?: 'photography' | 'celebration' | 'wellness' | 'environment' | 'tech';
}

export className SpecialDaysRegistry {
  public static SPECIAL_DAYS: SpecialDay[] = [
    {
      id: 'new_year',
      month: 1,
      day: 1,
      title: 'Happy New Year 2026! 🎆',
      badge: 'Jan 1 • New Year Celebration',
      emoji: '🎆',
      subtitle: 'Wishing you & your organization a prosperous, healthy, and successful year ahead!',
      bgGradient: 'from-amber-950 via-purple-950 to-slate-900',
      accentColor: '#f59e0b',
      quote: 'Write it on your heart that every day is the best day in the year.',
      actionText: 'Celebrate New Year 🎉',
      interactiveType: 'celebration',
    },
    {
      id: 'sl_independence',
      month: 2,
      day: 4,
      title: 'National Independence Day 🇱🇰',
      badge: 'Feb 4 • Sri Lanka Independence',
      emoji: '🇱🇰',
      subtitle: 'Celebrating freedom, unity, heritage & National Pride across Sri Lanka.',
      bgGradient: 'from-amber-900 via-red-950 to-emerald-950',
      accentColor: '#fbbf24',
      quote: 'Freedom is the open window through which pours the sunlight of the human spirit.',
      actionText: 'National Heritage 🇱🇰',
      interactiveType: 'celebration',
    },
    {
      id: 'valentines',
      month: 2,
      day: 14,
      title: 'Happy Valentine’s Day! 💕',
      badge: 'Feb 14 • Spread Appreciation',
      emoji: '💖',
      subtitle: 'Expressing gratitude, unity and team spirit across our workplace.',
      bgGradient: 'from-rose-950 via-pink-950 to-slate-900',
      accentColor: '#f43f5e',
      quote: 'Together we achieve greatness through care and mutual respect.',
      actionText: 'Send Appreciation 💕',
      interactiveType: 'celebration',
    },
    {
      id: 'womens_day',
      month: 3,
      day: 8,
      title: 'International Women’s Day 👩✨',
      badge: 'Mar 8 • Women Leaders & Innovators',
      emoji: '💐',
      subtitle: 'Celebrating women leaders, innovators & trailblazers who shape our future.',
      bgGradient: 'from-purple-950 via-fuchsia-950 to-slate-900',
      accentColor: '#d946ef',
      quote: 'There is no limit to what we, as women, can accomplish.',
      actionText: 'Empower Women 🌟',
      interactiveType: 'celebration',
    },
    {
      id: 'happiness_day',
      month: 3,
      day: 20,
      title: 'International Day of Happiness 😊',
      badge: 'Mar 20 • Spread Positivity',
      emoji: '😊',
      subtitle: 'Fostering joy, well-being, and positivity in every workflow.',
      bgGradient: 'from-amber-900 via-orange-950 to-slate-900',
      accentColor: '#f59e0b',
      quote: 'Happiness is not something readymade. It comes from your own actions.',
      actionText: 'Spread Joy 😊',
      interactiveType: 'wellness',
    },
    {
      id: 'avurudu',
      month: 4,
      day: 14,
      title: 'Sinhala & Tamil New Year 🌸🇱🇰',
      badge: 'Apr 14 • Aluth Avurudda',
      emoji: '🪔',
      subtitle: 'Subha Aluth Avuruddak Wewa! Iniya Puthandu Vazthukkal! Harmony & prosperity.',
      bgGradient: 'from-amber-950 via-red-950 to-yellow-900',
      accentColor: '#f59e0b',
      quote: 'May the new year bring abundance, good health, and joyful beginnings.',
      actionText: 'Avurudu Festive Greetings 🪔',
      interactiveType: 'celebration',
    },
    {
      id: 'workers_day',
      month: 5,
      day: 1,
      title: 'International Workers’ Day 🛠️',
      badge: 'May 1 • May Day',
      emoji: '🛠️',
      subtitle: 'Honoring the dedication, perseverance, and hard work of workers worldwide.',
      bgGradient: 'from-red-950 via-slate-900 to-amber-950',
      accentColor: '#ef4444',
      quote: 'No work is insignificant. All labor that uplifts humanity has dignity.',
      actionText: 'Salute Workers 🛠️',
      interactiveType: 'celebration',
    },
    {
      id: 'vesak',
      month: 5,
      day: 23,
      title: 'Vesak Full Moon Poya Day 🪔',
      badge: 'May 23 • Peace & Enlightenment',
      emoji: '🪔',
      subtitle: 'Commemorating the Birth, Enlightenment, and Parinirvana of the Buddha.',
      bgGradient: 'from-amber-950 via-yellow-950 to-slate-950',
      accentColor: '#fbbf24',
      quote: 'Peace comes from within. Do not seek it without.',
      actionText: 'Peace & Mindfulness 🪔',
      interactiveType: 'wellness',
    },
    {
      id: 'environment_day',
      month: 6,
      day: 5,
      title: 'World Environment Day 🌿',
      badge: 'Jun 5 • Green Planet & Sustainability',
      emoji: '🌱',
      subtitle: 'Promoting eco-friendly operations, sustainability, and green initiatives.',
      bgGradient: 'from-emerald-950 via-teal-950 to-slate-900',
      accentColor: '#10b981',
      quote: 'The earth has music for those who listen.',
      actionText: 'Green Operations 🌿',
      interactiveType: 'environment',
    },
    {
      id: 'photography_day',
      month: 8,
      day: 19,
      title: 'World Photography Day 📸',
      badge: 'Aug 19 • Capture & Preserve',
      emoji: '📷',
      subtitle: 'Celebrating the art, science & history of photography! Precision asset management.',
      bgGradient: 'from-purple-950 via-indigo-950 to-slate-900',
      accentColor: '#f59e0b',
      quote: 'A photograph is the pause button of life.',
      actionText: 'Photo Studio 📸',
      interactiveType: 'photography',
    },
    {
      id: 'logistics_day',
      month: 10,
      day: 16,
      title: 'World Food & Supply Chain Day 🍎📦',
      badge: 'Oct 16 • Smart Distribution',
      emoji: '🍎',
      subtitle: 'Ensuring efficient inventory logistics, zero waste, and smart distribution.',
      bgGradient: 'from-amber-950 via-red-950 to-slate-900',
      accentColor: '#f97316',
      quote: 'Efficient supply chains nourish nations and empower growth.',
      actionText: 'View Inventory Supply 📦',
      interactiveType: 'tech',
    },
    {
      id: 'science_day',
      month: 11,
      day: 10,
      title: 'World Science & Technology Day 🔬⚡',
      badge: 'Nov 10 • Innovation & Science',
      emoji: '🚀',
      subtitle: 'Driving innovation, AI integration, and scientific excellence.',
      bgGradient: 'from-blue-950 via-indigo-950 to-slate-900',
      accentColor: '#3b82f6',
      quote: 'Science of today is the technology of tomorrow.',
      actionText: 'Explore AI Tools 🤖',
      actionHref: '/dashboard/ai',
      interactiveType: 'tech',
    },
    {
      id: 'christmas',
      month: 12,
      day: 25,
      title: 'Merry Christmas! 🎄✨',
      badge: 'Dec 25 • Season of Joy',
      emoji: '🎅',
      subtitle: 'Wishing you peace, joy, warmth and holiday cheer this festive season!',
      bgGradient: 'from-red-950 via-emerald-950 to-slate-900',
      accentColor: '#ef4444',
      quote: 'Christmas is not a time nor a season, but a state of mind.',
      actionText: 'Holiday Greetings 🎄',
      interactiveType: 'celebration',
    },
    {
      id: 'new_years_eve',
      month: 12,
      day: 31,
      title: 'New Year’s Eve 🥂✨',
      badge: 'Dec 31 • Year-End Milestone',
      emoji: '🥂',
      subtitle: 'Reflecting on a remarkable year of growth and looking forward to 2027!',
      bgGradient: 'from-purple-950 via-slate-950 to-amber-950',
      accentColor: '#f59e0b',
      quote: 'Cheers to a new year and another chance for us to get it right.',
      actionText: 'Year-End Summary 📊',
      actionHref: '/dashboard/reports/analytics',
      interactiveType: 'celebration',
    },
  ];

  /**
   * Get current special day based on local client/server date
   */
  public static getCurrentSpecialDay(overrideDate?: Date): SpecialDay {
    const today = overrideDate || new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();       // 1-31

    const match = this.SPECIAL_DAYS.find(s => s.month === month && s.day === day);
    if (match) return match;

    // Fallback: Daily Excellence & Productivity Day
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      id: 'daily_excellence',
      month,
      day,
      title: `${dayName} Focus & Productive Operations 🚀`,
      badge: `${dayName} • Active Inventory Management`,
      emoji: '⚡',
      subtitle: 'Maintaining precision stock tracking, seamless operations, and organizational excellence.',
      bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
      accentColor: '#3b82f6',
      quote: 'Excellence is not an act, but a habit of continuous dedication.',
      actionText: 'Manage Inventory 📦',
      actionHref: '/dashboard/items',
      interactiveType: 'tech',
    };
  }
}
