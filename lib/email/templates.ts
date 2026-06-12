// Hex approximations of the site's oklch CSS variables (light mode)
const C = {
  primary: "#2C1A09",         // oklch(0.23 0.040 52) — dark brown
  primaryFg: "#F8F5F0",       // oklch(0.97 0.007 75) — cream
  bg: "#F6F3EE",              // oklch(0.97 0.008 75) — warm page bg
  card: "#FEFCF9",            // oklch(0.995 0.003 75) — card surface
  border: "#D3C7B5",          // oklch(0.83 0.018 68) — warm tan border
  fg: "#231508",              // oklch(0.14 0.025 52) — near-black warm
  muted: "#7A6E5E",           // oklch(0.49 0.022 55) — muted warm gray
  destructive: "#C0392B",     // oklch(0.577 0.245 27) — red
}

const d20Svg = `
<svg viewBox="0 0 200 230" width="40" height="46" style="display:block;margin:0 auto 8px auto;" fill="none" stroke="${C.primaryFg}" stroke-width="6" stroke-linejoin="round">
  <polygon points="100,5 195,57 195,173 100,225 5,173 5,57"/>
  <polygon points="100,5 147,57 100,85 53,57"/>
  <polygon points="195,57 147,57 100,85 195,173"/>
  <polygon points="5,57 53,57 100,85 5,173"/>
  <polygon points="100,85 147,57 195,173 100,225"/>
  <polygon points="100,85 53,57 5,173 100,225"/>
</svg>`

function wrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Character Printer</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
        <!-- Header band -->
        <tr>
          <td style="background:${C.primary};padding:32px 40px 24px;text-align:center;">
            ${d20Svg}
            <div style="font-family:Georgia,serif;font-size:18px;font-weight:bold;letter-spacing:0.25em;text-transform:uppercase;color:${C.primaryFg};margin-bottom:4px;">Character Printer</div>
          </td>
        </tr>
        <!-- Ornament rule -->
        <tr>
          <td style="padding:20px 40px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:1px;background:${C.border};"></td>
                <td style="padding:0 12px;white-space:nowrap;font-family:Georgia,serif;font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${C.muted};">Message</td>
                <td style="height:1px;background:${C.border};"></td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:24px 40px 40px;color:${C.fg};">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid ${C.border};padding:16px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:${C.muted};font-family:Georgia,serif;">
              If you didn&apos;t create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function verificationEmail(username: string, verifyUrl: string): string {
  return wrapper(`
    <p style="margin:0 0 8px;font-size:20px;font-weight:bold;font-family:Georgia,serif;">Welcome, ${username}!</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.muted};">Your account has been created. Verify your email address to access the forge.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block;background:${C.primary};color:${C.primaryFg};text-decoration:none;padding:12px 32px;border-radius:8px;font-family:Georgia,serif;font-size:14px;letter-spacing:0.1em;font-weight:bold;">Verify Email Address</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:${C.muted};line-height:1.5;">Button not working? Copy and paste this link:<br/>
      <a href="${verifyUrl}" style="color:${C.primary};word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:${C.muted};">This link expires in 24 hours.</p>
  `)
}

export function resendVerificationEmail(username: string, verifyUrl: string): string {
  return wrapper(`
    <p style="margin:0 0 8px;font-size:20px;font-weight:bold;font-family:Georgia,serif;">New verification link</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.muted};">Here&apos;s a fresh link for ${username}. The previous one has been invalidated.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block;background:${C.primary};color:${C.primaryFg};text-decoration:none;padding:12px 32px;border-radius:8px;font-family:Georgia,serif;font-size:14px;letter-spacing:0.1em;font-weight:bold;">Verify Email Address</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:${C.muted};line-height:1.5;">Button not working? Copy and paste this link:<br/>
      <a href="${verifyUrl}" style="color:${C.primary};word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:${C.muted};">This link expires in 24 hours.</p>
  `)
}
