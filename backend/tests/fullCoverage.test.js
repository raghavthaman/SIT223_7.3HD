jest.setTimeout(10000);

const request = require('supertest');
const app = require('../src/app');
const { calculateStatus } = require('../src/utils/statusCalculator');

describe('Smart Waste System - Stable Coverage Tests', () => {

  // ---------------- HEALTH ----------------
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  test('GET /health returns status field', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });

  test('GET /health returns JSON content', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('GET /health contains expected value', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBeDefined();
  });

  // ---------------- ROUTING ----------------
  test('GET unknown route returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
  });

  test('POST unknown route returns 404', async () => {
    const res = await request(app).post('/unknown');
    expect(res.statusCode).toBe(404);
  });

  test('PUT unknown route returns 404', async () => {
    const res = await request(app).put('/random');
    expect(res.statusCode).toBe(404);
  });

  test('DELETE unknown route returns 404', async () => {
    const res = await request(app).delete('/random');
    expect(res.statusCode).toBe(404);
  });

  // ---------------- STATUS CALCULATOR ----------------
  test('calculateStatus returns Normal', () => {
    expect(calculateStatus(20)).toBe('Normal');
  });

  test('calculateStatus returns Warning', () => {
    expect(calculateStatus(60)).toBe('Warning');
  });

  test('calculateStatus returns Critical', () => {
    expect(calculateStatus(90)).toBe('Critical');
  });

  // ---------------- EXTRA COVERAGE ----------------
  test('Health route responds quickly', async () => {
    const start = Date.now();
    await request(app).get('/health');
    const end = Date.now();
    expect(end - start).toBeLessThan(2000);
  });

  test('Health route returns object', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body).toBe('object');
  });

});
