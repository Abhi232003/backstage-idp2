import fs from 'fs';
import path from 'path';

export type ProjectSummary = {
  type: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  files: string[];
};

export function detectProject(repoPath: string): ProjectSummary {
  const files = fs.readdirSync(repoPath);
  let type = 'unknown';
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};

  if (files.includes('package.json')) {
    type = 'nodejs';
    const pkg = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
    dependencies = pkg.dependencies || {};
    devDependencies = pkg.devDependencies || {};
  } else if (files.includes('requirements.txt')) {
    type = 'python';
    const reqs = fs.readFileSync(path.join(repoPath, 'requirements.txt'), 'utf8').split('\n');
    dependencies = Object.fromEntries(reqs.filter(Boolean).map(line => [line.split('==')[0], line.split('==')[1] || 'latest']));
  } else if (files.includes('*.csproj')) {
    type = '.net';
    // .NET detection logic can be expanded
  }

  return { type, dependencies, devDependencies, files };
}
