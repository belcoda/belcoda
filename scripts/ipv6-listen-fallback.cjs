// Preload shim: when the kernel has no IPv6 (e.g. the Firecracker sandbox this
// runs in boots with `ipv6.disable=1`), rewrite any attempt to bind the
// unspecified IPv6 address `::` to the IPv4 unspecified address `0.0.0.0`.
//
// This exists because some deps (notably @rocicorp/zero's zero-cache) hard-code
// `host: '::'` when they listen, which fails with EAFNOSUPPORT on a host without
// an IPv6 stack. Rather than patch that package, we hook Node's stable core
// `net.Server.prototype.listen` so the fix is independent of any dependency's
// file layout or version.
//
// Self-limiting: it only installs the hook when IPv6 is actually absent, and
// only rewrites the literal `::` host. On any normal (dual-stack) machine the
// file is a no-op, so it is safe to load unconditionally via NODE_OPTIONS.
'use strict';

const fs = require('fs');

// /proc/net/if_inet6 exists iff the running kernel has IPv6 enabled.
const ipv6Available = fs.existsSync('/proc/net/if_inet6');
if (!ipv6Available) {
	const net = require('net');
	const originalListen = net.Server.prototype.listen;
	net.Server.prototype.listen = function patchedListen(...args) {
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			// .listen('::', ...) — positional string form
			if (arg === '::') {
				args[i] = '0.0.0.0';
			} else if (arg && typeof arg === 'object' && arg.host === '::') {
				// .listen({ host: '::', port }) — options-object form (Fastify uses this)
				arg.host = '0.0.0.0';
			}
		}
		return originalListen.apply(this, args);
	};
}
