import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const createAiGenerateTemplateAction = () => {
  return createTemplateAction({
    id: 'ai:generate-template',
    description:
      'Generate Backstage template and GitHub Actions workflow using AI',
    schema: {
      input: z =>
        z.object({
          // Fix: remove arrow function syntax
          templatePrompt: z
            .string()
            .describe('User prompt describing the template'),
          templateName: z.string().describe('Template name'),
          templateTitle: z.string().describe('Template title'),
          templateDescription: z.string().describe('Template description'),
          infrastructureType: z.string().describe('Type of infrastructure'),
          workflowRepo: z.string().describe('GitHub repository for workflows'),
        }),
    },
    async handler(ctx) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are a Backstage template generator. Generate ONLY valid JSON response.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. Escape all special characters in YAML strings (quotes, backslashes, newlines)
3. Use \\n for newlines in YAML strings
4. Escape quotes as \\"
5. Use proper Backstage scaffolder.backstage.io/v1beta3 format
6. ALWAYS use "platform-team" as the owner, NOT repository URLs
7. workflow_dispatch must have proper structure:
  on:\\n  workflow_dispatch:\\n    inputs:

GITHUB ACTIONS VARIABLE SYNTAX:
- Use \${{ inputs.variableName }} in workflow files
- Use \${{ parameters.variableName }} in Backstage templates
- Do NOT double-escape the dollar sign

BACKSTAGE TEMPLATE GITHUB WORKFLOW DISPATCH REQUIREMENTS:
- Must include repoUrl (full GitHub repo URL)
- Must include workflowPath (workflow file name)
- Must include branchOrTagName (always "master")
- Must include workflowInputs object with parameter mappings

CORRECT TEMPLATE EXAMPLE:
apiVersion: scaffolder.backstage.io/v1beta3\\nkind: Template\\nmetadata:\\n  name: example\\n  title: Example Template\\nspec:\\n  owner: platform-team\\n  type: infrastructure\\n  parameters:\\n    - title: Config\\n      required:\\n        - bucketName\\n      properties:\\n        bucketName:\\n          type: string\\n  steps:\\n    - id: trigger\\n      action: github:workflows:dispatch\\n      input:\\n        repoUrl: https://github.com/user/repo\\n        workflowPath: example.yml\\n        branchOrTagName: main\\n        workflowInputs:\\n          bucketName: \${{ parameters.bucketName }}

CORRECT WORKFLOW EXAMPLE:
name: Create S3 Bucket\\non:\\n  workflow_dispatch:\\n    inputs:\\n      bucketName:\\n        description: 'Name of the S3 bucket'\\n        required: true\\n        type: string\\n      region:\\n        description: 'AWS region'\\n        required: true\\n        type: string\\n        default: 'us-east-1'\\njobs:\\n  create-s3:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - name: Create S3 bucket\\n        run: |\\n          echo "Creating S3 bucket: \${{ inputs.bucketName }}"\\n          aws s3api create-bucket --bucket \${{ inputs.bucketName }}

Return this JSON structure:
{
  "templateContent": "ESCAPED_YAML_STRING_HERE",
  "workflowContent": "ESCAPED_YAML_STRING_HERE", 
  "workflowFileName": "filename.yml",
  "parameters": ["param1", "param2"]
}`;

      const userPrompt = `Generate for: ${ctx.input.templatePrompt}
Name: ${ctx.input.templateName}
Title: ${ctx.input.templateTitle}
Infrastructure: ${ctx.input.infrastructureType}
Workflow Repo: ${ctx.input.workflowRepo}

Return ONLY the JSON response with properly escaped YAML strings.`;

      try {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 4000,
          },
        });

        const responseText = result.response.text();
        ctx.logger.info(
          `Raw Gemini response (first 200 chars): ${responseText.substring(
            0,
            200,
          )}...`,
        );

        // Enhanced JSON cleaning
        let cleanedResponse = responseText.trim();

        // Remove markdown code blocks
        cleanedResponse = cleanedResponse
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
        cleanedResponse = cleanedResponse
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '');

        // Find JSON object
        const firstBrace = cleanedResponse.indexOf('{');
        const lastBrace = cleanedResponse.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
          throw new Error('No valid JSON object found in response');
        }

        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);

        let parsedResult;
        try {
          parsedResult = JSON.parse(cleanedResponse);
        } catch (parseError) {
          ctx.logger.error(`JSON parse error: ${parseError}`);
          ctx.logger.error(
            `Cleaned response: ${cleanedResponse.substring(0, 500)}...`,
          );

          // Try to fix common JSON issues
          let fixedResponse = cleanedResponse
            // Fix unescaped newlines in strings
            .replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"')
            // Fix unescaped quotes
            .replace(/([^\\])"/g, '$1\\"')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1');

          parsedResult = JSON.parse(fixedResponse);
        }

        // Validate required fields
        if (
          !parsedResult.templateContent ||
          !parsedResult.workflowContent ||
          !parsedResult.workflowFileName
        ) {
          throw new Error('Generated response missing required fields');
        }
        const processedTemplateContent = parsedResult.templateContent
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t');
        const processedWorkflowContent = parsedResult.workflowContent
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t');

        ctx.output('templateContent', processedTemplateContent);
        ctx.output('workflowContent', processedWorkflowContent);
        ctx.output('workflowFileName', parsedResult.workflowFileName);
        ctx.output('parameters', parsedResult.parameters || []);

        ctx.logger.info(
          '✅ AI-generated template and workflow created successfully',
        );
      } catch (error) {
        ctx.logger.error(`❌ Failed to generate template: ${error}`);

        // Provide fallback template - using proper escaping
        const fallbackTemplate = [
          'apiVersion: scaffolder.backstage.io/v1beta3',
          'kind: Template',
          'metadata:',
          `  name: ${ctx.input.templateName}`,
          `  title: ${ctx.input.templateTitle}`,
          `  description: ${
            ctx.input.templateDescription || 'AI-generated template'
          }`,
          '  tags:',
          `    - ${ctx.input.infrastructureType}`,
          '    - ai-generated',
          'spec:',
          '  owner: platform-team',
          '  type: infrastructure',
          '  parameters:',
          '    - title: Configuration',
          '      required:',
          '        - resourceName',
          '      properties:',
          '        resourceName:',
          '          title: Resource Name',
          '          type: string',
          '          description: Name of the resource to create',
          '  steps:',
          '    - id: trigger-workflow',
          '      name: Trigger GitHub Workflow',
          '      action: github:workflows:dispatch',
          '      input:',
          `        repoUrl: https://github.com/${ctx.input.workflowRepo}`,
          `        workflowPath: ${ctx.input.templateName}.yml`,
          '        branchOrTagName: master',
          '        workflowInputs:',
          '          resourceName: ${{ parameters.resourceName }}',
          '  output:',
          '    links:',
          '      - title: View Workflow',
          `        url: https://github.com/${ctx.input.workflowRepo}/actions`,
        ].join('\\n');

        const fallbackWorkflow = [
          `name: ${ctx.input.templateTitle}`,
          'on:',
          '  workflow_dispatch:',
          '    inputs:',
          '      resourceName:',
          '        description: "Resource Name"',
          '        required: true',
          '        type: string',
          'jobs:',
          '  provision:',
          '    runs-on: ubuntu-latest',
          '    steps:',
          '      - name: Provision Resource',
          '        run: echo "Provisioning ${{ github.event.inputs.resourceName }}"',
        ].join('\\n');

        ctx.output('templateContent', fallbackTemplate);
        ctx.output('workflowContent', fallbackWorkflow);
        ctx.output('workflowFileName', `${ctx.input.templateName}.yml`);
        ctx.output('parameters', ['resourceName']);

        ctx.logger.info(
          '✅ Used fallback template due to AI generation failure',
        );
      }
    },
  });
};
