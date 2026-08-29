import dns from 'dns';
import { URL } from 'url';

/**
 * Checks if an IPv4 address string falls in private, loopback, or link-local ranges.
 */
export const isPrivateIPv4 = (ip) => {
  const parts = ip.split('.').map((part) => parseInt(part, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata like 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
};

/**
 * Checks if an IPv6 address string is private or loopback.
 */
export const isPrivateIPv6 = (ip) => {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    return isPrivateIPv4(v4Part);
  }
  return false;
};

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'local',
  'broadcasthost',
  'metadata.google.internal',
  'metadata',
];

/**
 * Validates a user-supplied URL against SSRF attacks.
 * @param {string} inputUrl
 * @returns {Promise<{ isValid: boolean, reason?: string, sanitizedUrl?: string }>}
 */
export const validateUrlForSSRF = async (inputUrl) => {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { isValid: false, reason: 'URL string is required.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl.trim());
  } catch (err) {
    return { isValid: false, reason: 'Invalid URL format.' };
  }

  // 1. Protocol must be http or https
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, reason: `Disallowed protocol '${parsedUrl.protocol}'. Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) {
    return { isValid: false, reason: 'Access to internal hostnames or local network is forbidden.' };
  }

  // 3. Direct IP checks (IPv4 / IPv6)
  // IPv4 Direct check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { isValid: false, reason: 'Access to private, loopback, or cloud metadata IP addresses is forbidden.' };
    }
  }

  // IPv6 Direct check
  if (hostname.includes(':') || (hostname.startsWith('[') && hostname.endsWith(']'))) {
    const rawIpv6 = hostname.replace(/[\[\]]/g, '');
    if (isPrivateIPv6(rawIpv6)) {
      return { isValid: false, reason: 'Access to private or loopback IPv6 addresses is forbidden.' };
    }
  }

  // 4. DNS Resolution Check to prevent DNS rebinding attacks
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (addr.family === 4 && isPrivateIPv4(addr.address)) {
        return { isValid: false, reason: `Host '${hostname}' resolves to private/internal IP address (${addr.address}).` };
      }
      if (addr.family === 6 && isPrivateIPv6(addr.address)) {
        return { isValid: false, reason: `Host '${hostname}' resolves to private/internal IPv6 address (${addr.address}).` };
      }
    }
  } catch (dnsErr) {
    // If DNS resolution fails, reject to prevent hanging / downstream errors
    return { isValid: false, reason: `Unable to resolve host '${hostname}': ${dnsErr.message}` };
  }

  return {
    isValid: true,
    sanitizedUrl: parsedUrl.toString(),
  };
};
