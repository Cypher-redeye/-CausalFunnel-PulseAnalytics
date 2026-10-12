import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app';
import { Event } from '../src/models/Event';

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  await Event.deleteMany({});
});

describe('POST /api/events', () => {
  const validPageView = {
    session_id: 'test-session-1',
    event_type: 'page_view',
    page_url: 'http://localhost:5173/demo',
    timestamp: new Date().toISOString(),
  };

  const validClick = {
    session_id: 'test-session-1',
    event_type: 'click',
    page_url: 'http://localhost:5173/demo',
    timestamp: new Date().toISOString(),
    coordinates: { x: 100, y: 200 },
    viewport: { width: 1440, height: 900 },
  };

  it('should create a page_view event', async () => {
    const res = await request(app).post('/api/events').send(validPageView);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event_type).toBe('page_view');
  });

  it('should create a click event with coordinates', async () => {
    const res = await request(app).post('/api/events').send(validClick);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event_type).toBe('click');
    expect(res.body.data.coordinates.x).toBe(100);
    expect(res.body.data.coordinates.y).toBe(200);
  });

  it('should reject click event without coordinates', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ ...validClick, coordinates: undefined });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject event without session_id', async () => {
    const { session_id, ...noSession } = validPageView;
    const res = await request(app).post('/api/events').send(noSession);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject event without event_type', async () => {
    const { event_type, ...noType } = validPageView;
    const res = await request(app).post('/api/events').send(noType);
    expect(res.status).toBe(400);
  });

  it('should reject invalid event_type', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({ ...validPageView, event_type: 'hover' });
    expect(res.status).toBe(400);
  });

  it('should reject event without timestamp', async () => {
    const { timestamp, ...noTimestamp } = validPageView;
    const res = await request(app).post('/api/events').send(noTimestamp);
    expect(res.status).toBe(400);
  });

  it('should reject event without page_url', async () => {
    const { page_url, ...noUrl } = validPageView;
    const res = await request(app).post('/api/events').send(noUrl);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sessions', () => {
  beforeEach(async () => {
    const events = [
      { session_id: 's1', event_type: 'page_view', page_url: '/home', timestamp: new Date('2024-01-01T10:00:00Z') },
      { session_id: 's1', event_type: 'click', page_url: '/home', timestamp: new Date('2024-01-01T10:01:00Z'), coordinates: { x: 10, y: 20 } },
      { session_id: 's1', event_type: 'click', page_url: '/home', timestamp: new Date('2024-01-01T10:02:00Z'), coordinates: { x: 30, y: 40 } },
      { session_id: 's2', event_type: 'page_view', page_url: '/about', timestamp: new Date('2024-01-02T10:00:00Z') },
      { session_id: 's2', event_type: 'page_view', page_url: '/pricing', timestamp: new Date('2024-01-02T10:05:00Z') },
    ];
    await Event.insertMany(events);
  });

  it('should return session summaries', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('should calculate correct event counts', async () => {
    const res = await request(app).get('/api/sessions');
    const s1 = res.body.data.find((s: any) => s.session_id === 's1');
    const s2 = res.body.data.find((s: any) => s.session_id === 's2');

    expect(s1.total_events).toBe(3);
    expect(s1.page_views).toBe(1);
    expect(s1.clicks).toBe(2);

    expect(s2.total_events).toBe(2);
    expect(s2.page_views).toBe(2);
    expect(s2.clicks).toBe(0);
  });

  it('should sort by most recent activity', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.body.data[0].session_id).toBe('s2');
  });

  it('should support pagination', async () => {
    const res = await request(app).get('/api/sessions?page=1&limit=1');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.totalPages).toBe(2);
  });
});

describe('GET /api/sessions/:sessionId/events', () => {
  beforeEach(async () => {
    await Event.insertMany([
      { session_id: 's1', event_type: 'page_view', page_url: '/home', timestamp: new Date('2024-01-01T10:00:00Z') },
      { session_id: 's1', event_type: 'click', page_url: '/home', timestamp: new Date('2024-01-01T10:01:00Z'), coordinates: { x: 10, y: 20 } },
    ]);
  });

  it('should return events in chronological order', async () => {
    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].event_type).toBe('page_view');
    expect(res.body.data[1].event_type).toBe('click');
  });

  it('should return 404 for non-existent session', async () => {
    const res = await request(app).get('/api/sessions/nonexistent/events');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/heatmap', () => {
  beforeEach(async () => {
    await Event.insertMany([
      { session_id: 's1', event_type: 'click', page_url: '/demo', timestamp: new Date(), coordinates: { x: 100, y: 200 }, viewport: { width: 1440, height: 900 } },
      { session_id: 's1', event_type: 'click', page_url: '/demo', timestamp: new Date(), coordinates: { x: 300, y: 400 }, viewport: { width: 1440, height: 900 } },
      { session_id: 's1', event_type: 'page_view', page_url: '/demo', timestamp: new Date() },
    ]);
  });

  it('should return click coordinates for a page', async () => {
    const res = await request(app).get('/api/heatmap?page_url=/demo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clicks).toHaveLength(2);
    expect(res.body.data.total_clicks).toBe(2);
    expect(res.body.data.page_url).toBe('/demo');
  });

  it('should require page_url parameter', async () => {
    const res = await request(app).get('/api/heatmap');
    expect(res.status).toBe(400);
  });

  it('should return empty clicks for page with no clicks', async () => {
    const res = await request(app).get('/api/heatmap?page_url=/no-clicks');
    expect(res.status).toBe(200);
    expect(res.body.data.clicks).toHaveLength(0);
    expect(res.body.data.total_clicks).toBe(0);
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.api).toBe('running');
    expect(res.body.data.database).toBe('connected');
  });
});

describe('GET /api/overview', () => {
  beforeEach(async () => {
    await Event.insertMany([
      { session_id: 's1', event_type: 'page_view', page_url: '/home', timestamp: new Date() },
      { session_id: 's1', event_type: 'click', page_url: '/home', timestamp: new Date(), coordinates: { x: 10, y: 20 } },
      { session_id: 's2', event_type: 'page_view', page_url: '/about', timestamp: new Date() },
    ]);
  });

  it('should return overview statistics', async () => {
    const res = await request(app).get('/api/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.stats.total_sessions).toBe(2);
    expect(res.body.data.stats.total_events).toBe(3);
    expect(res.body.data.stats.total_page_views).toBe(2);
    expect(res.body.data.stats.total_clicks).toBe(1);
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
