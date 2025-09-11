# Scaffolder AI Support Plugin

This plugin provides AI-powered pipeline generation for the Backstage scaffolder using OpenAI's GPT models.

## Features

### 🎯 Context-Aware Pipeline Generation
- **Smart Project Detection**: Automatically detects project type, framework, build tools, and dependencies
- **Framework-Specific Pipelines**: Tailored workflows for React, Vue.js, Angular, Express.js, Flask, Django, and more
- **Technology Stack Analysis**: Recognizes testing frameworks, containerization, and deployment patterns

### 🚀 Modern CI/CD Best Practices
- **Google Artifact Registry**: Uses modern Artifact Registry instead of deprecated GCR
- **Secure Authentication**: Proper GCP service account integration with GitHub secrets
- **Multi-Environment Support**: Production-ready deployments with staging environments
- **Container Optimization**: Multi-stage Docker builds and security scanning

### 🤖 AI-Powered Intelligence
- **Contextual Prompts**: Concise, structured prompts that provide relevant project context
- **Variation in Outputs**: Higher temperature settings prevent repetitive pipeline generation
- **User Request Integration**: Combines project analysis with specific user requirements

## Supported Project Types

| Type | Frameworks | Build Tools | Features |
|------|------------|-------------|----------|
| **Node.js** | React, Vue.js, Angular, Next.js, Express.js, NestJS, Backstage | npm, yarn, Webpack, Vite, Rollup, Parcel | Package management, testing, bundling |
| **Python** | Django, Flask, FastAPI, Streamlit | pip, Poetry, Pipenv | Virtual environments, testing with pytest |
| **.NET** | ASP.NET Core | dotnet | NuGet packages, MSBuild |
| **Java** | Spring Boot, Maven, Gradle | Maven, Gradle | Dependency management, testing |
| **Go** | Standard library, Gin, Echo | go mod | Module management, testing |

## Installation

1. Add the action to your Backstage scaffolder backend:

```ts
import { aiGeneratePipelineAction } from '@backstage/plugin-scaffolder-ai-support';

scaffolder.addActions([
  aiGeneratePipelineAction,
]);
```

## Actions

### `ai:generate-pipeline`

Generates a GitHub Actions pipeline YAML using OpenAI and optionally creates a Pull Request.

#### Usage in Templates

```yaml
- id: generate-pipeline
  name: Generate AI Pipeline
  action: ai:generate-pipeline
  input:
    repoPath: ${{ parameters.repoPath }}
    userRequest: ${{ parameters.userRequest }}
    openaiApiKey: ${{ secrets.OPENAI_API_KEY }}
    pipelineFileName: ci-cd.yml  # optional
    createPullRequest: true      # optional
    owner: ${{ parameters.owner }}
    repo: ${{ parameters.repo }}
```

#### Required Secrets

Configure these secrets in your GitHub repository:

| Secret | Description | Example |
|--------|-------------|---------|
| `GCP_PROJECT_ID` | Google Cloud Project ID | `my-project-123` |
| `GCP_REGION` | Target GCP region | `us-central1` |
| `GCP_SA_KEY` | Service Account JSON key | `{"type": "service_account"...}` |

#### Output

- `pipelineContent`: The generated pipeline YAML content
- `filePath`: Path where the pipeline was saved
- `projectSummary`: Detailed analysis of the project structure
- `pullRequestCreated`: Whether a PR was successfully created
- `branchName`: Name of the created branch (if PR was created)

## Enhanced Project Analysis

The plugin now performs comprehensive project analysis:

### Detection Capabilities
- **Project Type**: Node.js, Python, .NET, Java, Go
- **Framework Detection**: React, Angular, Vue.js, Express.js, Flask, Django, etc.
- **Build Tools**: Webpack, Vite, Maven, Gradle, Poetry, etc.
- **Testing Setup**: Jest, Mocha, pytest, JUnit detection
- **Containerization**: Docker and docker-compose detection
- **Project Structure**: Directory layout and configuration files

### Context-Aware Features
- **Dependency Analysis**: Key packages and their versions
- **Script Detection**: Available npm/package.json scripts
- **Configuration Files**: Identifies important config files
- **Environment Setup**: Node.js/Python version requirements

## Example Generated Pipeline

### React Application with Vite
```yaml
name: CI/CD Pipeline for React App

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ secrets.GCP_REGION }}-docker.pkg.dev
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.GCP_REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/app-repo/react-app:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy react-app \
            --image ${{ secrets.GCP_REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/app-repo/react-app:${{ github.sha }} \
            --platform managed \
            --region ${{ secrets.GCP_REGION }} \
            --allow-unauthenticated
```

## Configuration

Add to your `app-config.yaml`:

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}

scaffolder:
  actions:
    - name: ai:generate-pipeline
      description: Generate AI-powered GitHub Actions pipeline
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
# Run the test script to validate AI improvements
node test-ai-pipeline.js
```

## Version 2.0 Improvements

### 🔧 Technical Enhancements
- **Better Project Detection**: Enhanced analysis of project structure and dependencies
- **Structured Prompts**: Modular, context-aware prompt generation
- **Higher Variation**: Increased temperature (0.4) for more diverse outputs
- **Modern Actions**: Updated to latest GitHub Actions versions

### 🎯 User Experience
- **Detailed Logging**: Better visibility into project analysis and generation process
- **Enhanced PR Descriptions**: Rich pull request descriptions with project analysis
- **Artifact Registry**: Default to Google Artifact Registry over deprecated GCR
- **Framework-Specific**: Tailored pipelines based on detected frameworks

### 🚀 Quality Improvements
- **Context Utilization**: Better use of project context in pipeline generation
- **Request Integration**: Seamless integration of user requirements with project analysis
- **Error Handling**: Improved error reporting and debugging capabilities
- **Validation**: Built-in testing and validation scripts

## Requirements
- Node.js 18+
- OpenAI API Key
- Backstage 1.20+ (Scaffolder v2)
- GitHub integration for PR creation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run build && node test-ai-pipeline.js`
5. Submit a pull request

## License

Apache 2.0
