const request = require('supertest');
const app = require('../src/app');

describe('Stable Coverage Tests', () => {

  // ---------------- HEALTH ----------------
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  test('GET /health returns status', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });

  // ---------------- SAFE ROUTES ----------------
  test('GET unknown route returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
  });

  test('POST unknown route returns 404', async () => {
    const res = await request(app).post('/unknown');
    expect(res.statusCode).toBe(404);
  });

  // ---------------- AUTH (SAFE TESTS ONLY) ----------------
  test('POST /api/auth/login without body fails', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // ---------------- UTILS ----------------
  const { calculateStatus } = require('../src/utils/statusCalculator');

  test('statusCalculator Normal', () => {
    expect(calculateStatus(20)).toBe('Normal');
  });

  test('statusCalculator Warning', () => {
    expect(calculateStatus(60)).toBe('Warning');
  });

  test('statusCalculator Critical', () => {
    expect(calculateStatus(90)).toBe('Critical');
  });

  // ---------------- EXTRA COVERAGE ----------------
  test('Health route returns JSON', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('Health route contains expected keys', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });

});