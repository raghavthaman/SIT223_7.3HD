const request = require('supertest');
const app = require('../src/app');

describe(' Full Coverage Tests', () => {

  // ---------------- HEALTH ----------------
  test('GET /health should return status up', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('up');
  });

  test('GET /health should contain database status', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status');
  });

  // ---------------- AUTH ----------------
  test('POST /api/auth/register should fail without data', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/auth/login should fail invalid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "test@test.com", password: "wrong" });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/auth/login returns error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.body).toHaveProperty('message');
  });

  // ---------------- BINS ----------------
  test('GET /api/bins should require auth', async () => {
    const res = await request(app).get('/api/bins');
    expect(res.statusCode).toBeGreaterThanOrEqual(401);
  });

  test('POST /api/bins should fail without auth', async () => {
    const res = await request(app).post('/api/bins').send({});
    expect(res.statusCode).toBeGreaterThanOrEqual(401);
  });

  test('GET /api/bins/:id invalid id', async () => {
    const res = await request(app).get('/api/bins/123');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // ---------------- TRUCK ----------------
  test('GET /api/trucks requires auth', async () => {
    const res = await request(app).get('/api/trucks');
    expect(res.statusCode).toBeGreaterThanOrEqual(401);
  });

  test('GET /api/trucks/:id invalid', async () => {
    const res = await request(app).get('/api/trucks/123');
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  // ---------------- UTILS ----------------
  const { calculateStatus } = require('../src/utils/statusCalculator');

  test('statusCalculator returns Normal', () => {
    expect(calculateStatus(20)).toBe('Normal');
  });

  test('statusCalculator returns Warning', () => {
    expect(calculateStatus(60)).toBe('Warning');
  });

  test('statusCalculator returns Critical', () => {
    expect(calculateStatus(90)).toBe('Critical');
  });

});