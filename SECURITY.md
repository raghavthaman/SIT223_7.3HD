# Security Documentation

This document outlines the deliberate security measures, vulnerability mitigations, and scanning integrations implemented in the Smart Waste Management System.

## Continuous Security Scanning (Trivy)

Our CI/CD pipeline incorporates Trivy for structural vulnerability scanning in the `Security` stage.

**Configuration Enforcement:**
- Severity thresholds are set strictly to `HIGH` and `CRITICAL`.
- The pipeline utilizes `--exit-code 1`, meaning any vulnerability matching these thresholds will strictly **block** the pipeline, enforcing a secure software supply chain.

## Addressed Vulnerabilities

### 1. Prototype Pollution (lodash)
- **Vulnerability Name**: Prototype Pollution in lodash
- **Severity**: HIGH
- **Fix**: Upgraded `lodash` from version `4.17.15` to `4.17.21`.
- **Justification**: Earlier versions of `lodash` are susceptible to prototype pollution, allowing an attacker to inject properties into existing object prototypes. This can lead to logic bypasses or remote code execution. Upgrading to `4.17.21` securely patches this vector.
- **Re-scan Confirmation**: Subsequent Trivy and `npm audit` scans confirm the vulnerability is fully resolved and the pipeline completes successfully without security exits.

## NPM Audit Status
- Local code dependencies are continuously monitored using `npm audit`.
- The current tree reflects 0 vulnerabilities across production dependencies.
