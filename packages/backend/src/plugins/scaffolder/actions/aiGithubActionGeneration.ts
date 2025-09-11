import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Octokit } from '@octokit/rest';

export const createGithubActionsCreateWorkflowAction = () => {
  return createTemplateAction({
    id: 'github:actions:create-workflow',
    description: 'Create a GitHub Actions workflow file in a repository',
    schema: {
      input: z=>z.object({
        repoUrl: z.string().describe('GitHub repository URL'),
        workflowContent: z.string().describe('Workflow YAML content'),
        workflowFileName: z.string().describe('Workflow file name'),
        commitMessage: z.string().describe('Commit message'),
      }),
    },
    async handler(ctx) {
      const { repoUrl, workflowContent, workflowFileName, commitMessage } = ctx.input;
      
      const [owner, repo] = new URL(repoUrl).pathname.split('/').filter(Boolean);
      
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });

      try {
        // Check if file already exists
        let sha: string | undefined;
        try {
          const existing = await octokit.repos.getContent({
            owner,
            repo,
            path: `.github/workflows/${workflowFileName}`,
          });
          
          if ('sha' in existing.data) {
            sha = existing.data.sha;
            ctx.logger.info(`Workflow file exists, will update: ${workflowFileName}`);
          }
        } catch (error) {
          ctx.logger.info(`Creating new workflow file: ${workflowFileName}`);
        }

        // Create or update workflow file
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: `.github/workflows/${workflowFileName}`,
          message: commitMessage,
          content: Buffer.from(workflowContent).toString('base64'),
          sha, // Include sha if updating existing file
        });

        ctx.logger.info(`✅ Successfully created/updated workflow: .github/workflows/${workflowFileName}`);
        
        ctx.output('workflowUrl', `https://github.com/${owner}/${repo}/blob/main/.github/workflows/${workflowFileName}`);
        
      } catch (error) {
        ctx.logger.error(`❌ Failed to create workflow: ${error}`);
        throw error;
      }
    },
  });
};