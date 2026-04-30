jest.setTimeout(10000);

const request = require('supertest');
const app = require('../src/app');
const { calculateStatus } = require('../src/utils/statusCalculator');

describe('Stable CI Tests', () => {

  // HEALTH
  test('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });

  test('GET /health has status', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });

  // ROUTES
  test('GET unknown route → 404', async () => {
    const res = await request(app).get('/random');
    expect(res.statusCode).toBe(404);
  });

  test('POST unknown route → 404', async () => {
    const res = await request(app).post('/random');
    expect(res.statusCode).toBe(404);
  });

  test('PUT unknown route → 404', async () => {
    const res = await request(app).put('/random');
    expect(res.statusCode).toBe(404);
  });

  test('DELETE unknown route → 404', async () => {
    const res = await request(app).delete('/random');
    expect(res.statusCode).toBe(404);
  });

  // STATUS CALCULATOR
  test('Normal status', () => {
    expect(calculateStatus(20)).toBe('Normal');
  });

  test('Warning status', () => {
    expect(calculateStatus(60)).toBe('Warning');
  });

  test('Critical status', () => {
    expect(calculateStatus(90)).toBe('Critical');
  });

  // EXTRA
  test('Health returns JSON', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('Health returns object', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body).toBe('object');
  });

});
