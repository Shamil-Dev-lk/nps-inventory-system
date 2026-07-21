const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 8000, subdomain: 'shamil-api' });
  console.log('Backend tunnel running at:', tunnel.url);
  
  tunnel.on('close', () => {
    console.log('Backend tunnel closed');
  });
})();
