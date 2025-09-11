import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import * as fs from 'fs-extra';
import * as path from 'path';

export const createFileWriterAction = () => {
  return createTemplateAction({
    id: 'fs:write',
    description: 'Write content to a file in the workspace',
    schema: {
      input: z=>z.object({
        path: z.string().describe('File path relative to workspace'),
        content: z.string().describe('File content'),
      }),
    },
    async handler(ctx) {
      const { path: filePath, content } = ctx.input;
      
      // Get the workspace directory (where Backstage is running)
      const workspaceDir = process.cwd();
      const rootDir = path.resolve(workspaceDir,'../../')
      const fullPath = path.join(rootDir, filePath);
      
      let processedContent = content;
      
      // Replace \\n with actual newlines
      processedContent = processedContent.replace(/\\n/g, '\n');
      
      // Replace \\t with actual tabs
      processedContent = processedContent.replace(/\\t/g, '\t');
      
      // Fix escaped quotes
      processedContent = processedContent.replace(/\\"/g, '"');
      
      // Remove any remaining double backslashes
      processedContent = processedContent.replace(/\\\\/g, '\\');
      
      // Clean up any malformed YAML strings
      processedContent = processedContent.replace(/"\s*\n\s*"/g, '"\\n"');

      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write the file
      await fs.writeFile(fullPath, processedContent, 'utf8');
      
      ctx.logger.info(`✅ File written to: ${fullPath}`);
      ctx.output('filePath', fullPath);
    },
  });
};