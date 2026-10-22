import http from 'node:http';

/**
 * Creates an ephemeral real HTTP server for reliable Express 5 testing
 */
export async function createTestClient(app) {
  let server;
  const baseUrl = await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });

  const close = async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  };

  const request = async (method, path, body = null, headers = {}) => {
    const reqHeaders = {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_SECRET_KEY || 'connectly_admin_fallback_key',
      ...headers
    };

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: reqHeaders,
      body: (body && method !== 'GET' && method !== 'HEAD') ? JSON.stringify(body) : undefined
    });

    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status, body: data, headers: res.headers };
  };

  return { baseUrl, close, request };
}
