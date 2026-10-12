import mongoose from 'mongoose';
import { Event } from '../models/Event';

/**
 * Seed script to generate demo analytics data.
 * All seeded records are flagged with is_demo: true.
 *
 * Usage: npm run seed
 * Reset: npm run seed (drops demo data first)
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/user_analytics';
const DEMO_PAGES = [
  'http://localhost:5173/demo',
  'http://localhost:5173/demo/about',
  'http://localhost:5173/demo/pricing',
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSessionId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function seed(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Remove old demo data
  const deleted = await Event.deleteMany({ is_demo: true });
  console.log(`Removed ${deleted.deletedCount} old demo records`);

  const events: Array<Record<string, unknown>> = [];
  const now = Date.now();

  // Generate 10 demo sessions over the past 7 days
  for (let s = 0; s < 10; s++) {
    const sessionId = generateSessionId();
    const sessionStartOffset = randomBetween(0, 7 * 24 * 60 * 60 * 1000);
    let currentTime = now - sessionStartOffset;

    // Each session visits 2-4 pages
    const pageCount = randomBetween(2, 4);
    for (let p = 0; p < pageCount; p++) {
      const pageUrl = DEMO_PAGES[p % DEMO_PAGES.length];

      // Page view
      events.push({
        session_id: sessionId,
        event_type: 'page_view',
        page_url: pageUrl,
        timestamp: new Date(currentTime),
        is_demo: true,
      });
      currentTime += randomBetween(1000, 5000);

      // 3-8 clicks per page
      const clickCount = randomBetween(3, 8);
      for (let c = 0; c < clickCount; c++) {
        events.push({
          session_id: sessionId,
          event_type: 'click',
          page_url: pageUrl,
          timestamp: new Date(currentTime),
          coordinates: {
            x: randomBetween(50, 1200),
            y: randomBetween(50, 800),
          },
          viewport: {
            width: 1440,
            height: 900,
          },
          is_demo: true,
        });
        currentTime += randomBetween(500, 3000);
      }

      currentTime += randomBetween(2000, 10000);
    }
  }

  await Event.insertMany(events);
  console.log(`✅ Seeded ${events.length} demo events across 10 sessions`);
  console.log('Demo sessions use is_demo: true flag for easy cleanup');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
