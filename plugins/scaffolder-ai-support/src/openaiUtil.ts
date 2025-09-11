import OpenAI from 'openai';
import { ProjectSummary } from './detectProject';

// TODO: Replace with your real OpenAI API key for development/demo only
const HARDCODED_OPENAI_API_KEY: string = '';

export async function generatePipelineYAML({
  summary,
  userRequest,
  openaiApiKey, // ignored, but kept for API compatibility
  repositoryUrl,
}: {
  summary: string;
  userRequest: string;
  openaiApiKey?: string;
  repositoryUrl?: string;
}): Promise<string> {
  const projectInfo: ProjectSummary = JSON.parse(summary);

  console.log('🔍 DEBUGGING: API Key status:', HARDCODED_OPENAI_API_KEY ? 'Present' : 'EMPTY/MISSING');
  
  if (!HARDCODED_OPENAI_API_KEY || HARDCODED_OPENAI_API_KEY.trim() === '') {
    console.error('❌ NO OPENAI API KEY - This should fail!');
    // Let's see what happens when we try anyway...
  }

  const openai = new OpenAI({ apiKey: HARDCODED_OPENAI_API_KEY });

  const systemPrompt = buildSystemPrompt(projectInfo, repositoryUrl);
  const userPrompt = buildUserPrompt(userRequest);

  // Log prompts to verify they're being used
  console.log('🔍 System Prompt being sent to AI:');
  console.log(systemPrompt);
  console.log('\n🔍 User Prompt being sent to AI:');
  console.log(userPrompt);

  try {
    console.log('🚀 Attempting OpenAI API call...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });
    
    console.log('✅ OpenAI API call succeeded!');
    let content = response.choices[0]?.message?.content || '';
    console.log('📝 Raw response length:', content.length);
    
    // Post-process: remove markdown fences
    content = content
      .replace(/```yaml/g, '')
      .replace(/```/g, '')
      .trim();

    // Post-process: enforce "no env export" rule
    if (/echo\s+["']?PROJECT_ID=.*>>\s*\$GITHUB_ENV/i.test(content)) {
      console.warn('⚠️ AI attempted forbidden env var export. Stripping...');
      content = content.replace(/^.*echo.*GITHUB_ENV.*$/gim, '');
    }

    if (/\${{\s*env\.[A-Z_]+\s*}}/i.test(content)) {
      console.warn('⚠️ AI attempted to use env vars instead of secrets. Fixing...');
      content = content.replace(/\${{\s*env\.PROJECT_ID\s*}}/g, '${{ secrets.GCP_PROJECT_ID }}');
      content = content.replace(/\${{\s*env\.REGION\s*}}/g, '${{ secrets.GCP_REGION }}');
    }

    return content;
    
  } catch (error) {
    console.error('❌ OpenAI API call FAILED:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    // Let's see if it's still returning something somehow...
    throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSystemPrompt(projectInfo: ProjectSummary, repositoryUrl?: string): string {
  const projectType = projectInfo.type === 'nodejs' ? 'Node.js' : projectInfo.type;
  const packageManager = getPackageManager(projectInfo);
  const isBackstageProject = projectInfo.files.some(file => 
    file.includes('backstage.json') || 
    file.includes('@backstage/') || 
    file.includes('backstage-cli')
  );

  return `You are a GitHub Actions workflow generator. Create a **complete CI/CD pipeline** that builds, tests, and deploys to Google Cloud Run.

PROJECT CONTEXT:
- Project Type: ${projectType} application (${packageManager})
- Is Backstage Project: ${isBackstageProject ? 'Yes' : 'No'}
- Repository: ${repositoryUrl || 'Not specified'}
- Has Docker: ${projectInfo.hasDocker ? 'Yes' : 'No'}
- Has Tests: ${projectInfo.hasTests ? 'Yes' : 'No'}

AVAILABLE GITHUB SECRETS:
- GCP_SA_KEY (service account JSON)
- GCP_PROJECT_ID (project ID)
- GCP_REGION (region)
- OPENWEATHER_API_KEY (if needed)

🚨🚨 ABSOLUTELY CRITICAL RULES 🚨🚨

❌ FORBIDDEN PATTERNS:
- NEVER export secrets into env vars (>> $GITHUB_ENV).
- NEVER use \${{ env.PROJECT_ID }} or \${{ env.REGION }}.
- NEVER generate steps like:
  echo "PROJECT_ID=\${{ secrets.GCP_PROJECT_ID }}" >> $GITHUB_ENV

✅ REQUIRED PATTERNS:
- Authenticate Docker to Artifact Registry:
  run: gcloud auth configure-docker \${{ secrets.GCP_REGION }}-docker.pkg.dev

- Create Artifact Registry repository if it doesn't exist:
  run: gcloud artifacts repositories create \${{ github.event.repository.name }} --repository-format=docker --location=\${{ secrets.GCP_REGION }} --project=\${{ secrets.GCP_PROJECT_ID }} || echo "Repository may already exist"

- Build Docker image:
  run: docker build -t \${{ secrets.GCP_REGION }}-docker.pkg.dev/\${{ secrets.GCP_PROJECT_ID }}/\${{ github.event.repository.name }}/\${{ github.event.repository.name }}:latest .

- Test step (ALWAYS non-blocking):
  - name: Run tests
    run: npm test -- --passWithNoTests
    continue-on-error: true

📌 ARTIFACT REGISTRY RULES:
- **ALWAYS create the Artifact Registry repository** before building/pushing Docker images
- Use the same name as the GitHub repository: \`\${{ github.event.repository.name }}\`
- Include error handling: \`|| echo "Repository may already exist"\`
- Repository format should be: \`--repository-format=docker\`

📌 TESTING RULES:
- For **Backstage projects** (detected by @backstage packages or backstage.json): 
  * Use "yarn test" or "npm run test" as these use Backstage CLI internally
  * NEVER use NODE_ENV=test prefix as it causes permission issues
- For **standard Node.js projects**: Use appropriate test commands based on package manager
- **ALWAYS make test steps non-blocking** by adding \`continue-on-error: true\` to prevent workflow failure
- **FORBIDDEN COMMANDS**: 
  * \`NODE_ENV=test npm test\` - causes "Permission denied" errors
  * \`NODE_ENV=test jest\` - causes "Permission denied" errors
- **RECOMMENDED COMMANDS**:
  * For Backstage: \`yarn test\` or \`npm run test\` (depending on package manager)
  * For standard Node.js: \`npm test\` or \`yarn test\`
  * Add \`--passWithNoTests\` flag for jest-based projects: \`npm test -- --passWithNoTests\`
- **ALWAYS add \`continue-on-error: true\`** to test steps so workflow continues even if tests fail

📌 OUTPUT REQUIREMENTS:
- Use secrets directly in commands.
- Do NOT wrap YAML in markdown fences.
- Output only valid YAML, no commentary.

Now generate the final workflow.`;
}


function buildUserPrompt(userRequest: string): string {
  return userRequest;
}

function getPackageManager(project: ProjectSummary): string {
  if (project.files.includes('yarn.lock')) return 'yarn';
  if (project.files.includes('pnpm-lock.yaml')) return 'pnpm';
  if (project.files.includes('package-lock.json')) return 'npm (with lock)';
  if (project.type === 'nodejs') return 'npm (no lock)';
  return 'N/A';
}
