const request = require('supertest');

// Mock auth middleware to bypass JWT tests in basic component testing
jest.mock('../src/middlewares/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mock-user', role: 'admin' };
    next();
  },
  authorize: () => (req, res, next) => next(),
}));

const app = require('../src/app');
const Bin = require('../src/models/Bin');

// Mock Mongoose model
jest.mock('../src/models/Bin');

describe('Bins API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'up');
      expect(res.body).toHaveProperty('service', 'backend-api');
    });
  });

  describe('POST /api/bins', () => {
    it('should calculate status as Critical and create bin', async () => {
      const mockBin = { location: 'Building A', fillLevel: 85, status: 'Critical', _id: '12345' };
      Bin.create.mockResolvedValue(mockBin);

      const res = await request(app)
        .post('/api/bins')
        .send({ location: 'Building A', fillLevel: 85 });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('Critical');
      expect(Bin.create).toHaveBeenCalledWith({
        location: 'Building A',
        fillLevel: 85,
        status: 'Critical'
      });
    });

    it('should return 400 if fillLevel is missing', async () => {
      const res = await request(app)
        .post('/api/bins')
        .send({ location: 'Building B' });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/bins', () => {
    it('should fetch all bins', async () => {
      const mockBins = [
        { location: 'Loc 1', fillLevel: 20, status: 'Normal' },
        { location: 'Loc 2', fillLevel: 85, status: 'Critical' }
      ];
      Bin.find.mockResolvedValue(mockBins);

      const res = await request(app).get('/api/bins');

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
    });
  });
});
