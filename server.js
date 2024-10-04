import express from 'express';
import { createRequire } from 'module';
import { exec } from 'child_process';  // Add this line

const require = createRequire(import.meta.url);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape', (req, res) => {
  const { action, hashtag, count = 10 } = req.body;
  const cliPort = 10001;

  console.log(`[${new Date().toISOString()}] Received scrape request: action=${action}, hashtag=${hashtag}, count=${count}`);
  
  const commandToExecute = `CLI_PORT=${cliPort} node bin/cli.js scrape --type=${action} --input=${hashtag} --count=${count}`;
  console.log(`[${new Date().toISOString()}] Executing command: ${commandToExecute}`);
  
  const child = exec(commandToExecute, {
    timeout: 300000 // 5 minutes timeout
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Exec error: ${error}`);
      return res.status(500).json({ error: error.message, stderr });
    }
    console.log(`[${new Date().toISOString()}] Command completed. Stdout: ${stdout}`);
    
    try {
      // Try to parse the JSON output from the CLI
      const jsonOutput = stdout.split('\n').filter(line => line.trim().startsWith('{')).pop();
      if (jsonOutput) {
        const result = JSON.parse(jsonOutput);
        if (result.success) {
          res.json(result.data);
        } else {
          res.status(500).json({ error: result.error || result.message });
        }
      } else {
        throw new Error('No valid JSON output found');
      }
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] Error parsing CLI output:`, parseError);
      res.status(500).json({ error: 'Failed to parse scraper output', stdout, stderr });
    }
  });

  child.stdout.on('data', (data) => {
    console.log(`[${new Date().toISOString()}] Child process stdout: ${data.trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[${new Date().toISOString()}] Child process stderr: ${data.trim()}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[${new Date().toISOString()}] Child process exited with code ${code} and signal ${signal}`);
  });
});

app.get('/', (req, res) => {
  res.send('TikTok Scraper is running. Send a POST request to /scrape to start scraping.');
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});