const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.deriv.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding
      },
      headers: {
        Connection: 'keep-alive'
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add any required headers here
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Content-Type', 'application/json');
      },
    })
  );
};