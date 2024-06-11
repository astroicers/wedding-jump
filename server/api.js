import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import cors from 'cors';

const app = express();
const port = 3002;

app.use(cors()); // 啟用 CORS 支持

app.get('/questions', (req, res) => {
  const results = [];
  fs.createReadStream('server/questions.csv') // 確認路徑正確
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log('CSV Data:', results); // 調試輸出
      res.json(results);
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to read CSV file' });
    });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
