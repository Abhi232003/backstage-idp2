import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createAiGeneratePipelineAction } from '../../../../plugins/scaffolder-ai-support/dist/index';
import { coreServices } from '@backstage/backend-plugin-api';

export const scaffolderActionsModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'custom-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        console.log('Custom scaffolder module initializing...');
        
        // Get GitHub token from configuration
        const githubIntegrations = config.getOptionalConfigArray('integrations.github');
        let githubToken: string | undefined;
        
        if (githubIntegrations && githubIntegrations.length > 0) {
          githubToken = githubIntegrations[0].getOptionalString('token');
        }
        
        console.log('Adding AI Generate Pipeline action...');
        console.log('GitHub token available:', !!githubToken);
        
        const aiGeneratePipelineAction = createAiGeneratePipelineAction({ 
          githubToken 
        });
        
        console.log('AI action function type:', typeof aiGeneratePipelineAction);
        console.log('AI action ID:', aiGeneratePipelineAction?.id);
        
        // Only add our custom action - built-in actions are already registered
        scaffolder.addActions(aiGeneratePipelineAction);
        console.log('Custom scaffolder actions added successfully!');
      },
    });
  },
});

export default [scaffolderActionsModule];
