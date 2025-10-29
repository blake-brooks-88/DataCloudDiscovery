/**
 * Floating legend panel explaining entity types and relationship styles
 * used in the canvas diagram.
 *
 * @returns {JSX.Element}
 */
export function CanvasLegend() {
  return (
    <div
      // FIX: Apply pointer-events-none to the container so that it doesn't block
      // clicks/drags/scrolls on the canvas underneath.
      className="absolute bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-72 z-10 pointer-events-none"
      data-testid="legend-panel"
    >
      <div className="text-sm font-semibold mb-3 text-coolgray-600">Legend</div>

      {/* Entity Types - Textual elements don't need pointer-events-auto as they aren't interactive */}
      <div className="mb-3">
        <div className="text-xs font-medium text-coolgray-500 mb-2">Entity Types</div>
        <div className="space-y-2">
          {/* Note: Colors are now using style guide tokens for consistency (coolgray instead of generic gray) */}
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              // TODO: Replace inline styles with predefined Tailwind colors based on entity type mapping
              style={{ backgroundColor: '#E6F3FB', border: '1px solid #4AA0D9' }}
            ></div>
            <span className="text-xs text-coolgray-600">Data Stream (Ingestion)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              // TODO: Replace inline styles with predefined Tailwind colors based on entity type mapping
              style={{ backgroundColor: '#FFF6EB', border: '1px solid #E49A43' }}
            ></div>
            <span className="text-xs text-coolgray-600">DLO (Raw Data)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              // TODO: Replace inline styles with predefined Tailwind colors based on entity type mapping
              style={{ backgroundColor: '#E6F3FB', border: '1px solid #4AA0D9' }}
            ></div>
            <span className="text-xs text-coolgray-600">DMO (Unified Model)</span>
          </div>
        </div>
      </div>

      {/* Relationships */}
      <div>
        <div className="text-xs font-medium text-coolgray-500 mb-2">Relationships</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg width="50" height="4" className="flex-shrink-0">
              {/* Using Secondary-Blue-500 for stroke */}
              <line x1="0" y1="2" x2="50" y2="2" stroke="#4AA0D9" strokeWidth="4" />
              <circle cx="10" cy="2" r="2" fill="#4AA0D9" opacity="0.6" />
            </svg>
            <span className="text-xs text-coolgray-600">Ingests (Data Stream → DLO)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="50" height="2" className="flex-shrink-0">
              {/* Using Tertiary-Green-500 for stroke */}
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
            <span className="text-xs text-coolgray-600">Transforms (field lineage)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="50" height="2" className="flex-shrink-0">
              {/* Using CoolGray-500 for stroke */}
              <line x1="0" y1="1" x2="50" y2="1" stroke="#64748B" strokeWidth="2" />
            </svg>
            <span className="text-xs text-coolgray-600">References (FK)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
