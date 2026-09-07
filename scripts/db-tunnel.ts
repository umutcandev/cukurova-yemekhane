/**
 * Coolify'daki private Postgres'e SSH tüneli açar.
 *
 *   pnpm db:tunnel
 *
 * Neden gerekli: veritabanı Coolify'ın Docker ağında ve dışarı kapalı.
 * Konteyner adı (agrbqwsibs6jjcdfmug8zcos) yalnızca Docker'ın iç DNS'i
 * tarafından çözülüyor; sunucunun kendisi çözemediği için tüneli doğrudan
 * o isme kuramıyoruz. Bu yüzden önce konteynerin ağdaki IP'si sorulur,
 * sonra tünel o IP'ye kurulur.
 *
 * IP her redeploy'da değişebilir — script onu her çalıştırmada yeniden
 * öğrendiği için elle güncelleme gerekmez.
 *
 * Tünel açıkken .env.local'deki DATABASE_URL localhost:55432'ye bakar.
 * Terminali kapatınca tünel de kapanır.
 */
import { spawn, spawnSync } from 'child_process';
import { createServer } from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SSH_HOST = process.env.DB_TUNNEL_SSH ?? 'root@45.152.243.147';
const CONTAINER = process.env.DB_TUNNEL_CONTAINER ?? 'agrbqwsibs6jjcdfmug8zcos';
const REMOTE_PORT = '5432';

function fail(message: string): never {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

/**
 * Lokal portu .env.local'deki DATABASE_URL'den okur.
 * Tek kaynak: tünelin dinlediği port ile uygulamanın bağlandığı port
 * elle senkronize tutulmaya çalışılırsa er geç ayrışır.
 */
function readLocalPortFromEnv(): string {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    fail('.env.local bulunamadı.');
  }

  const match = fs
    .readFileSync(envPath, 'utf-8')
    .match(/^[ \t]*DATABASE_URL[ \t]*=[ \t]*(.+?)[ \t]*$/m);

  if (!match) fail('.env.local içinde DATABASE_URL yok.');

  const url = new URL(match[1].replace(/^['"]|['"]$/g, ''));

  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    fail(
      `DATABASE_URL host'u "${url.hostname}" — tünel kullanmak için bunun\n` +
        '   localhost olması gerekir. .env.local\'i güncelle.'
    );
  }

  return url.port || '5432';
}

/** Port zaten doluysa tünel sessizce kurulmaz; önden söyle. */
async function assertPortFree(port: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const server = createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        fail(
          `localhost:${port} zaten kullanımda.\n` +
            '   Ya açık bir tünel var, ya da lokalde bir Postgres çalışıyor.\n' +
            "   Farklı bir port kullanmak istersen .env.local'deki DATABASE_URL portunu değiştir."
        );
      }
      resolve();
    });
    server.once('listening', () => server.close(() => resolve()));
    server.listen(Number(port), '127.0.0.1');
  });
}

async function main() {
  const localPort = readLocalPortFromEnv();
  await assertPortFree(localPort);

  console.log(`🔍 ${CONTAINER} konteynerinin IP'si soruluyor (${SSH_HOST})...`);

  // Konteynerin bağlı olduğu ilk ağdaki IP'yi al.
  const inspect = spawnSync(
    'ssh',
    [
      SSH_HOST,
      `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' ${CONTAINER}`,
    ],
    { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'inherit'] }
  );

  if (inspect.status !== 0) {
    fail(
      'SSH ya da docker inspect başarısız oldu.\n' +
        '   - Sunucuya erişebiliyor musun?\n' +
        '   - Konteyner adı doğru mu? Sunucuda kontrol et:\n' +
        "       docker ps --format '{{.Names}}' | grep -i postgres"
    );
  }

  const containerIp = (inspect.stdout ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];

  if (!containerIp) {
    fail(
      `${CONTAINER} bir IP döndürmedi. Konteyner çalışmıyor olabilir.\n` +
        '   Sunucuda kontrol et:  docker ps | grep postgres'
    );
  }

  console.log(`✅ Konteyner IP: ${containerIp}`);
  console.log(
    `🚇 Tünel açılıyor: localhost:${localPort} → ${containerIp}:${REMOTE_PORT}`
  );
  console.log('   Bu terminali AÇIK bırak. Kapatmak için Ctrl+C.\n');

  // -N: uzak kabuk açma, sadece port yönlendir
  const tunnel = spawn(
    'ssh',
    ['-N', '-L', `${localPort}:${containerIp}:${REMOTE_PORT}`, SSH_HOST],
    { stdio: 'inherit' }
  );

  tunnel.on('exit', (code) => {
    console.log(`\n🚇 Tünel kapandı (exit ${code ?? 0}).`);
    process.exit(code ?? 0);
  });
}

main();
