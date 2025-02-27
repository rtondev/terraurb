const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

const deviceInfoMiddleware = (req, res, next) => {
  // Parser do User Agent
  const ua = new UAParser(req.headers['user-agent']);
  const browser = ua.getBrowser();
  const os = ua.getOS();
  const device = ua.getDevice();

  // Obter IP real considerando proxies
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress?.replace('::ffff:', '') || 
             req.socket.remoteAddress?.replace('::ffff:', '') || 
             'Desconhecido';

  // Lookup da localização baseado no IP
  const geo = geoip.lookup(ip);

  // Formatar nome do navegador
  const getBrowserName = () => {
    if (!browser.name) return 'Navegador desconhecido';
    const version = browser.version ? ` ${browser.version.split('.')[0]}` : '';
    return `${browser.name}${version}`;
  };

  // Formatar nome do sistema operacional
  const getOSName = () => {
    if (!os.name) return 'Sistema desconhecido';
    const version = os.version ? ` ${os.version}` : '';
    return `${os.name}${version}`;
  };

  // Formatar tipo de dispositivo
  const getDeviceType = () => {
    if (device.type) return device.type;
    if (os.name?.toLowerCase().includes('android') || os.name?.toLowerCase().includes('ios')) return 'mobile';
    if (os.name?.toLowerCase().includes('windows') || os.name?.toLowerCase().includes('mac') || os.name?.toLowerCase().includes('linux')) return 'desktop';
    return 'desktop';
  };

  // Formatar localização
  const formatLocation = (geoData) => {
    if (!geoData) return {
      city: 'Cidade desconhecida',
      region: 'Estado desconhecido',
      country: 'País desconhecido',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return {
      city: geoData.city || 'Cidade desconhecida',
      region: geoData.region || 'Estado desconhecido',
      country: geoData.country || 'País desconhecido',
      timezone: geoData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  req.deviceInfo = {
    browser: {
      name: getBrowserName(),
      version: browser.version
    },
    os: {
      name: getOSName(),
      version: os.version
    },
    device: {
      type: getDeviceType(),
      model: device.model || 'Desconhecido',
      vendor: device.vendor || 'Desconhecido'
    },
    ip: ip,
    location: formatLocation(geo)
  };

  next();
};

module.exports = deviceInfoMiddleware; 