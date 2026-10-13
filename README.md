# ZERO CHEATS OFFICIAL — GitHub Pages starter

## What's included
- Responsive dark/neon storefront
- Product cards and selectable duration/price plans
- Buy Now modal with bKash/Nagad selection
- Transaction last-4 digits, Discord username, and screenshot input
- Responsive mobile layout and animations

## 1. Update payment numbers
Open `script.js` and replace:
- `ADD_YOUR_BKASH_NUMBER`
- `ADD_YOUR_NAGAD_NUMBER`

## 2. Publish on GitHub Pages
1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Choose `main` and `/ (root)`, then Save.
6. Wait for the Pages URL to appear.

## Important: order delivery is not connected yet
GitHub Pages is static hosting. This starter deliberately does not send order data anywhere.
To send order details and screenshot to a private Discord channel, connect a secure backend/serverless function (for example, a Cloudflare Worker) that:
- keeps the Discord webhook URL as a server-side secret,
- validates fields and file type/size,
- uploads the screenshot safely,
- rate-limits requests and avoids logging sensitive details.

Never paste a Discord webhook URL or bot token into `script.js` or any public GitHub file. Test with fake details before accepting real payments. Do not request or store payment PINs or OTPs.
