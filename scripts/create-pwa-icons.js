const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Created icons directory');
}

// Create a simple SVG icon as placeholder
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#28a745;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#20c997;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#gradient)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">C</text>
  <circle cx="256" cy="180" r="60" fill="white" opacity="0.9"/>
  <text x="256" y="200" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="#28a745">💰</text>
</svg>
`;

// Write SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);
console.log('✅ Created SVG icon');

// Create a simple HTML file to generate PNG icons
const iconGeneratorHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" width="512" height="512" style="display: none;"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#28a745');
        gradient.addColorStop(1, '#20c997');
        
        // Draw background
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Draw circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(256, 180, 60, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw money emoji
        ctx.font = '80px Arial';
        ctx.fillStyle = '#28a745';
        ctx.textAlign = 'center';
        ctx.fillText('💰', 256, 200);
        
        // Draw letter C
        ctx.font = 'bold 200px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('C', 256, 320);
        
        // Convert to different sizes and download
        const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
        
        sizes.forEach(size => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(canvas, 0, 0, size, size);
            
            const link = document.createElement('a');
            link.download = 'icon-' + size + 'x' + size + '.png';
            link.href = tempCanvas.toDataURL();
            link.click();
        });
        
        console.log('Icons generated successfully!');
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(iconsDir, 'generate-icons.html'), iconGeneratorHTML);
console.log('✅ Created icon generator HTML');

// Create a simple PNG icon using a basic approach
const createSimpleIcon = (size) => {
    // This is a placeholder - in a real implementation, you would use a library like canvas or sharp
    // For now, we'll create a simple text file as placeholder
    const iconData = `PNG Icon ${size}x${size} - Placeholder for GEMBOK-BILL Collector App`;
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png.txt`), iconData);
};

// Create placeholder icon files
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
    createSimpleIcon(size);
});

console.log('✅ Created placeholder icon files for all sizes');
console.log('\n📝 Note: To generate actual PNG icons, you can:');
console.log('1. Open public/icons/generate-icons.html in a browser');
console.log('2. Or use an online icon generator');
console.log('3. Or use a tool like ImageMagick or Sharp to convert the SVG');
console.log('\n🎯 PWA icons are ready for the collector app!');
