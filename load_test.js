import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const BASE_URL = 'http://localhost:8080/api';
const USERNAME = 'mani';
const PASSWORD = 'mani1234';

let cachedToken = null;

function getAuthToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const loginUrl = `${BASE_URL}/auth/login`;
  const payload = JSON.stringify({ username: USERNAME, password: PASSWORD });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(loginUrl, payload, params);
  const ok = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => !!r.json().jwt,
  });

  if (!ok) {
    return null;
  }

  cachedToken = res.json().jwt;
  return cachedToken;
}

export default function () {
  const token = getAuthToken();
  if (!token) {
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const mallsRes = http.get(`${BASE_URL}/malls`, { headers });
  check(mallsRes, {
    'GET /malls status is 200': (r) => r.status === 200,
  });

  const slotsRes = http.get(`${BASE_URL}/slots/mall/1`, { headers });
  check(slotsRes, {
    'GET /slots/mall/1 status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const failed = data.metrics.http_req_failed;
  const reqs = data.metrics.http_reqs;
  
  console.log('\n=== k6 Load Test Summary ===');
  console.log(`HTTP reqs: ${reqs ? reqs.values.count : 'n/a'}`);
  console.log(`Req/s: ${reqs ? reqs.values.rate.toFixed(2) : 'n/a'}`);
  console.log(`HTTP failed: ${failed ? (failed.values.rate * 100).toFixed(2) : 'n/a'}%`);
  console.log(`Avg duration: ${duration ? duration.values.avg.toFixed(2) : 'n/a'} ms`);
  console.log(`p90 duration: ${duration ? duration.values['p(90)'].toFixed(2) : 'n/a'} ms`);
  console.log(`p95 duration: ${duration ? duration.values['p(95)'].toFixed(2) : 'n/a'} ms`);
  console.log(`p99 duration: ${duration ? duration.values['p(99)'].toFixed(2) : 'n/a'} ms`);
  console.log('============================\n');
  return {};
}
