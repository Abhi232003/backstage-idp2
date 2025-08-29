
import OpenAI from 'openai';


// TODO: Replace with your real OpenAI API key for development/demo only
const HARDCODED_OPENAI_API_KEY = '';

export async function generatePipelineYAML({
  summary,
  userRequest,
  openaiApiKey, // ignored, but kept for API compatibility
}: {
  summary: string;
  userRequest: string;
  openaiApiKey?: string;
}): Promise<string> {
  const openai = new OpenAI({ apiKey: HARDCODED_OPENAI_API_KEY });
  
  const availableSecrets = `Available GitHub Secrets (use these exact names):
- GCP_PROJECT_ID (Google Cloud Project ID)
- GCP_REGION (Google Cloud Region)
- GCP_SA_KEY (Google Cloud Service Account Key)
- OPENWEATHER_API_KEY (OpenWeather API Key)`;

  const recommendedActions = `Use these CURRENT, TESTED GitHub Actions (use exact versions):
- actions/checkout@v4 (for code checkout)
- actions/setup-node@v4 (for Node.js setup)
- actions/setup-python@v5 (for Python setup)
- google-github-actions/auth@v2 (for Google Cloud authentication)
- google-github-actions/setup-gcloud@v2 (for Google Cloud CLI setup)
- docker/build-push-action@v5 (for Docker builds)
- docker/setup-buildx-action@v3 (for Docker buildx)

IMPORTANT: 
- Never use @master, @main, or @latest tags
- Always use specific version tags (like @v4, @v2, etc.)
- For GCP deployment, use the auth@v2 and setup-gcloud@v2 actions
- Use 'google-github-actions/auth@v2' with credentials_json: \${{ secrets.GCP_SA_KEY }}
- Use 'google-github-actions/setup-gcloud@v2' for gcloud CLI setup
- For Docker registry authentication with GCR, add: gcloud auth configure-docker gcr.io
- Use \${{ github.sha }} for unique image tags instead of 'latest'
- Include proper authentication steps before pushing to GCR`;

  const prompt = `Project summary:\n${summary}\n\nUser request: ${userRequest}\n\n${availableSecrets}\n\n${recommendedActions}\n\nGenerate a GitHub Actions pipeline YAML for this project that uses the available secrets where appropriate and the recommended actions with their exact versions. Use the exact secret names provided. Only output the YAML content with proper formatting - no explanations, no code blocks, no markdown formatting.`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { 
        role: 'system', 
        content: 'You are a GitHub Actions expert. Generate only valid YAML content for GitHub Actions workflows using current, tested action versions. Do not include explanations, markdown formatting, or code blocks. Output only the raw YAML. Always use specific version tags like @v4, @v2, never use @master or @latest.' 
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2048,
    temperature: 0.2,
  });
  
  const content = response.choices[0]?.message?.content || '';
  
  // Clean up the response to ensure it's only YAML
  const cleanContent = content
    .replace(/```yaml/g, '')
    .replace(/```/g, '')
    .trim();
  
  return cleanContent;
}
