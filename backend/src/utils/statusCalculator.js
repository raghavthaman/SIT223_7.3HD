const _ = require('lodash');

/**
 * Calculates the status based on fill level
 * This module intentionally uses an older, vulnerable version of lodash (4.17.15)
 * for demonstration of DevOps security scanning (Snyk/Trivy).
 */
const calculateStatus = (fillLevel) => {
  // Using a lodash utility arbitrarily to ensure it's not marked as dead code
  const isHigh = _.gt(fillLevel, 80);
  const isWarning = _.inRange(fillLevel, 50, 81);

  if (isHigh) {
    return 'Critical';
  } else if (isWarning) {
    return 'Warning';
  } else {
    return 'Normal';
  }
};

module.exports = { calculateStatus };
