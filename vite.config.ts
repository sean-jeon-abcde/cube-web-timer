import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function localRecordSyncPlugin(): Plugin {
  return {
    name: 'local-record-sync',
    configureServer(server) {
      server.middlewares.use('/api/save-records', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const sessions = JSON.parse(body);
              const recordsDir = path.resolve(process.cwd(), 'records');
              if (!fs.existsSync(recordsDir)) {
                fs.mkdirSync(recordsDir, { recursive: true });
              }

              // 1. Save Full JSON
              const jsonPath = path.join(recordsDir, 'solves.json');
              fs.writeFileSync(jsonPath, JSON.stringify(sessions, null, 2), 'utf-8');

              // 2. Save CSV
              let csv = 'Session,Index,Time(ms),Formatted,Penalty,Scramble,Date\n';
              sessions.forEach((sess: any) => {
                sess.solves.forEach((s: any) => {
                  const ms = s.penalty === '+2' ? s.time + 2000 : s.time;
                  const sec = ms / 1000;
                  const formatted = s.penalty === 'DNF' ? 'DNF' : `${sec < 60 ? sec.toFixed(3) : Math.floor(sec / 60) + ':' + (sec % 60).toFixed(3).padStart(6, '0')}${s.penalty === '+2' ? '+' : ''}`;
                  csv += `"${sess.name}",${s.index},${s.time},"${formatted}","${s.penalty}","${(s.scramble || '').replace(/"/g, '""')}","${new Date(s.date).toISOString()}"\n`;
                });
              });
              const csvPath = path.join(recordsDir, 'solves.csv');
              fs.writeFileSync(csvPath, csv, 'utf-8');

              // 3. Save Human-readable Summary TXT
              let summaryTxt = `=== in Cube Timer 기록 요약 (저장일시: ${new Date().toLocaleString()}) ===\n\n`;
              sessions.forEach((sess: any) => {
                const total = sess.solves.length;
                const completed = sess.solves.filter((s: any) => s.penalty !== 'DNF').length;
                summaryTxt += `[모둠: ${sess.name}] 종목: ${sess.scrambleType} | 총 솔브: ${total}회 (완료: ${completed})\n`;
                if (sess.solves.length > 0) {
                  const last = sess.solves[sess.solves.length - 1];
                  const sec = last.time / 1000;
                  summaryTxt += `  마지막 솔브: #${last.index} - ${sec.toFixed(3)}s (${new Date(last.date).toLocaleTimeString()})\n`;
                }
                summaryTxt += '\n';
              });
              const summaryPath = path.join(recordsDir, 'summary.txt');
              fs.writeFileSync(summaryPath, summaryTxt, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: sessions.reduce((acc: number, s: any) => acc + s.solves.length, 0) }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });

      server.middlewares.use('/api/get-records', (req, res) => {
        if (req.method === 'GET') {
          try {
            const jsonPath = path.resolve(process.cwd(), 'records', 'solves.json');
            if (fs.existsSync(jsonPath)) {
              const data = fs.readFileSync(jsonPath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No records found' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localRecordSyncPlugin()],
  server: {
    port: 3000,
    open: false
  }
});
