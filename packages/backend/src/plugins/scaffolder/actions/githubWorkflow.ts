import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Octokit } from '@octokit/rest';
export const createGithubWorkflowDispatchAction = (options: { githubToken?: string }) => {
  return createTemplateAction({
    id: 'github:workflows:dispatch',
    schema: {
      input: z=>z.object({
        repoUrl: z.string().describe("The URL of the GitHub repository"),
        workflowPath: z.string().describe("Path to the workflow file"),
        branchOrTagName: z.string().describe("The branch or tag name to trigger the workflow on"),
        workflowInputs: z.record(z.any()).describe("Input parameters for the workflow")
      })
    },
    async handler(ctx) {
      const { repoUrl, workflowPath, branchOrTagName, workflowInputs } = ctx.input;

      // Extract owner and repo from URL
      const url = new URL(repoUrl);
      const [owner, repo] = url.pathname.split('/').filter(Boolean);

        const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GitHub token is required');
      }

      const octokit = new Octokit({
        auth: token,
      });

      try {
        await octokit.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id: workflowPath.split('/').pop() || '',
          ref: branchOrTagName,
          inputs: workflowInputs,
        });

        // const logsResponse = await octokit.actions.downloadWorkflowRunLogs({
        //   owner,
        //   repo,
        //   run_id: 0
        // })

        ctx.logger.info(`Successfully triggered workflow ${workflowPath} in ${owner}/${repo}`);
      } catch (error) {
        ctx.logger.error(`Failed to trigger workflow: ${error}`);
        throw error;
      }
    },
  });
};
