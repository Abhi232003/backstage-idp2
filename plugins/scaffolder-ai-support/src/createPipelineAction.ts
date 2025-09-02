import { createTemplateAction, ActionContext } from '@backstage/plugin-scaffolder-node';
import { z, ZodType } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { detectProject } from './detectProject';
import { generatePipelineYAML } from './openaiUtil';
import { Octokit } from '@octokit/rest';

/**
 * Backstage scaffolder action to generate a pipeline YAML using OpenAI and create a Pull Request.
 */
export const createAiGeneratePipelineAction = (options: { githubToken?: string }) => {
  return createTemplateAction({
    id: 'ai:generate-pipeline',
    description: 'Generate a GitHub Actions pipeline YAML using OpenAI and create a Pull Request',
    schema: {
      input: (z) =>
        z.object({
          repoPath: z.string().describe('Path to the checked-out repo'),
          userRequest: z.string().describe('User request for the pipeline'),
          openaiApiKey: z.string().describe('OpenAI API Key'),
          pipelineFileName: z.string().optional().describe('Name of the pipeline file').default('generated-pipeline.yml'),
          createPullRequest: z.boolean().optional().describe('Whether to create a Pull Request with the pipeline').default(true),
          owner: z.string().optional().describe('GitHub repository owner'),
          repo: z.string().optional().describe('GitHub repository name'),
        }),
    output: (z) =>
      z.object({
        pipelineContent: z.string().describe('The generated pipeline YAML content'),
        filePath: z.string().describe('Path where the pipeline was saved'),
        projectSummary: z.string().describe('Summary of the analyzed project'),
        pullRequestCreated: z.boolean().describe('Whether a Pull Request was created'),
        branchName: z.string().optional().describe('Name of the branch created for the PR'),
      }),
  },
  async handler(ctx) {
    const { repoPath, userRequest, openaiApiKey, pipelineFileName = 'generated-pipeline.yml', createPullRequest = true, owner, repo } = ctx.input;
    
    // Resolve the repo path relative to the workspace directory
    const absoluteRepoPath = path.resolve(ctx.workspacePath, repoPath);
    ctx.logger.info(`🔍 Detecting project type in ${absoluteRepoPath}`);
    
    const summaryObj = detectProject(absoluteRepoPath);
    const summary = JSON.stringify(summaryObj, null, 2);
    
    // Enhanced logging for debugging
    ctx.logger.info(`📊 Project Analysis Complete:`);
    ctx.logger.info(`   Type: ${summaryObj.type}`);
    ctx.logger.info(`   Framework: ${summaryObj.framework || 'None detected'}`);
    ctx.logger.info(`   Build Tool: ${summaryObj.buildTool || 'None detected'}`);
    ctx.logger.info(`   Has Docker: ${summaryObj.hasDocker}`);
    ctx.logger.info(`   Has Tests: ${summaryObj.hasTests}`);
    ctx.logger.info(`   Key Dependencies: ${Object.keys(summaryObj.dependencies).slice(0, 5).join(', ') || 'None'}`);
    
    ctx.logger.info(`🤖 Generating AI pipeline for user request: "${userRequest}"`);
    
    try {
      // Build repository URL if owner and repo are provided
      const repositoryUrl = owner && repo ? `https://github.com/${owner}/${repo}` : undefined;
      
      const pipelineYaml = await generatePipelineYAML({ 
        summary, 
        userRequest, 
        openaiApiKey, 
        repositoryUrl 
      });
      ctx.logger.info('✅ Pipeline YAML generated successfully.');
      
      // Enhanced pipeline preview (first 10 lines)
      const previewLines = pipelineYaml.split('\n').slice(0, 10).join('\n');
      ctx.logger.info(`📄 Pipeline Preview:\n${previewLines}${pipelineYaml.split('\n').length > 10 ? '\n...' : ''}`);
      
      // Save to .github/workflows/ directory
      const workflowsDir = path.join(absoluteRepoPath, '.github', 'workflows');
      await fs.ensureDir(workflowsDir);
      const filePath = path.join(workflowsDir, pipelineFileName);
      await fs.writeFile(filePath, pipelineYaml);
      ctx.logger.info(`💾 Pipeline YAML written to ${filePath}`);
      
      let pullRequestCreated = false;
      let branchName = '';
      
      // If createPullRequest is true, create a PR using GitHub API
      if (createPullRequest && owner && repo) {
        try {
          // Use GitHub token from options or environment
          const githubToken = options.githubToken;
          
          if (!githubToken) {
            throw new Error('GitHub token not available. Please configure GitHub integration in app-config.yaml');
          }
          
          const octokit = new Octokit({
            auth: githubToken,
          });
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          branchName = `ai-pipeline-${timestamp}`;
          
          ctx.logger.info(`🌿 Creating branch: ${branchName}`);
          
          // Get the main branch reference
          const { data: mainBranch } = await octokit.rest.repos.getBranch({
            owner,
            repo,
            branch: 'main',
          });
          
          // Create a new branch
          await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: mainBranch.commit.sha,
          });
          
          // Get the current file content to get the blob SHA if it exists
          let existingFileSha = null;
          try {
            const { data: existingFile } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: `.github/workflows/${pipelineFileName}`,
              ref: branchName,
            });
            if ('sha' in existingFile) {
              existingFileSha = existingFile.sha;
            }
          } catch (error) {
            // File doesn't exist, which is fine
          }
          
          // Create or update the file
          await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: `.github/workflows/${pipelineFileName}`,
            message: `🤖 Add AI-generated GitHub Actions pipeline

Generated using Backstage AI Pipeline Generator
Project Type: ${summaryObj.type}${summaryObj.framework ? ` (${summaryObj.framework})` : ''}
User Request: ${userRequest}

Features:
- Uses Google Artifact Registry for container images
- Tailored for ${summaryObj.type} projects
- Includes ${summaryObj.hasTests ? 'testing and ' : ''}deployment steps
${summaryObj.hasDocker ? '- Containerized deployment ready' : ''}

Generated on: ${new Date().toLocaleString()}`,
            content: Buffer.from(pipelineYaml).toString('base64'),
            branch: branchName,
            sha: existingFileSha || undefined,
          });
          
          // Create the pull request with enhanced description
          const { data: pullRequest } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: `🤖 Add AI-generated ${summaryObj.type} pipeline${summaryObj.framework ? ` for ${summaryObj.framework}` : ''}`,
            head: branchName,
            base: 'main',
            body: `## 🤖 AI-Generated GitHub Actions Pipeline

This pull request adds a new GitHub Actions pipeline generated by the Backstage AI Pipeline Generator, specifically tailored for your ${summaryObj.type} project.

### 📋 Project Analysis
- **Project Type:** ${summaryObj.type}
- **Framework:** ${summaryObj.framework || 'Not detected'}
- **Build Tool:** ${summaryObj.buildTool || 'Standard'}
- **Has Docker:** ${summaryObj.hasDocker ? '✅ Yes' : '❌ No'}
- **Has Tests:** ${summaryObj.hasTests ? '✅ Yes' : '❌ No'}
- **Generated on:** ${new Date().toLocaleString()}

### 🎯 User Request
> ${userRequest}

### 🚀 Pipeline Features
- **Container Registry:** Google Artifact Registry (modern replacement for GCR)
- **Authentication:** Secure GCP service account integration
- **Build Process:** Optimized for ${summaryObj.type} projects
${summaryObj.hasTests ? '- **Testing:** Automated test execution before deployment' : ''}
${summaryObj.hasDocker ? '- **Containerization:** Docker build and push to Artifact Registry' : ''}
- **Deployment:** Ready for Google Cloud Run or GKE
- **Security:** Uses GitHub secrets for sensitive data

### 🔧 Required Setup
Before merging, ensure these secrets are configured in your repository settings:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| \`GCP_PROJECT_ID\` | Your Google Cloud Project ID | ✅ |
| \`GCP_REGION\` | Target GCP region (e.g., us-central1) | ✅ |
| \`GCP_SA_KEY\` | Service Account JSON key with required permissions | ✅ |

### 🔍 Review Checklist
- [ ] Pipeline triggers match your workflow needs
- [ ] Required secrets are configured in repository settings
- [ ] Build and deployment steps are appropriate for your project
- [ ] Environment variables are correctly configured
- [ ] Artifact Registry repository exists in your GCP project

### 📄 File Location
\`.github/workflows/${pipelineFileName}\`

---
*Generated by Backstage AI Pipeline Generator v2.0*
*🎯 Tailored specifically for ${summaryObj.type} projects*`,
          });
          
          pullRequestCreated = true;
          ctx.logger.info(`✅ Pull Request created successfully!`);
          ctx.logger.info(`🔗 PR URL: ${pullRequest.html_url}`);
          ctx.logger.info(`🌿 Branch: ${branchName}`);
          
        } catch (error) {
          ctx.logger.warn(`❌ Failed to create Pull Request via GitHub API: ${error}. Pipeline saved locally for manual PR creation.`);
          pullRequestCreated = false;
        }
      } else if (createPullRequest) {
        ctx.logger.warn('⚠️ Pull Request creation skipped: missing owner, repo parameters');
        pullRequestCreated = false;
      }
      
      // Return output values for template use
      ctx.output('pipelineContent', pipelineYaml);
      ctx.output('filePath', filePath);
      ctx.output('projectSummary', summary);
      ctx.output('pullRequestCreated', pullRequestCreated);
      if (branchName) {
        ctx.output('branchName', branchName);
      }
      
    } catch (error) {
      ctx.logger.error(`❌ Failed to generate pipeline: ${error}`);
      throw error;
    }
  },
});
};

// For backward compatibility, export the action with default options
export const aiGeneratePipelineAction = createAiGeneratePipelineAction({});
