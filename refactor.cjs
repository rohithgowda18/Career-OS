const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? lock = walk(dirPath, callback) : callback(dirPath);
    });
}

walk('./apps/web/src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        // Fix @shared/* to @/types/* (mostly)
        newContent = newContent.replace(/@shared\/_core\/errors/g, "@/lib/errors");
        newContent = newContent.replace(/@shared\/const/g, "@/constants/shared-const");
        newContent = newContent.replace(/@shared\//g, "@/types/");
        
        // Fix @/_core/hooks to @/hooks
        newContent = newContent.replace(/@\/_core\/hooks/g, "@/hooks");
        
        // Fix @/const to @/constants/app-const
        newContent = newContent.replace(/@\/const/g, "@/constants/app-const");
        
        if (content !== newContent) {
            console.log(`Updated: ${filePath}`);
            fs.writeFileSync(filePath, newContent);
        }
    }
});
console.log("Refactoring complete");
