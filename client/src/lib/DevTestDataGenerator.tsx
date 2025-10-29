import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateTestDataset } from '@/lib/test-data-generator';
import type { InsertEntity, InsertRelationship } from '@shared/schema';

interface DevTestDataGeneratorProps {
  projectId: string;
  onCreateEntity: (entity: InsertEntity) => Promise<void>;
  onCreateRelationship: (relationship: InsertRelationship) => Promise<void>;
}

export function DevTestDataGenerator({
  projectId,
  onCreateEntity,
  onCreateRelationship,
}: DevTestDataGeneratorProps) {
  const [count, setCount] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async () => {
    if (!projectId) {
      setStatus('❌ No project selected');
      return;
    }

    setIsGenerating(true);
    setStatus('🔄 Generating test data...');

    try {
      const { entities, relationships } = generateTestDataset(count);

      if (!entities?.length || !relationships?.length) {
        return;
      }

      setStatus(`🔄 Creating ${entities.length} entities...`);
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (!entity) {
          continue;
        }
        await onCreateEntity(entity);
        if (i % 10 === 0) {
          setStatus(`🔄 Created ${i + 1}/${entities.length} entities...`);
        }
      }

      setStatus(`🔄 Creating ${relationships.length} relationships...`);
      for (let i = 0; i < relationships.length; i++) {
        const relationship = relationships[i];
        if (!relationship) {
          continue;
        }
        await onCreateRelationship(relationship);
      }

      setStatus(
        `✅ Successfully created ${entities.length} entities and ${relationships.length} relationships!`
      );
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white shadow-lg rounded-lg p-4 w-80 border-2 border-warning-500 z-50">
      <div className="mb-2">
        <div className="text-sm font-semibold text-coolgray-700 mb-1">⚠️ Dev Tools</div>
        <div className="text-xs text-coolgray-500">Test Data Generator</div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-coolgray-600 block mb-1">Entity Count</label>
          <Input
            type="number"
            min="10"
            max="200"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 50)}
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
          variant="default"
        >
          {isGenerating ? 'Generating...' : `Generate ${count} Test Entities`}
        </Button>

        {status && (
          <Alert>
            <AlertDescription className="text-xs">{status}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-coolgray-500 border-t pt-2">
          <div className="font-semibold mb-1">Distribution:</div>
          <ul className="space-y-1">
            <li>• {Math.floor(count * 0.2)} Data Streams (20%)</li>
            <li>• {Math.floor(count * 0.4)} DLOs (40%)</li>
            <li>• {count - Math.floor(count * 0.6)} DMOs (40%)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
