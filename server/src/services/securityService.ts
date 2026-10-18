import { DomainBlocklist } from '../models/index.ts';

// RFC 1918 / Private IP ranges + link-local & AWS metadata
const PRIVATE_IP_REGEX = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|::1|fc00:|fe80:)/i;

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'verify', 'account', 'banking', 'secure', 'wallet',
  'paypal', 'apple-id', 'crypto', 'bonus', 'airdrop', 'claim', 'free-gift'
];

export interface UrlSecurityResult {
  valid: boolean;
  isBlocklisted: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'blocked';
  riskScore: number; // 0 (clean) to 100 (dangerous)
  hostname: string;
  triggers: string[];
  error?: string;
}

export class SecurityService {
  /**
   * Comprehensive destination URL validation & SSRF prevention
   */
  public static async evaluateUrl(targetUrl: string): Promise<UrlSecurityResult> {
    const triggers: string[] = [];

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return {
        valid: false,
        isBlocklisted: false,
        riskLevel: 'high',
        riskScore: 100,
        hostname: '',
        triggers: ['Malformed URL syntax'],
        error: 'Please provide a valid, well-formed URL (e.g. https://example.com)',
      };
    }

    // 1. Strict protocol enforcement (HTTP/HTTPS only)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        isBlocklisted: false,
        riskLevel: 'high',
        riskScore: 100,
        hostname: parsed.hostname,
        triggers: [`Unsupported or dangerous protocol: ${parsed.protocol}`],
        error: 'Only standard HTTP and HTTPS URLs are permitted',
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Enforce valid domain structure (must have a top-level domain unless localhost)
    if (hostname !== 'localhost' && !hostname.includes('.')) {
      return {
        valid: false,
        isBlocklisted: false,
        riskLevel: 'high',
        riskScore: 100,
        hostname,
        triggers: ['Domain name lacks a top-level domain (TLD)'],
        error: 'Please provide a valid destination domain (e.g. https://example.com)',
      };
    }

    // 2. SSRF Protection: check for private, local, and metadata IP networks
    if (PRIVATE_IP_REGEX.test(hostname)) {
      return {
        valid: false,
        isBlocklisted: true,
        riskLevel: 'blocked',
        riskScore: 100,
        hostname,
        triggers: ['Target resolves to internal or private loopback network (SSRF protection)'],
        error: 'Routing to internal, local, or cloud metadata endpoints is prohibited',
      };
    }

    // 3. Database Blocklist check
    const isBlocked = await DomainBlocklist.findOne({ domain: hostname });
    if (isBlocked) {
      return {
        valid: false,
        isBlocklisted: true,
        riskLevel: 'blocked',
        riskScore: 100,
        hostname,
        triggers: [`Domain blocked by administrator: ${isBlocked.reason}`],
        error: `Domain "${hostname}" is actively blocklisted for security reasons`,
      };
    }

    // 4. Heuristic risk calculation
    let score = 0;

    // Check for IP address instead of hostname
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      score += 35;
      triggers.push('Destination uses raw IP address instead of registered domain');
    }

    // Check for suspicious phishing terms
    const lowerFull = targetUrl.toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (lowerFull.includes(kw)) {
        score += 15;
        triggers.push(`Contains sensitive credential/payment keyword: "${kw}"`);
        break;
      }
    }

    // Check for deep subdomains (often phishing obfuscation)
    const dotCount = hostname.split('.').length;
    if (dotCount > 4) {
      score += 20;
      triggers.push(`High subdomain depth (${dotCount} segments)`);
    }

    // Check for risky TLDs
    if (/\.(xyz|top|work|click|gq|cf|ml|tk)$/i.test(hostname)) {
      score += 15;
      triggers.push('Domain uses higher-risk generic TLD');
    }

    // Determine category
    let riskLevel: UrlSecurityResult['riskLevel'] = 'safe';
    if (score >= 60) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';
    else if (score > 0) riskLevel = 'low';

    return {
      valid: true,
      isBlocklisted: false,
      riskLevel,
      riskScore: Math.min(score, 99),
      hostname,
      triggers,
    };
  }
}
