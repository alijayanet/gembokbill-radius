const fs = require('fs');
const path = require('path');

// Function to add mobile CSS to admin files
function addMobileCSSToAdminFiles() {
    const adminDir = path.join(__dirname, '../views/admin');
    const cssLink = '    <!-- Admin Mobile Optimizations -->\n    <link href="/css/admin-mobile.css" rel="stylesheet">';
    
    // Recursively find all .ejs files in admin directory
    function findEJSFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...findEJSFiles(fullPath));
            } else if (item.endsWith('.ejs')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }
    
    const ejsFiles = findEJSFiles(adminDir);
    let updatedCount = 0;
    
    console.log(`Found ${ejsFiles.length} EJS files in admin directory`);
    
    for (const filePath of ejsFiles) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Check if file already has mobile CSS
            if (content.includes('admin-mobile.css')) {
                console.log(`✓ ${path.relative(adminDir, filePath)} - Already has mobile CSS`);
                continue;
            }
            
            // Check if file has Bootstrap CSS (indicating it's a proper admin page)
            if (!content.includes('bootstrap') || !content.includes('<head>')) {
                console.log(`⚠ ${path.relative(adminDir, filePath)} - Skipped (not a standard admin page)`);
                continue;
            }
            
            // Find the last CSS link before </head>
            const headEndIndex = content.indexOf('</head>');
            if (headEndIndex === -1) {
                console.log(`⚠ ${path.relative(adminDir, filePath)} - No </head> tag found`);
                continue;
            }
            
            // Find the last link tag before </head>
            const linkRegex = /<link[^>]*>/g;
            let lastLinkIndex = -1;
            let match;
            
            while ((match = linkRegex.exec(content)) !== null) {
                if (match.index < headEndIndex) {
                    lastLinkIndex = match.index + match[0].length;
                }
            }
            
            if (lastLinkIndex === -1) {
                console.log(`⚠ ${path.relative(adminDir, filePath)} - No link tags found`);
                continue;
            }
            
            // Insert mobile CSS after the last link tag
            const beforeLink = content.substring(0, lastLinkIndex);
            const afterLink = content.substring(lastLinkIndex);
            
            const newContent = beforeLink + '\n' + cssLink + afterLink;
            
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✓ ${path.relative(adminDir, filePath)} - Mobile CSS added`);
            updatedCount++;
            
        } catch (error) {
            console.error(`✗ Error processing ${path.relative(adminDir, filePath)}:`, error.message);
        }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} admin files with mobile CSS`);
    console.log('📱 All admin pages will now hide headers on mobile for cleaner UI');
}

// Run the function
if (require.main === module) {
    addMobileCSSToAdminFiles();
}

module.exports = { addMobileCSSToAdminFiles };
