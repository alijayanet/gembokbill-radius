const fs = require('fs');
const path = require('path');

const agentViewsDir = path.join(__dirname, '../views/agent');
const pwaMetaTags = `    <!-- PWA Meta Tags -->
    <meta name="description" content="Dashboard agent untuk sistem billing GEMBOK-BILL">
    <meta name="theme-color" content="#667eea">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Agent">
    <meta name="msapplication-TileColor" content="#667eea">
    <meta name="msapplication-tap-highlight" content="no">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest-agent.json">
    
    <!-- PWA Icons -->
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">`;

const pwaCSS = `    <link href="/css/agent-pwa.css" rel="stylesheet">`;
const pwaJS = `    <script src="/js/agent-pwa.js"></script>`;

function addPWAToAgentFiles(dir) {
    let updatedFilesCount = 0;
    let skippedFilesCount = 0;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            const { updated, skipped } = addPWAToAgentFiles(filePath);
            updatedFilesCount += updated;
            skippedFilesCount += skipped;
        } else if (file.endsWith('.ejs')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // Check if it already has PWA meta tags
            if (content.includes('manifest-agent.json')) {
                console.log(`✓ ${path.relative(agentViewsDir, filePath)} - Already has PWA meta tags`);
                skippedFilesCount++;
                return;
            }

            let newContent = content;
            let hasChanges = false;

            // Add PWA meta tags after viewport meta tag
            const viewportRegex = /<meta name="viewport"[^>]*>/;
            if (viewportRegex.test(content)) {
                newContent = newContent.replace(viewportRegex, match => match + '\n' + pwaMetaTags);
                hasChanges = true;
            }

            // Add PWA CSS after Bootstrap CSS
            const bootstrapCSSRegex = /<link href="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@[^"]*\/dist\/css\/bootstrap\.min\.css"[^>]*>/;
            if (bootstrapCSSRegex.test(newContent)) {
                newContent = newContent.replace(bootstrapCSSRegex, match => match + '\n' + pwaCSS);
                hasChanges = true;
            }

            // Add PWA JS before closing body tag
            const bodyCloseRegex = /<\/body>/;
            if (bodyCloseRegex.test(newContent)) {
                newContent = newContent.replace(bodyCloseRegex, pwaJS + '\n</body>');
                hasChanges = true;
            }

            if (hasChanges) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`✓ ${path.relative(agentViewsDir, filePath)} - PWA features added`);
                updatedFilesCount++;
            } else {
                console.log(`⚠ ${path.relative(agentViewsDir, filePath)} - No suitable place found for PWA tags`);
                skippedFilesCount++;
            }
        }
    });

    return { updated: updatedFilesCount, skipped: skippedFilesCount };
}

console.log('Adding PWA features to agent files...');
const { updated, skipped } = addPWAToAgentFiles(agentViewsDir);
console.log(`\n✅ Successfully updated ${updated} agent files with PWA features`);
if (skipped > 0) {
    console.log(`⚠️ Skipped ${skipped} files.`);
}
console.log('📱 All agent pages now have PWA capabilities!');
