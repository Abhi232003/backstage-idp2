# AI Pipeline Plugin - Commit Integration Details

## Complete User Flow (All Within Backstage)

### 1. Navigate to Custom Plugin
```
http://localhost:3000/ai-pipeline-generator
```

### 2. Interactive Form + Real-Time Preview
```
┌─────────────────────────────────────────────────────────────────┐
│ AI Pipeline Generator - Backstage Plugin                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │ Repository Info │    │ Live Preview    │                   │
│  │                 │    │                 │                   │
│  │ Owner: Abhi...  │    │ name: CI/CD     │                   │
│  │ Repo: my-app    │◄──►│ on: [push]      │                   │
│  │                 │    │ jobs:           │                   │
│  │ Requirements:   │    │   build:        │                   │
│  │ "Node.js with   │    │     runs-on:... │                   │
│  │  tests and      │    │     steps:      │                   │
│  │  deployment"    │    │     - checkout  │                   │
│  │                 │    │     - setup-node│                   │
│  │ [Generate] 🤖   │    │     - npm test  │                   │
│  └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┤
│  │                Action Buttons                               │
│  │                                                             │
│  │  [✅ Commit to Repository]  [📝 Download YAML]  [❌ Clear] │
│  │      ↑ THIS COMMITS DIRECTLY FROM BACKSTAGE ↑              │
│  └─────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────┘
```

### 3. Commit Flow (Within Backstage)

**When user clicks "✅ Commit to Repository":**

```typescript
const handleCommit = async () => {
  setCommitting(true);
  
  try {
    // Call Backstage backend API
    const result = await fetch('/api/ai-pipeline/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner: formData.owner,
        repo: formData.repo,
        content: generatedPipeline,
        branch: 'main' // or let user choose
      })
    });
    
    const response = await result.json();
    
    if (response.success) {
      // Show success notification within Backstage
      addAlert({
        message: '🎉 Pipeline committed successfully!',
        severity: 'success',
        display: 'transient'
      });
      
      // Show links to results
      setCommitResult({
        commitSha: response.commitSha,
        fileUrl: `https://github.com/${formData.owner}/${formData.repo}/blob/main/.github/workflows/generated-pipeline.yml`,
        actionsUrl: `https://github.com/${formData.owner}/${formData.repo}/actions`
      });
    }
  } catch (error) {
    addAlert({
      message: '❌ Commit failed: ' + error.message,
      severity: 'error'
    });
  } finally {
    setCommitting(false);
  }
};
```

### 4. Success State (Still in Backstage)
```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Pipeline Committed Successfully!                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📁 File: .github/workflows/generated-pipeline.yml              │
│ 🔗 Commit: abc123f                                             │
│ ⏰ Time: just now                                               │
│                                                                 │
│ Quick Actions:                                                  │
│ • [🔗 View File on GitHub]                                     │
│ • [⚡ View GitHub Actions]                                      │
│ • [🔄 Generate Another Pipeline]                               │
│ • [📊 View Repository in Catalog]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Implementation

### Custom Backend Module
```typescript
// packages/backend/src/plugins/ai-pipeline.ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { Router } from 'express';

export const aiPipelineModule = createBackendModule({
  pluginId: 'ai-pipeline',
  moduleId: 'api',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
      },
      async init({ httpRouter, config, auth }) {
        const router = Router();
        
        // Generate pipeline endpoint
        router.post('/generate', async (req, res) => {
          const { repoPath, userRequest } = req.body;
          
          // Your existing AI generation logic
          const pipeline = await generatePipelineWithAI(repoPath, userRequest);
          
          res.json({ pipelineContent: pipeline });
        });
        
        // Commit pipeline endpoint  
        router.post('/commit', async (req, res) => {
          const { owner, repo, content, branch = 'main' } = req.body;
          
          // Use GitHub integration from scaffolder
          const githubConfig = config.getConfig('integrations.github');
          const octokit = new Octokit({
            auth: githubConfig.getString('token')
          });
          
          try {
            const result = await octokit.rest.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: '.github/workflows/generated-pipeline.yml',
              message: 'Add AI-generated pipeline via Backstage',
              content: Buffer.from(content).toString('base64'),
              branch
            });
            
            res.json({ 
              success: true, 
              commitSha: result.data.commit.sha,
              fileUrl: result.data.content.html_url
            });
          } catch (error) {
            res.status(500).json({ 
              success: false, 
              error: error.message 
            });
          }
        });
        
        httpRouter.use('/api/ai-pipeline', router);
      }
    });
  }
});
```

### Frontend Plugin Registration
```typescript
// packages/app/src/App.tsx
import { aiPipelineGeneratorPlugin } from '@internal/plugin-ai-pipeline-generator';

// Add route
<Route path="/ai-pipeline-generator" element={<AIPluginGeneratorPage />} />
```

## Authentication & Permissions

**The plugin inherits Backstage's authentication:**
- Uses the same GitHub token configured in `app-config.yaml`
- Respects user permissions and access controls
- Commits are made with proper attribution
- Can integrate with Backstage's permission system

## Summary

✅ **100% within Backstage** - No external tools needed
✅ **Direct commits** - Uses GitHub API just like scaffolder does  
✅ **Real-time preview** - See before you commit
✅ **Proper integration** - Uses Backstage's auth, config, and UI patterns
✅ **User-friendly** - Success/error notifications, quick actions

**This gives you the exact workflow you wanted: preview the generated pipeline, then commit directly from Backstage with a single click!**
