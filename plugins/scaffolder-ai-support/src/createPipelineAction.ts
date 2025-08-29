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
    ctx.logger.info(`Detecting project type in ${absoluteRepoPath}`);
    
    const summaryObj = detectProject(absoluteRepoPath);
    const summary = JSON.stringify(summaryObj, null, 2);
    ctx.logger.info(`Project summary: ${summary}`);
    
    ctx.logger.info('Calling OpenAI to generate pipeline YAML...');
    const pipelineYaml = await generatePipelineYAML({ summary, userRequest, openaiApiKey });
    ctx.logger.info('Pipeline YAML generated.');
    
    // Always log the generated pipeline for review
    ctx.logger.info(`Generated pipeline:\n${pipelineYaml}`);
    
    // Save to .github/workflows/ directory
    const workflowsDir = path.join(absoluteRepoPath, '.github', 'workflows');
    await fs.ensureDir(workflowsDir);
    const filePath = path.join(workflowsDir, pipelineFileName);
    await fs.writeFile(filePath, pipelineYaml);
    ctx.logger.info(`Pipeline YAML written to ${filePath}`);
    
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
          message: `Add AI-generated GitHub Actions pipeline

Generated using Backstage AI Pipeline Generator
Requested features: ${userRequest}

File: .github/workflows/${pipelineFileName}
Generated on: ${new Date().toLocaleString()}`,
          content: Buffer.from(pipelineYaml).toString('base64'),
          branch: branchName,
          sha: existingFileSha || undefined,
        });
        
        // Create the pull request
        const { data: pullRequest } = await octokit.rest.pulls.create({
          owner,
          repo,
          title: `🤖 Add AI-generated GitHub Actions pipeline`,
          head: branchName,
          base: 'main',
          body: `## 🤖 AI-Generated GitHub Actions Pipeline

This pull request adds a new GitHub Actions pipeline generated by the Backstage AI Pipeline Generator.

### 📋 Details
- **Generated on:** ${new Date().toLocaleString()}
- **Requested features:** ${userRequest}
- **File:** \`.github/workflows/${pipelineFileName}\`

### 🎯 What this pipeline does
The pipeline was generated based on your project structure and requirements. Please review the workflow and make any necessary adjustments before merging.

### 🔍 Review checklist
- [ ] Pipeline triggers are appropriate
- [ ] Required secrets are configured in repository settings
- [ ] Build and deployment steps match your requirements
- [ ] Environment variables are correctly set

---
*Generated by Backstage AI Pipeline Generator*`,
        });
        
        pullRequestCreated = true;
        ctx.logger.info(`✅ Pull Request created successfully!`);
        ctx.logger.info(`🔗 PR URL: ${pullRequest.html_url}`);
        ctx.logger.info(`🌿 Branch: ${branchName}`);
        
      } catch (error) {
        ctx.logger.warn(`Failed to create Pull Request via GitHub API: ${error}. Pipeline saved locally for manual PR creation.`);
        pullRequestCreated = false;
      }
    } else if (createPullRequest) {
      ctx.logger.warn('Pull Request creation skipped: missing owner, repo parameters');
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
  },
});
};

// For backward compatibility, export the action with default options
export const aiGeneratePipelineAction = createAiGeneratePipelineAction({});
