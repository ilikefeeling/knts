import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let hasError = false;

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Rule 1: get* 함수 내에서 insert, update, delete 사용 금지 (간이 검사)
  // 정규식으로 get으로 시작하는 함수 블록을 대략적으로 찾습니다.
  const getFunctionRegex = /(?:export\s+)?(?:async\s+)?function\s+(get[A-Za-z0-9_]+)\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/g;
  
  let match;
  while ((match = getFunctionRegex.exec(content)) !== null) {
    const funcName = match[1];
    const funcBody = match[2];
    
    if (funcBody.includes('.insert(') || funcBody.includes('.update(') || funcBody.includes('.delete(')) {
      console.log(`${RED}❌ [Rule Violation]${RESET} File: ${filePath}`);
      console.log(`   Function '${funcName}' appears to perform mutation (.insert/.update/.delete).`);
      console.log(`   'get' functions MUST be pure and only read data.`);
      hasError = true;
    }
  }
}

console.log(`${YELLOW}Scanning codebase for anti-patterns...${RESET}`);

const libFiles = scanDirectory(path.join(process.cwd(), 'lib'));
const appFiles = scanDirectory(path.join(process.cwd(), 'app'));

const allFiles = [...libFiles, ...appFiles];

for (const file of allFiles) {
  checkFile(file);
}

if (hasError) {
  console.error(`${RED}Code Verification Failed. Please fix the anti-patterns above.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ Code Verification Passed! No obvious anti-patterns found.${RESET}`);
}
