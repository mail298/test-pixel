#!/usr/bin/env node
import { watch, readFileSync, existsSync, appendFileSync, statSync } from 'fs';
import { createServer } from 'http';
import { freemem, totalmem, hostname, platform, release, arch, uptime, loadavg, cpus, networkInterfaces } from 'os';
import { execSync, spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, '..', 'server-defense.log');
const PIXEL_AGENTS_PORT = 3100;
const TOKEN_FILE = join(process.env.HOME || '/home/server2', '.pixel-agents', 'server.json');

const CONFIG = {
  checkInterval: 3000,
  sshLogPath: '/var/log/auth.log',
  syslogPath: '/var/log/syslog',
  fail2banLogPath: '/var/log/fail2ban.log',
  dockerSocket: '/var/run/docker.sock',
  maxFailedLogins: 5,
  maxConnectionsPerIp: 50,
  highCpuThreshold: 90,
  alertCooldown: 30000,
};

const state = {
  alerts: [],
  blockedIps: new Set(),
  suspiciousIps: new Map(),
  connectionCounts: new Map(),
  attackCount: 0,
  lastPingTime: 0,
  defenseMode: 'passive',
};

function log(msg, type = 'info') {
  const t = new Date().toISOString();
  const line = `[${t}] [${type.toUpperCase()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

function getToken() {
  try {
    if (existsSync(TOKEN_FILE)) {
      return JSON.parse(readFileSync(TOKEN_FILE, 'utf8')).token;
    }
  } catch {}
  return null;
}

function pingPixelAgents(event, details = '') {
  const token = getToken();
  if (!token) return;
  const http = spawn('curl', [
    '-s', '-X', 'POST',
    `http://127.0.0.1:${PIXEL_AGENTS_PORT}/api/hooks/claude`,
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({
      session_id: 'server-veteran',
      hook_event_name: event,
      tool_name: 'Bash',
      tool_input: { command: details || 'server monitoring' },
    }),
  ], { stdio: 'ignore', timeout: 2000 });
  setTimeout(() => http.kill(), 2000);
}

function checkLogins() {
  const logPaths = [CONFIG.sshLogPath, CONFIG.fail2banLogPath, CONFIG.syslogPath];
  const failedIps = new Map();

  for (const lp of logPaths) {
    try {
      if (!existsSync(lp)) continue;
      const size = statSync(lp).size;
      if (size > 5 * 1024 * 1024) continue;
      const content = readFileSync(lp, 'utf8').split('\n').slice(-200);
      for (const line of content) {
        const ml = [
          ...line.matchAll(/Failed\s+password\s+for.*from\s+(\d+\.\d+\.\d+\.\d+)/gi),
          ...line.matchAll(/Invalid\s+user.*from\s+(\d+\.\d+\.\d+\.\d+)/gi),
          ...line.matchAll(/Ban\s+(\d+\.\d+\.\d+\.\d+)/gi),
          ...line.matchAll(/authentication\s+failure.*rhost=(\d+\.\d+\.\d+\.\d+)/gi),
        ];
        for (const m of ml) {
          const ip = m[1];
          failedIps.set(ip, (failedIps.get(ip) || 0) + 1);
        }
      }
    } catch {}
  }
  return failedIps;
}

function checkConnections() {
  const conns = new Map();
  try {
    const ss = execSync('ss -tn 2>/dev/null | tail -n +2', { encoding: 'utf8', timeout: 3000 });
    for (const line of ss.split('\n').filter(Boolean)) {
      const parts = line.trim().split(/\s+/);
      const addr = parts[4];
      if (addr && addr.includes(':')) {
        const ip = addr.split(':').slice(0, -1).join(':').replace(/\[|\]/g, '');
        if (ip && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('172.')) {
          conns.set(ip, (conns.get(ip) || 0) + 1);
        }
      }
    }
  } catch {}
  return conns;
}

function checkPortScans() {
  try {
    const logs = execSync('dmesg 2>/dev/null | tail -50', { encoding: 'utf8', timeout: 2000 });
    const scans = [];
    const patterns = [
      /IN=(\S+).*SRC=(\d+\.\d+\.\d+\.\d+).*DPT=(\d+)/g,
      /DROP.*SRC=(\d+\.\d+\.\d+\.\d+)/g,
    ];
    for (const pattern of patterns) {
      let m;
      while ((m = pattern.exec(logs)) !== null) {
        scans.push(m[1] || m[0]);
      }
    }
    return scans;
  } catch { return []; }
}

function checkResources() {
  const cpus = cpus();
  const load1 = loadavg()[0];
  const cpuPct = Math.round((load1 / cpus.length) * 100);
  const memFree = freemem();
  const memTotal = totalmem();
  const memPct = Math.round(((memTotal - memFree) / memTotal) * 100);

  let diskPct = 0;
  try {
    const df = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf8', timeout: 2000 });
    const pct = df.trim().split(/\s+/)[4]?.replace('%', '');
    if (pct) diskPct = parseInt(pct);
  } catch {}

  return { cpuPct, memPct, diskPct, load1, cpus: cpus.length };
}

async function blockIp(ip, reason) {
  if (state.blockedIps.has(ip)) return;
  state.blockedIps.add(ip);
  state.attackCount++;
  state.defenseMode = 'active';

  log(`Blocking ${ip} — ${reason}`, 'warning');

  try {
    execSync(`sudo iptables -A INPUT -s ${ip} -j DROP 2>/dev/null`, { timeout: 3000 });
    log(`iptables rule added for ${ip}`, 'success');
  } catch {
    try {
      execSync(`sudo ufw deny from ${ip} 2>/dev/null`, { timeout: 3000 });
      log(`ufw rule added for ${ip}`, 'success');
    } catch (e) {
      log(`Failed to block ${ip}: ${e.message}`, 'error');
    }
  }

  state.alerts.unshift({
    time: new Date().toISOString(),
    ip, reason, action: 'BLOCKED',
    id: state.attackCount,
  });
  if (state.alerts.length > 50) state.alerts.pop();

  pingPixelAgents('PreToolUse', `⚠️ BLOCKED ${ip} — ${reason} (attack #${state.attackCount})`);

  setTimeout(() => {
    pingPixelAgents('PostToolUse', '');
    setTimeout(() => {
      pingPixelAgents('Stop', '');
    }, 500);
  }, 2000);
}

function checkThreats() {
  const now = Date.now();

  // Failed logins
  const failed = checkLogins();
  for (const [ip, count] of failed) {
    const prev = state.suspiciousIps.get(ip) || 0;
    state.suspiciousIps.set(ip, prev + count);
    if (prev + count >= CONFIG.maxFailedLogins) {
      blockIp(ip, `${count} failed SSH logins`);
    }
  }

  // Connection floods
  const conns = checkConnections();
  for (const [ip, count] of conns) {
    state.connectionCounts.set(ip, (state.connectionCounts.get(ip) || 0) + count);
    if (count >= CONFIG.maxConnectionsPerIp) {
      blockIp(ip, `${count} simultaneous connections`);
    }
  }

  // Resources
  const res = checkResources();
  if (res.cpuPct > CONFIG.highCpuThreshold) {
    log(`High CPU: ${res.cpuPct}% (load: ${res.load1})`, 'warning');
  }
  if (res.memPct > 90) {
    log(`High memory: ${res.memPct}%`, 'warning');
  }
  if (res.diskPct > 90) {
    log(`Low disk: ${res.diskPct}% used`, 'warning');
  }

  // Cleanup old alerts
  state.alerts = state.alerts.filter(a => now - new Date(a.time).getTime() < 300000);
}

// API server for monitor dashboard
function startApi() {
  const server = createServer((req, res) => {
    if (req.url !== '/api/defense-status') {
      res.writeHead(404); res.end();
      return;
    }

    const resData = checkResources();
    const failedNow = checkLogins();

    const data = {
      status: state.defenseMode,
      attackCount: state.attackCount,
      blockedIps: [...state.blockedIps],
      suspiciousIps: [...state.suspiciousIps.entries()].map(([ip, c]) => ({ ip, count: c })),
      alerts: state.alerts.slice(0, 20),
      resources: resData,
      uptime: uptime(),
      hostname: hostname(),
      platform: platform(),
      lastCheck: new Date().toISOString(),
    };

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(data, null, 2));
  });
  server.listen(3456, () => log('Defense API on :3456', 'success'));
}

// Periodic check loop
function startDefense() {
  log('='.repeat(50), 'system');
  log('AUTO DEFENSE SYSTEM ACTIVATED', 'system');
  log(`PID: ${process.pid}`, 'system');
  log(`Alert cooldown: ${CONFIG.alertCooldown}ms`, 'system');
  log(`Check interval: ${CONFIG.checkInterval}ms`, 'system');
  log('='.repeat(50), 'system');

  pingPixelAgents('PreToolUse', '🛡️ Auto-defense system started — monitoring threats');
  setTimeout(() => {
    pingPixelAgents('PostToolUse', '');
    setTimeout(() => pingPixelAgents('Stop', ''), 500);
  }, 1000);

  checkThreats();
  setInterval(checkThreats, CONFIG.checkInterval);

  // Periodic heartbeat
  setInterval(() => {
    if (state.attackCount > 0) {
      pingPixelAgents('PreToolUse', `🛡️ ${state.attackCount} attacks handled, ${state.blockedIps.size} IPs blocked`);
      setTimeout(() => {
        pingPixelAgents('PostToolUse', '');
        setTimeout(() => pingPixelAgents('Stop', ''), 300);
      }, 1000);
    }
  }, 60000);
}

startApi();
startDefense();

export { state, checkThreats, blockIp };
