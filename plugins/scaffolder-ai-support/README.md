# Backstage Scaffolder AI Support Plugin

This plugin provides a custom Backstage scaffolder action to:
- Detect the stack and dependencies of a checked-out repository
- Summarize the project
- Combine the summary with a user request (e.g., 'generate GitHub Actions pipeline')
- Call OpenAI to generate a pipeline YAML
- Save the YAML to `.github/workflows/` in the repo

## Usage

1. Add the action to your Backstage scaffolder backend:

```ts
import { aiGeneratePipelineAction } from '@backstage/plugin-scaffolder-ai-support';

scaffolder.addActions([
  aiGeneratePipelineAction,
]);
```

2. In your template, add a step:

```yaml
- id: ai-generate-pipeline
  name: Generate Pipeline with AI
  action: ai:generate-pipeline
  input:
    repoPath: ${{ parameters.repoPath }}
    userRequest: ${{ parameters.userRequest }}
    openaiApiKey: ${{ secrets.OPENAI_API_KEY }}
    pipelineFileName: generated-pipeline.yml
```

## Requirements
- Node.js 18+
- OpenAI API Key
- Backstage 1.20+ (Scaffolder v2)
