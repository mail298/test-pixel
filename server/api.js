import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { freemem, totalmem, hostname, platform, release, arch, uptime, loadavg, cpus } from 'os';
import { execSync } from 'child_process';

const PORT = process.env.PORT || 3000;
const ROOT = new URL('..', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.json': 'application/json',
};

function getSystemStats() {
  const cpuUsage = loadavg()[0] / cpus().length * 100;
  const memTotal = totalmem();
  const memFree = freemem();
  const memUsed = memTotal - memFree;
  const uptimeSeconds = uptime();

  let diskTotal = 0, diskUsed = 0;
  try {
    const df = execSync('df -k / | tail -1', { encoding: 'utf8' }).trim().split(/\s+/);
    diskTotal = parseInt(df[1]) * 1024;
    diskUsed = parseInt(df[2]) * 1024;
  } catch {}

  let netRX = 0, netTX = 0;
  try {
    const net = readFileSync('/proc/net/dev', 'utf8');
    const lines = net.split('\n').filter(l => l.includes('eth0') || l.includes('ens') || l.includes('enp'));
    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/);
      netRX = parseInt(parts[1]) || 0;
      netTX = parseInt(parts[9]) || 0;
    }
  } catch {}

  let processes = 0;
  try {
    processes = readdirSync('/proc').filter(p => /^\d+$/.test(p)).length;
  } catch {}

  const services = [];
  const commonServices = ['nginx', 'apache2', 'mysql', 'postgresql', 'redis', 'docker', 'sshd', 'node'];
  for (const svc of commonServices) {
    try {
      const r = execSync(`pgrep -x ${svc} 2>/dev/null || pgrep -x ${svc}d 2>/dev/null || echo 0`, { encoding: 'utf8' });
      const count = r.trim().split('\n').filter(Boolean).length;
      if (count > 0) services.push({ name: svc, status: 'ok' });
    } catch {}
  }
  if (services.length === 0) {
    try {
      execSync('systemctl is-active docker 2>/dev/null || pgrep dockerd >/dev/null 2>&1', { encoding: 'utf8' });
      services.push({ name: 'docker', status: 'ok' });
    } catch {}
    services.push({ name: 'sshd', status: 'ok' });
  }

  const topProcesses = [];
  try {
    const ps = execSync('ps aux --sort=-%cpu 2>/dev/null || ps aux -r 2>/dev/null', { encoding: 'utf8' });
    const lines = ps.split('\n').slice(1, 9);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        topProcesses.push({
          name: parts[10].substring(0, 30),
          cpu: parseFloat(parts[2]) || 0,
          mem: (parseFloat(parts[3]) / 100 * memTotal) || 0,
        });
      }
    }
  } catch {}

  let nodeVersion = '--';
  try { nodeVersion = execSync('node --version 2>/dev/null', { encoding: 'utf8' }).trim(); } catch {}

  return {
    cpu: Math.round(cpuUsage * 10) / 10,
    cpuModel: cpus()[0]?.model || 'Unknown',
    cores: cpus().length,
    memTotal, memUsed, memFree,
    diskTotal, diskUsed,
    uptime: uptimeSeconds,
    netRX, netTX,
    processes,
    services,
    topProcesses,
    osInfo: { platform: platform(), release: release(), hostname: hostname(), arch: arch(), nodeVersion },
    loadAvg: loadavg(),
    security: null,
  };
}

const server = createServer((req, res) => {
  if (req.url === '/api/system-stats') {
    const stats = getSystemStats();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(stats));
    return;
  }

  const path = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(ROOT, path);

  if (!existsSync(filePath)) {
    // SPA fallback
    const idx = join(ROOT, 'index.html');
    if (existsSync(idx)) {
      const content = readFileSync(idx);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
    res.writeHead(404);
    res.end('404 Not Found');
    return;
  }

  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600',
  });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Server Monitor running at http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/system-stats`);
});
