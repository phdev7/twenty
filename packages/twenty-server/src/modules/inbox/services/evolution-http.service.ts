import { Injectable } from '@nestjs/common';

import { lookup } from 'node:dns/promises';
import {
  request as requestHttp,
  type ClientRequestArgs,
  type IncomingMessage,
} from 'node:http';
import { request as requestHttps } from 'node:https';
import { isIP } from 'node:net';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const MAX_RESPONSE_BYTES = 1_048_576;
const REQUEST_TIMEOUT_MS = 20_000;

type EvolutionRequestInput = {
  baseUrl: string;
  path: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
};

type ResolvedAddress = {
  address: string;
  family: number;
};

const parseIpv4 = (address: string): number[] | null => {
  const octets = address.split('.').map(Number);

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return null;
  }

  return octets;
};

const isNonPublicIpv4 = (address: string): boolean => {
  const octets = parseIpv4(address);

  if (!octets) {
    return true;
  }

  const [first, second, third] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
};

const isNonPublicIpAddress = (address: string): boolean => {
  const normalizedAddress = address.toLowerCase();
  const family = isIP(normalizedAddress);

  if (family === 4) {
    return isNonPublicIpv4(normalizedAddress);
  }

  if (family !== 6) {
    return true;
  }

  if (normalizedAddress.startsWith('::ffff:')) {
    return isNonPublicIpv4(normalizedAddress.slice('::ffff:'.length));
  }

  return (
    normalizedAddress === '::' ||
    normalizedAddress === '::1' ||
    normalizedAddress.startsWith('fc') ||
    normalizedAddress.startsWith('fd') ||
    /^fe[89ab]/.test(normalizedAddress) ||
    normalizedAddress.startsWith('ff') ||
    normalizedAddress.startsWith('2001:db8:')
  );
};

// Every call to the provider leaves through here: the origin is checked against
// the infrastructure allowlist, the hostname is resolved once and the connection
// is pinned to that address, so a DNS answer that flips to a private range
// between check and connect cannot turn this into an internal request.
@Injectable()
export class EvolutionHttpService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  async request({
    baseUrl,
    path,
    method,
    headers = {},
    body,
  }: EvolutionRequestInput): Promise<Response> {
    const target = this.assertAllowedTarget(baseUrl, path);
    const allowPrivateNetwork = this.allowsPrivateNetwork();
    const pinnedAddress = await this.resolvePinnedAddress(
      target.hostname,
      allowPrivateNetwork,
    );
    return await new Promise<Response>((resolve, reject) => {
      const requestOptions: ClientRequestArgs & { servername?: string } = {
        protocol: target.protocol,
        hostname: pinnedAddress.address,
        port: target.port || (target.protocol === 'https:' ? '443' : '80'),
        path: `${target.pathname}${target.search}`,
        method,
        servername: target.protocol === 'https:' ? target.hostname : undefined,
        headers: {
          Host: target.host,
          ...headers,
          ...(body === undefined
            ? {}
            : { 'Content-Length': Buffer.byteLength(body).toString() }),
        },
      };
      let outgoingRequest: ReturnType<typeof requestHttp>;
      const handleResponse = (incomingResponse: IncomingMessage): void => {
        const status = incomingResponse.statusCode ?? 502;

        if (status >= 300 && status < 400) {
          incomingResponse.resume();
          reject(new Error('Evolution redirects are not allowed.'));

          return;
        }

        const chunks: Buffer[] = [];
        let receivedBytes = 0;

        incomingResponse.on('data', (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

          receivedBytes += buffer.length;

          if (receivedBytes > MAX_RESPONSE_BYTES) {
            outgoingRequest.destroy(
              new Error('Evolution returned an oversized response.'),
            );

            return;
          }

          chunks.push(buffer);
        });
        incomingResponse.on('end', () => {
          const responseHeaders = new Headers();

          for (const [name, value] of Object.entries(
            incomingResponse.headers,
          )) {
            if (Array.isArray(value)) {
              for (const item of value) {
                responseHeaders.append(name, item);
              }
            } else if (value !== undefined) {
              responseHeaders.set(name, value);
            }
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status,
              statusText: incomingResponse.statusMessage,
              headers: responseHeaders,
            }),
          );
        });
        incomingResponse.on('error', reject);
      };

      outgoingRequest =
        target.protocol === 'https:'
          ? requestHttps(requestOptions, handleResponse)
          : requestHttp(requestOptions, handleResponse);

      outgoingRequest.setTimeout(REQUEST_TIMEOUT_MS, () => {
        outgoingRequest.destroy(new Error('The Evolution request timed out.'));
      });
      outgoingRequest.on('error', reject);

      if (body !== undefined) {
        outgoingRequest.write(body);
      }

      outgoingRequest.end();
    });
  }

  allowsPrivateNetwork(): boolean {
    return (
      this.twentyConfigService.get('DIEX_EVOLUTION_ALLOW_PRIVATE_NETWORK') ===
      true
    );
  }

  assertUsableOrigin(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/+$/, '');
    const parsed = new URL(normalized);

    if (
      parsed.protocol !== 'https:' &&
      !(parsed.protocol === 'http:' && this.allowsPrivateNetwork())
    ) {
      throw new Error(
        'A origem da Evolution precisa usar HTTPS, salvo liberação explícita para rede privada.',
      );
    }

    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        'A origem da Evolution deve ser apenas o host, sem credenciais, caminho ou query.',
      );
    }

    return normalized;
  }

  private readAllowedOrigins(): Set<string> {
    const configuredOrigins = (
      this.twentyConfigService.get('DIEX_EVOLUTION_ALLOWED_ORIGINS') ?? ''
    ).split(',');
    const origins = new Set<string>();

    for (const configuredOrigin of configuredOrigins) {
      const trimmedOrigin = configuredOrigin.trim();

      if (!trimmedOrigin) {
        continue;
      }

      const parsedOrigin = new URL(trimmedOrigin);

      if (
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search ||
        parsedOrigin.hash
      ) {
        throw new Error(
          'DIEX_EVOLUTION_ALLOWED_ORIGINS must contain origins only, without credentials, paths, query strings or fragments.',
        );
      }

      if (!['https:', 'http:'].includes(parsedOrigin.protocol)) {
        throw new Error(
          'DIEX_EVOLUTION_ALLOWED_ORIGINS accepts only HTTP or HTTPS origins.',
        );
      }

      origins.add(parsedOrigin.origin);
    }

    if (origins.size === 0) {
      throw new Error(
        'The infrastructure administrator must configure DIEX_EVOLUTION_ALLOWED_ORIGINS before Evolution can be used.',
      );
    }

    return origins;
  }

  private assertAllowedTarget(baseUrl: string, path: string): URL {
    const parsedBaseUrl = new URL(baseUrl);
    const target = new URL(
      path.replace(/^\/+/, ''),
      `${parsedBaseUrl.origin}/`,
    );
    const allowedOrigins = this.readAllowedOrigins();

    if (!allowedOrigins.has(parsedBaseUrl.origin)) {
      throw new Error(
        'A origem da Evolution não está na allowlist da infraestrutura.',
      );
    }

    if (target.origin !== parsedBaseUrl.origin) {
      throw new Error(
        'The Evolution request attempted to leave its allowed origin.',
      );
    }

    if (
      parsedBaseUrl.protocol !== 'https:' &&
      !(parsedBaseUrl.protocol === 'http:' && this.allowsPrivateNetwork())
    ) {
      throw new Error(
        'Evolution must use HTTPS unless private-network access was explicitly enabled by the infrastructure administrator.',
      );
    }

    if (parsedBaseUrl.username || parsedBaseUrl.password) {
      throw new Error('A origem da Evolution não pode conter credenciais.');
    }

    return target;
  }

  private async resolvePinnedAddress(
    hostname: string,
    allowPrivateNetwork: boolean,
  ): Promise<ResolvedAddress> {
    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (addresses.length === 0) {
      throw new Error('The Evolution hostname did not resolve.');
    }

    if (
      !allowPrivateNetwork &&
      addresses.some(({ address }) => isNonPublicIpAddress(address))
    ) {
      throw new Error(
        'The Evolution hostname resolved to a non-public network address.',
      );
    }

    return addresses[0];
  }
}
