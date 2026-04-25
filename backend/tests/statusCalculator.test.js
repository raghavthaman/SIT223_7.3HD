const { calculateStatus } = require('../src/utils/statusCalculator');

describe('Status Calculator Utility', () => {
  it('should return Normal for fillLevel < 50', () => {
    expect(calculateStatus(30)).toBe('Normal');
    expect(calculateStatus(49)).toBe('Normal');
  });

  it('should return Warning for fillLevel > 50 and <= 80', () => {
    expect(calculateStatus(51)).toBe('Warning');
    expect(calculateStatus(80)).toBe('Warning');
  });

  it('should return Critical for fillLevel > 80', () => {
    expect(calculateStatus(81)).toBe('Critical');
    expect(calculateStatus(100)).toBe('Critical');
  });
});
