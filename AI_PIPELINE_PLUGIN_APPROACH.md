# AI Pipeline Generator - Custom Plugin Approach

## Why This Is The Right Solution

After extensive research into Backstage's architecture, the scaffolder has fundamental limitations:
- Forms collect ALL data BEFORE executing ANY steps
- No mid-step user interaction possible
- Cannot pause execution for user decisions
- Linear execution without interruption

## Proposed Solution: Custom Frontend Plugin

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│ Custom Frontend Plugin: /ai-pipeline-generator                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Form Panel    │    │  Preview Panel  │                   │
│  │                 │    │                 │                   │
│  │ • Repo Info     │    │ • Generated     │                   │
│  │ • Requirements  │◄──►│   Pipeline      │                   │
│  │ • Real-time     │    │ • Syntax        │                   │
│  │   Generation    │    │   Highlighted   │                   │
│  └─────────────────┘    └─────────────────┘                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┤
│  │           Action Buttons                                    │
│  │  [✅ Accept & Commit]  [📝 Download]  [❌ Reject]           │
│  └─────────────────────────────────────────────────────────────┤
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Backend: Custom API Endpoints                                  │
│ • /api/ai-pipeline/generate                                     │
│ • /api/ai-pipeline/commit                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Plan

#### Phase 1: Create Plugin Structure
```bash
yarn new
# Select: frontend-plugin
# Name: ai-pipeline-generator
```

#### Phase 2: Plugin Components
- **AIPluginGenerator.tsx**: Main component with form + preview
- **PipelinePreview.tsx**: Code editor with syntax highlighting  
- **CommitService.ts**: Handle GitHub API for commits
- **OpenAIService.ts**: Generate pipelines using AI

#### Phase 3: Backend Module
- Custom backend module for secure OpenAI integration
- GitHub API integration for repository operations
- File content analysis and context building

### User Experience Flow

1. **Navigate to `/ai-pipeline-generator`**
2. **Enter repository details** (owner, repo, requirements)
3. **See real-time preview** as you type requirements
4. **Review generated pipeline** in syntax-highlighted editor
5. **Make decision:**
   - ✅ **Accept**: Automatically commits to repository
   - 📝 **Download**: Save YAML file locally for manual use
   - ❌ **Reject**: Clear and start over with new requirements

### Technical Benefits

✅ **True Preview-First Workflow**: See exactly what will be committed
✅ **Real-Time Generation**: Updates as you modify requirements  
✅ **Full User Control**: No blind commits or surprises
✅ **Backstage Integration**: Follows plugin architecture patterns
✅ **Extensible**: Can add more features like pipeline validation, templates
✅ **Responsive**: Fast, client-side interactions

### Code Example

```typescript
// Main Plugin Component
export const AIPluginGeneratorPage = () => {
  const [formData, setFormData] = useState({});
  const [generatedPipeline, setGeneratedPipeline] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const pipeline = await aiService.generatePipeline(formData);
    setGeneratedPipeline(pipeline);
    setIsGenerating(false);
  };

  const handleAccept = async () => {
    await commitService.commitToRepo(formData.repo, generatedPipeline);
    // Show success message
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <PipelineForm 
          data={formData} 
          onChange={setFormData}
          onGenerate={handleGenerate}
        />
      </Grid>
      <Grid item xs={6}>
        <PipelinePreview 
          content={generatedPipeline}
          loading={isGenerating}
        />
        <ActionButtons 
          onAccept={handleAccept}
          onReject={() => setGeneratedPipeline('')}
        />
      </Grid>
    </Grid>
  );
};
```

## Next Steps

1. **Create the plugin**: `yarn new` → frontend-plugin
2. **Build the UI**: React components with form + preview
3. **Add backend support**: Custom actions for AI + GitHub
4. **Register in app**: Add route to main Backstage app
5. **Test and iterate**: Perfect the user experience

This approach gives us exactly what you wanted: **preview first, then decide!**
