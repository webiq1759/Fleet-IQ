import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const BOT_USER_AGENTS = [
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
    'telegrambot',
    'linkedinbot',
    'pinterestbot',
    'slackbot',
    'discordbot',
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'baiduspider',
    'facebot',
    'ia_archiver'
];

export default async function handler(req, res) {
    const { id } = req.query; // comes from the rewrite destination ?id=$1
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    // Dynamically get the host to avoid mismatching canonical URLs (e.g., www vs non-www)
    const host = req.headers.host || 'fleetiq.cc';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Strict enforcement of the assets route
    const url = `${protocol}://${host}/assets/${id}`;

    // 1. Check if the requester is a bot
    const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

    // 2. If it's a normal human browser, redirect them instantly back to the React App path.
    // We add ?og=1 so Vercel.json knows to bypass this SEO proxy and route straight to index.html
    if (!isBot) {
        return res.redirect(302, `${url}?og=1`);
    }

    if (!id) {
        return res.status(400).send('Missing Asset ID');
    }

    try {
        // Fetch the asset from Supabase since this is a Serverless backend
        const { data: asset, error } = await supabase
            .from('assets')
            .select('title, description, image_url')
            .eq('id', id)
            .single();

        if (error || !asset) {
            // Asset not found, redirect to homepage
            return res.redirect(302, 'https://fleetiq.cc');
        }

        const description = asset.description ?
            asset.description.substring(0, 160) + (asset.description.length > 160 ? '...' : '')
            : 'Premium asset rental on Fleet IQ';

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>${asset.title} - Fleet IQ</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="${asset.title} - Fleet IQ" />
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="FleetIQ" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${asset.title} - Fleet IQ" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${asset.image_url}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${asset.title} - Fleet IQ" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${asset.image_url}" />

    <!-- Fallback if a human somehow triggered this -->
    <script>
        window.location.replace("${url}?og=1");
    </script>
</head>
<body>
    <p>Redirecting to <a href="${url}?og=1">Fleet IQ</a>...</p>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache on Vercel Edge for 1hr
        return res.status(200).send(html);

    } catch (err) {
        console.error("SEO Proxy Error:", err);
        return res.redirect(302, 'https://fleetiq.cc');
    }
}
