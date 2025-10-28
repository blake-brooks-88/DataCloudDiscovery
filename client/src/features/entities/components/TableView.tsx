import { Key, Link as LinkIcon, AlertTriangle, AlertCircle, Lock, ArrowUpDown } from "lucide-react";
import type { Entity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface TableViewProps {
  entities: Entity[];
  onEntityClick: (entityId: string) => void;
}

type SortField = 'entity' | 'field' | 'type' | 'dataSource';
type SortDirection = 'asc' | 'desc';

export default function TableView({ entities, onEntityClick }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('entity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const flattenedData = entities.flatMap((entity) => {
    return entity.fields.map((field) => ({
      entityId: entity.id,
      entityName: entity.name,
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      isPK: field.isPK,
      isFK: field.isFK,
      businessName: field.businessName,
      notes: field.notes,
      containsPII: field.containsPII,
      visibleInERD: field.visibleInERD,
      dataSource: entity.dataSource || '',
      dataCloudObjectType: entity.dataCloudMetadata?.objectType,
    }));
  });

  const sortedData = [...flattenedData].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'entity':
        comparison = a.entityName.localeCompare(b.entityName);
        break;
      case 'field':
        comparison = a.fieldName.localeCompare(b.fieldName);
        break;
      case 'type':
        comparison = a.fieldType.localeCompare(b.fieldType);
        break;
      case 'dataSource':
        comparison = a.dataSource.localeCompare(b.dataSource);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-coolgray-800 transition-colors"
      data-testid={`button-sort-${field}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="h-full overflow-auto bg-white">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-coolgray-100 z-10">
          <tr className="border-b-2 border-coolgray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              <SortButton field="entity" label="Entity" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              <SortButton field="field" label="Field Name" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              <SortButton field="type" label="Type" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              Business Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              Notes
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              <SortButton field="dataSource" label="Data Source" />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              Data Cloud
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-coolgray-600">
              ERD Visible
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={`${row.entityId}-${row.fieldId}`}
              className={`border-b border-coolgray-200 hover:bg-coolgray-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-coolgray-50'
                }`}
              onClick={() => onEntityClick(row.entityId)}
              data-testid={`row-field-${row.fieldId}`}
            >
              <td className="px-4 py-3 text-sm font-medium text-coolgray-700">
                {row.entityName}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  {row.isPK && <Key className="h-3 w-3 text-primary-500 flex-shrink-0" />}
                  {row.isFK && <LinkIcon className="h-3 w-3 text-secondary-500 flex-shrink-0" />}
                  <span className="font-mono text-coolgray-700">{row.fieldName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-mono text-coolgray-600">
                {row.fieldType}
              </td>
              <td className="px-4 py-3 text-sm text-coolgray-600">
                {row.businessName || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-coolgray-600 max-w-md truncate">
                {row.notes || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-coolgray-600 font-mono">
                {row.dataSource || '-'}
              </td>
              <td className="px-4 py-3 text-sm">
                {row.dataCloudObjectType ? (
                  <Badge className="text-xs px-2 py-0.5 bg-tertiary-50 text-tertiary-700 border border-tertiary-500 rounded-full">
                    {row.dataCloudObjectType}
                  </Badge>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                {row.visibleInERD !== false ? (
                  <span className="text-success-500">✓</span>
                ) : (
                  <span className="text-coolgray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedData.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-xl font-semibold text-coolgray-400">No data to display</p>
            <p className="text-sm text-coolgray-500 mt-2">Add entities and fields to see them here</p>
          </div>
        </div>
      )}
    </div>
  );
}
