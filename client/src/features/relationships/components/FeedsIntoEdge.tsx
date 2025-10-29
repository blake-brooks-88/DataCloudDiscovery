// import React from 'react';
// import { BaseEdge, EdgeProps } from 'reactflow';
// import { getOrthogonalPath } from '../utils/getOrthogonalPath'; // Use the consolidated path
// import type { Entity } from '@shared/schema';

// // --- CSS for Animation (Defined locally for direct component usage) ---
// const FLOWING_LINE_CSS = `
//   @keyframes flow {
//     to {
//       stroke-dashoffset: 0;
//     }
//   }
// `;
// // --- END CSS ---

// /**
//  * @interface FeedsIntoEdgeData
//  * @description Data structure for the feeds-into entity-level edge.
//  */
// interface FeedsIntoEdgeData {
//     sourceEntity: Entity;
//     targetEntity: Entity;
// }

// /**
//  * @component FeedsIntoEdge
//  * @description Custom edge for the 'feeds-into' relationship, showing a thick, animated blue line.
//  * It uses orthogonal routing for the clean Manhattan style.
//  */
// const FeedsIntoEdge: React.FC<EdgeProps<FeedsIntoEdgeData>> = (props) => {
//     const { id, data } = props;

//     if (!data) { return null };

//     // CRITICAL FIX: Calculate the orthogonal path using the universal utility.
//     // We pass UNDEFINED for the field IDs since this is entity-level.
//     const path = getOrthogonalPath({
//         sourceEntity: data.sourceEntity,
//         targetEntity: data.targetEntity,
//         sourceFieldId: undefined, // Explicitly undefined
//         targetFieldId: undefined, // Explicitly undefined
//     });

//     const blueStroke = '#4AA0D9'; // Secondary-500 [cite: style guide, 3.2.2.]

//     // This style implements the "flowing dots" using stroke-dasharray and animation [cite: project overview, 73]
//     const style = {
//         stroke: blueStroke,
//         strokeWidth: 4,
//         strokeDasharray: '10, 10',
//         strokeDashoffset: 20,
//         animation: 'flow 1.5s linear infinite',
//     };

//     return (
//         <>
//             <style>{FLOWING_LINE_CSS}</style>

//             <BaseEdge
//                 id={id}
//                 path={path} // Passes the guaranteed orthogonal path
//                 style={style}
//                 markerEnd="url(#arrow-blue-solid)"
//             />
//         </>
//     );
// };

// export default React.memo(FeedsIntoEdge);
