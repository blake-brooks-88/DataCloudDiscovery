/**
 * Floating legend panel explaining entity types and relationship styles
 * used in the canvas diagram.
 *
 * @returns {JSX.Element}
 */
export function CanvasLegend() {
  return (
    <div
      className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-72 z-10"
      data-testid="legend-panel"
    >
      <div className="text-sm font-semibold mb-3 text-gray-600">Legend</div>

      {/* Entity Types */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-500 mb-2">Entity Types</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#D6EAF8', border: '1px solid #4AA0D9' }}
            ></div>
            <span className="text-xs text-gray-600">Data Stream (Ingestion)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#FDEBD0', border: '1px solid #E89C33' }}
            ></div>
            <span className="text-xs text-gray-600">DLO (Raw Data)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#D6EAF8', border: '1px solid #3b82f6' }}
            ></div>
            <span className="text-xs text-gray-600">DMO (Unified Model)</span>
          </div>
        </div>
      </div>

      {/* Relationships */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">Relationships</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg width="50" height="4" className="flex-shrink-0">
              <line x1="0" y1="2" x2="50" y2="2" stroke="#4AA0D9" strokeWidth="4" />
              <circle cx="10" cy="2" r="2" fill="#4AA0D9" opacity="0.6" />
            </svg>
            <span className="text-xs text-gray-600">Ingests (Data Stream → DLO)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="50" height="2" className="flex-shrink-0">
              <line
                x1="0"
                y1="1"
                x2="50"
                y2="1"
                stroke="#BED163"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
            </svg>
            <span className="text-xs text-gray-600">Transforms (field lineage)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="50" height="2" className="flex-shrink-0">
              <line x1="0" y1="1" x2="50" y2="1" stroke="#64748B" strokeWidth="2" />
            </svg>
            <span className="text-xs text-gray-600">References (FK)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
