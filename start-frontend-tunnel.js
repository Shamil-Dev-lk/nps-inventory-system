const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 3000, subdomain: 'shamil-app' });
  console.log('Frontend tunnel running at:', tunnel.url);
  
  tunnel.on('close', () => {
    console.log('Frontend tunnel closed');
  });
})();
