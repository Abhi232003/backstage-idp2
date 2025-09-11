import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import * as fs from 'fs-extra';
import * as path from 'path';

export const createCacheBusterAction = () => {
  return createTemplateAction({
    id: 'cache:bust',
    description: 'Create a cache busting mechanism for new templates',
    schema: {
      input: z=>z.object({
        templateName: z.string().describe('Template name'),
      }),
    },
    async handler(ctx) {
      const { templateName } = ctx.input;
      
      // Create a timestamp file that changes to bust cache
      const rootDir = path.resolve(process.cwd(), '../../');
      const timestampFile = path.join(rootDir, 'templates', '.template-cache-bust');
      
      const timestamp = {
        lastUpdate: new Date().toISOString(),
        newTemplate: templateName,
        version: Date.now(),
      };
      
      await fs.writeFile(timestampFile, JSON.stringify(timestamp, null, 2));
      
      ctx.logger.info(`✅ Cache bust file created: ${timestampFile}`);
      ctx.output('cacheBusted', true);
    },
  });
};