import fs from 'fs';
import path from 'path';

export type ProjectSummary = {
  type: string;
  framework?: string;
  buildTool?: string;
  hasDocker: boolean;
  hasTests: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  files: string[];
  structure: string[];
  nodeVersion?: string;
  pythonVersion?: string;
};

export function detectProject(repoPath: string): ProjectSummary {
  const files = fs.readdirSync(repoPath);
  const structure = getProjectStructure(repoPath, 2); // Get 2 levels deep
  
  let type = 'unknown';
  let framework = '';
  let buildTool = '';
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let scripts: Record<string, string> = {};
  let nodeVersion = '';
  let pythonVersion = '';

  // Enhanced Node.js detection
  if (files.includes('package.json')) {
    type = 'nodejs';
    const pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
    dependencies = pkg.dependencies || {};
    devDependencies = pkg.devDependencies || {};
    scripts = pkg.scripts || {};
    nodeVersion = pkg.engines?.node || '';
    
    // Detect framework
    if (dependencies['react'] || devDependencies['react']) framework = 'React';
    else if (dependencies['vue'] || devDependencies['vue']) framework = 'Vue.js';
    else if (dependencies['angular'] || devDependencies['angular']) framework = 'Angular';
    else if (dependencies['next'] || devDependencies['next']) framework = 'Next.js';
    else if (dependencies['express'] || devDependencies['express']) framework = 'Express.js';
    else if (dependencies['nestjs'] || devDependencies['nestjs']) framework = 'NestJS';
    else if (dependencies['@backstage/core-components']) framework = 'Backstage';
    
    // Detect build tool
    if (files.includes('webpack.config.js')) buildTool = 'Webpack';
    else if (files.includes('vite.config.js') || files.includes('vite.config.ts')) buildTool = 'Vite';
    else if (files.includes('rollup.config.js')) buildTool = 'Rollup';
    else if (dependencies['@parcel/core']) buildTool = 'Parcel';
  }
  
  // Enhanced Python detection
  else if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
    type = 'python';
    
    if (files.includes('requirements.txt')) {
      const reqs = fs.readFileSync(path.join(repoPath, 'requirements.txt'), 'utf8').split('\n');
      dependencies = Object.fromEntries(
        reqs.filter(Boolean).map(line => {
          const [name, version] = line.split(/[==>=<]/);
          return [name.trim(), version?.trim() || 'latest'];
        })
      );
    }
    
    // Detect Python framework
    if (dependencies['django'] || dependencies['Django']) framework = 'Django';
    else if (dependencies['flask'] || dependencies['Flask']) framework = 'Flask';
    else if (dependencies['fastapi'] || dependencies['FastAPI']) framework = 'FastAPI';
    else if (dependencies['streamlit']) framework = 'Streamlit';
    
    // Detect build tool
    if (files.includes('pyproject.toml')) buildTool = 'Poetry/setuptools';
    else if (files.includes('setup.py')) buildTool = 'setuptools';
    else if (files.includes('Pipfile')) buildTool = 'Pipenv';
  }
  
  // .NET detection
  else if (files.some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) {
    type = '.net';
    framework = 'ASP.NET Core';
    buildTool = 'dotnet';
  }
  
  // Java detection
  else if (files.includes('pom.xml')) {
    type = 'java';
    framework = 'Maven';
    buildTool = 'Maven';
  } else if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
    type = 'java';
    framework = 'Gradle';
    buildTool = 'Gradle';
  }
  
  // Go detection
  else if (files.includes('go.mod')) {
    type = 'go';
    buildTool = 'go';
  }

  const hasDocker = files.includes('Dockerfile') || files.includes('docker-compose.yml');
  const hasTests = detectTests(files, dependencies, devDependencies);

  return { 
    type, 
    framework, 
    buildTool, 
    hasDocker, 
    hasTests, 
    dependencies, 
    devDependencies, 
    scripts, 
    files, 
    structure,
    nodeVersion,
    pythonVersion
  };
}

function getProjectStructure(dirPath: string, maxDepth: number, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth) return [];
  
  const structure: string[] = [];
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      if (item.startsWith('.') && !['github', 'gitignore', 'env'].some(key => item.includes(key))) continue;
      
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        structure.push(`${item}/`);
        if (currentDepth < maxDepth - 1) {
          const subItems = getProjectStructure(itemPath, maxDepth, currentDepth + 1);
          structure.push(...subItems.map(sub => `${item}/${sub}`));
        }
      } else {
        structure.push(item);
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }
  
  return structure;
}

function detectTests(files: string[], dependencies: Record<string, string>, devDependencies: Record<string, string>): boolean {
  // Check for test files
  const hasTestFiles = files.some(file => 
    file.includes('test') || 
    file.includes('spec') || 
    file.includes('__tests__')
  );
  
  // Check for test dependencies
  const testDeps = ['jest', 'mocha', 'chai', 'pytest', 'unittest', 'vitest', 'cypress', 'playwright'];
  const hasTestDeps = testDeps.some(dep => 
    dependencies[dep] || devDependencies[dep]
  );
  
  return hasTestFiles || hasTestDeps;
}
