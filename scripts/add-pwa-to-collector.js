const fs = require('fs');
const path = require('path');

const collectorViewsDir = path.join(__dirname, '../views/collector');
const pwaMetaTags = `    <!-- PWA Meta Tags -->
    <meta name="description" content="Dashboard tukang tagih untuk sistem billing GEMBOK-BILL">
    <meta name="theme-color" content="#28a745">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Collector">
    <meta name="msapplication-TileColor" content="#28a745">
    <meta name="msapplication-tap-highlight" content="no">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest-collector.json">
    
    <!-- PWA Icons -->
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">`;

const pwaCSS = `    <link href="/css/collector-pwa.css" rel="stylesheet">`;
const pwaJS = `    <script src="/js/collector-pwa.js"></script>`;

function addPWAToCollectorFiles(dir) {
    let updatedFilesCount = 0;
    let skippedFilesCount = 0;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            const { updated, skipped } = addPWAToCollectorFiles(filePath);
            updatedFilesCount += updated;
            skippedFilesCount += skipped;
        } else if (file.endsWith('.ejs')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // Check if it already has PWA meta tags
            if (content.includes('manifest-collector.json')) {
                console.log(`✓ ${path.relative(collectorViewsDir, filePath)} - Already has PWA meta tags`);
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
                console.log(`✓ ${path.relative(collectorViewsDir, filePath)} - PWA features added`);
                updatedFilesCount++;
            } else {
                console.log(`⚠ ${path.relative(collectorViewsDir, filePath)} - No suitable place found for PWA tags`);
                skippedFilesCount++;
            }
        }
    });

    return { updated: updatedFilesCount, skipped: skippedFilesCount };
}

console.log('Adding PWA features to collector files...');
const { updated, skipped } = addPWAToCollectorFiles(collectorViewsDir);
console.log(`\n✅ Successfully updated ${updated} collector files with PWA features`);
if (skipped > 0) {
    console.log(`⚠️ Skipped ${skipped} files.`);
}
console.log('📱 All collector pages now have PWA capabilities!');
