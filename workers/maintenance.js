export default {
  async fetch(request) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance | Character Printer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --base:      #0f0e0d;
      --elevated:  #1a1917;
      --edge:      #252320;
      --accent:    #c4a35a;
      --fg:        #f4f1ec;
      --fg-muted:  #a89f94;
      --fg-subtle: #635d56;
    }

    body {
      background: var(--base);
      color: var(--fg);
      font-family: 'Geist', Arial, sans-serif;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: var(--base);
      border-bottom: 1px solid var(--edge);
      height: 4rem;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
    }

    .wordmark {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--fg);
      text-decoration: none;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1.5rem;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--fg-subtle);
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--fg);
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.1rem;
      color: var(--fg-muted);
      line-height: 1.7;
      max-width: 28rem;
      margin-bottom: 3rem;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .dot {
      position: relative;
      width: 0.625rem;
      height: 0.625rem;
      flex-shrink: 0;
    }

    .dot-ping {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: var(--accent);
      opacity: 0.6;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .dot-core {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 9999px;
      background: var(--accent);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
  </style>
</head>
<body>
  <header>
    <span class="wordmark">Character Printer</span>
  </header>

  <main>
    <p class="label">Please hold</p>
    <h1>Back in a moment</h1>
    <p>
      We're updating your character sheets.<br>
      The site will be back up in a few minutes.
    </p>
    <div class="status">
      <span class="dot">
        <span class="dot-ping"></span>
        <span class="dot-core"></span>
      </span>
      Deploying update
    </div>
  </main>
</body>
</html>`;

    return new Response(html, {
      status: 503,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'Retry-After': '120',
      },
    });
  },
};
