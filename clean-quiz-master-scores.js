#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'server', 'data');

function cleanQuizMasterScores() {
  console.log('🧹 Cleaning quiz master scores from data files...');

  // Clean room-specific score files
  const files = fs.readdirSync(dataDir);
  files.forEach(file => {
    if (file.startsWith('room-') && file.endsWith('-scores.json')) {
      const filePath = path.join(dataDir, file);
      try {
        const scores = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const cleaned = {};
        
        // Remove any score entries that look like quiz master IDs
        Object.entries(scores).forEach(([playerId, score]) => {
          if (!playerId.startsWith('quiz_master_')) {
            cleaned[playerId] = score;
          } else {
            console.log(`  ❌ Removed quiz master score: ${playerId} (${score} points)`);
          }
        });
        
        fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
        console.log(`  ✅ Cleaned ${file}`);
      } catch (error) {
        console.error(`  ⚠️  Error processing ${file}:`, error.message);
      }
    }
  });

  console.log('✨ Cleanup complete!');
}

cleanQuizMasterScores();