import mongoose from 'mongoose';
import { Event } from '../models/Event';

interface EventPayload {
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  coordinates?: { x: number; y: number };
  viewport?: { width: number; height: number };
}

async function verify() {
  console.log('--- Starting End-to-End Pipeline Verification ---');

  // Connect to active MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user_analytics';
  await mongoose.connect(mongoUri);
  console.log('✅ Direct MongoDB connection established');

  const testSessionId = `pipeline-test-${Date.now()}`;
  const testUrl = 'http://localhost:5173/demo';

  // 1. Post page_view event via HTTP to localhost:5000
  const pvPayload: EventPayload = {
    session_id: testSessionId,
    event_type: 'page_view',
    page_url: testUrl,
    timestamp: new Date(Date.now() - 5000).toISOString(),
  };

  const pvRes = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pvPayload),
  });
  const pvJson = (await pvRes.json()) as { success: boolean; data?: { _id: string } };
  console.log('1. Ingest page_view HTTP status:', pvRes.status, 'Success:', pvJson.success);
  if (!pvJson.success) throw new Error('Failed to ingest page_view');

  // 2. Post click events with coordinates
  const clickPayload1: EventPayload = {
    session_id: testSessionId,
    event_type: 'click',
    page_url: testUrl,
    timestamp: new Date(Date.now() - 3000).toISOString(),
    coordinates: { x: 520, y: 310 },
    viewport: { width: 1440, height: 900 },
  };

  const clickRes1 = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clickPayload1),
  });
  const clickJson1 = (await clickRes1.json()) as { success: boolean };
  console.log('2. Ingest click 1 HTTP status:', clickRes1.status, 'Success:', clickJson1.success);
  if (!clickJson1.success) throw new Error('Failed to ingest click 1');

  const clickPayload2: EventPayload = {
    session_id: testSessionId,
    event_type: 'click',
    page_url: testUrl,
    timestamp: new Date(Date.now() - 1000).toISOString(),
    coordinates: { x: 740, y: 450 },
    viewport: { width: 1440, height: 900 },
  };

  const clickRes2 = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clickPayload2),
  });
  const clickJson2 = (await clickRes2.json()) as { success: boolean };
  console.log('3. Ingest click 2 HTTP status:', clickRes2.status, 'Success:', clickJson2.success);
  if (!clickJson2.success) throw new Error('Failed to ingest click 2');

  // 4. Verify MongoDB directly contains the events
  const storedEvents = await Event.find({ session_id: testSessionId });
  console.log(`4. Direct MongoDB query for session ${testSessionId}: found ${storedEvents.length} events`);
  if (storedEvents.length !== 3) {
    throw new Error(`Expected 3 stored events in MongoDB, found ${storedEvents.length}`);
  }

  // 5. Query GET /api/sessions
  const sessionsRes = await fetch('http://localhost:5000/api/sessions');
  const sessionsJson = (await sessionsRes.json()) as {
    success: boolean;
    data: Array<{ session_id: string; total_events: number; page_views: number; clicks: number }>;
  };
  const testSessionSummary = sessionsJson.data.find((s) => s.session_id === testSessionId);
  console.log('5. GET /api/sessions summary for test session:', testSessionSummary);
  if (!testSessionSummary) throw new Error('Test session not found in GET /api/sessions');
  if (testSessionSummary.total_events !== 3) {
    throw new Error(`Expected total_events 3, got ${testSessionSummary.total_events}`);
  }
  if (testSessionSummary.page_views !== 1 || testSessionSummary.clicks !== 2) {
    throw new Error(`Incorrect metric breakdown: PV=${testSessionSummary.page_views}, Clicks=${testSessionSummary.clicks}`);
  }

  // 6. Query GET /api/sessions/:sessionId/events (verify ordering)
  const journeyRes = await fetch(`http://localhost:5000/api/sessions/${testSessionId}/events`);
  const journeyJson = (await journeyRes.json()) as {
    success: boolean;
    data: Array<{ event_type: string; timestamp: string }>;
  };
  console.log('6. GET /api/sessions/:sessionId/events count:', journeyJson.data.length);
  const eventTypes = journeyJson.data.map((e) => e.event_type);
  console.log('   Event chronological types:', eventTypes);
  if (eventTypes[0] !== 'page_view' || eventTypes[1] !== 'click' || eventTypes[2] !== 'click') {
    throw new Error('Events not in correct chronological order');
  }

  // 7. Query GET /api/heatmap?page_url=...
  const heatmapRes = await fetch(`http://localhost:5000/api/heatmap?page_url=${encodeURIComponent(testUrl)}`);
  const heatmapJson = (await heatmapRes.json()) as {
    success: boolean;
    data: { total_clicks: number; clicks: Array<{ x: number; y: number }> };
  };
  console.log('7. GET /api/heatmap total clicks:', heatmapJson.data.total_clicks);
  const foundClick1 = heatmapJson.data.clicks.some((c) => c.x === 520 && c.y === 310);
  const foundClick2 = heatmapJson.data.clicks.some((c) => c.x === 740 && c.y === 450);
  console.log('   Contains exact click 1 (520, 310):', foundClick1);
  console.log('   Contains exact click 2 (740, 450):', foundClick2);
  if (!foundClick1 || !foundClick2) {
    throw new Error('Heatmap response missing ingested coordinates');
  }

  // 8. Query GET /api/overview
  const overviewRes = await fetch('http://localhost:5000/api/overview');
  const overviewJson = (await overviewRes.json()) as {
    success: boolean;
    data: { stats: { total_sessions: number; total_events: number } };
  };
  console.log('8. GET /api/overview stats:', overviewJson.data.stats);
  if (overviewJson.data.stats.total_events < 3 || overviewJson.data.stats.total_sessions < 1) {
    throw new Error('Overview stats do not reflect ingested events');
  }

  console.log('--- ✅ All Pipeline Verification Checks PASSED Successfully ---');
  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error('❌ Pipeline verification failed:', err);
  process.exit(1);
});
