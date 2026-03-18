interface Quote {
  text: string;
  author?: string;
}

export const QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Discipline is choosing between what you want now and what you want most." },
  { text: "You don't have to be extreme, just consistent." },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now." },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "A year from now you will wish you had started today.", author: "Karen Lamb" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it." },
  { text: "Don't wait for opportunity. Create it." },
  { text: "Wake up with determination. Go to bed with satisfaction." },
  { text: "Dream big. Start small. Act now." },
  { text: "Progress, not perfection." },
  { text: "Every expert was once a beginner." },
  { text: "Your only limit is your mind." },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Strive for progress, not perfection." },
  { text: "The pain you feel today will be the strength you feel tomorrow." },
  { text: "Great things never come from comfort zones." },
  { text: "Be stronger than your strongest excuse." },
  { text: "One day or day one. You decide." },
];

export function getQuoteOfTheDay(): Quote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
