import { Point, Segment, Line, Vector, Utils } from "@flatten-js/core"; // Import Vector and Utils
import {
  PointCoords,
  MirrorElement,
  ObjectElement,
  VirtualObjectElement,
  RayPath,
} from "./types";

/**
 * Calculates the position of the virtual image of a point reflected in a mirror.
 * Handles translation between PointCoords and Flatten.Point/Segment/Line.
 * Uses normal vector and intersection calculation.
 *
 * @param elementPosCoords The position of the element (e.g., viewer) as {x, y}.
 * @param mirror The mirror element definition.
 * @returns The position of the virtual image as {x, y}, or null if calculation fails.
 */
export function calculateVirtualImagePosition(
  elementPosCoords: PointCoords,
  mirror: MirrorElement
): PointCoords | null {
  try {
    // --- Translate Input ---
    const elementPoint = new Point(elementPosCoords.x, elementPosCoords.y);
    const mirrorStartPoint = new Point(mirror.start.x, mirror.start.y);
    const mirrorEndPoint = new Point(mirror.end.x, mirror.end.y);

    // Create a Flatten.Line
    const mirrorLine = new Line(mirrorStartPoint, mirrorEndPoint);

    // --- Manual Reflection Calculation using @flatten-js/core ---

    // 1. Find the line perpendicular to the mirror line passing through the element point
    // The normal vector of the mirror line acts as the direction vector for the perpendicular line.
    const mirrorNormal: Vector = mirrorLine.norm;
    // A line is defined by a point and its *normal* vector.
    // The normal vector of the perpendicular line is perpendicular to the mirror's normal vector.
    // If mirrorNormal is (nx, ny), a perpendicular vector is (-ny, nx).
    const perpendicularNormal = new Vector(-mirrorNormal.y, mirrorNormal.x);
    // Construct the perpendicular line passing through the elementPoint with the calculated normal
    const perpendicularLine = new Line(elementPoint, perpendicularNormal);

    // 2. Find the intersection point (projection) of the mirror line and the perpendicular line
    const intersectionPoints: Point[] = mirrorLine.intersect(perpendicularLine);

    // Check if intersection exists (should always be one for non-parallel lines)
    if (intersectionPoints.length === 0) {
      console.warn("Could not find intersection for reflection calculation.");
      // If the point is on the line, it is its own reflection.
      if (mirrorLine.contains(elementPoint)) {
        return { x: elementPoint.x, y: elementPoint.y };
      }
      return null;
    }

    const projectionPoint: Point = intersectionPoints[0];

    // 3. Calculate the reflected point.
    // The projection point M is the midpoint between the original point P and the reflected point P'.
    // Vector PM = M - P
    // P' = M + Vector PM = M + (M - P) = 2*M - P
    const reflectedPoint: Point = new Point(
      projectionPoint.x * 2 - elementPoint.x,
      projectionPoint.y * 2 - elementPoint.y
    );

    // --- Translate Output ---
    const virtualImagePosCoords: PointCoords = {
      x: reflectedPoint.x,
      y: reflectedPoint.y,
    };

    return virtualImagePosCoords;
  } catch (error) {
    console.error("Error calculating virtual image position:", error);
    return null;
  }
}

/**
 * Calculates the virtual representation of an object reflected in a mirror.
 * For shapes like triangles, it reflects the vertices to capture orientation change.
 *
 * @param object The original object element.
 * @param mirror The mirror element definition.
 * @returns The virtual object representation with reflected points, or null if calculation fails.
 */
export function calculateVirtualObject(
  object: ObjectElement,
  mirror: MirrorElement
): VirtualObjectElement | null {
  const shape = object.shape || "point"; // Default to point if shape isn't specified
  const virtualVertices: PointCoords[] = [];

  if (shape === "triangle") {
    const radius = object.radius || 10; // Use radius for triangle size
    const origX = object.position.x;
    const origY = object.position.y;

    // Define original vertices relative to object center
    const originalVertices: PointCoords[] = [
      { x: origX + radius, y: origY }, // Pointy vertex
      { x: origX - radius / 2, y: origY - radius }, // Top-left base
      { x: origX - radius / 2, y: origY + radius }, // Bottom-left base
    ];

    // Reflect each vertex
    for (const vertex of originalVertices) {
      const virtualVertex = calculateVirtualImagePosition(vertex, mirror);
      if (!virtualVertex) {
        console.warn("Failed to calculate a virtual vertex for the object.");
        return null; // If any vertex fails, the virtual object is incomplete
      }
      virtualVertices.push(virtualVertex);
    }
  } else {
    // 'point' or default case
    const virtualCenter = calculateVirtualImagePosition(
      object.position,
      mirror
    );
    if (!virtualCenter) {
      console.warn(
        "Failed to calculate virtual position for the point object."
      );
      return null;
    }
    // For a point, the 'vertices' array just contains the center position
    virtualVertices.push(virtualCenter);
  }

  // Construct the virtual object representation
  const virtualObject: VirtualObjectElement = {
    id: `virtual-${object.id}`,
    type: "virtualObject",
    shape: shape,
    vertices: virtualVertices,
    originalObjectId: object.id,
  };

  return virtualObject;
}

/**
 * Calculates the vertices of the virtual image of a triangle object reflected in a mirror.
 *
 * @param object The object element (must have position and radius).
 * @param mirror The mirror element definition.
 * @returns An array of 3 PointCoords for the virtual vertices, or null if calculation fails.
 */
export function calculateVirtualTriangleVertices(
  object: ObjectElement,
  mirror: MirrorElement
): PointCoords[] | null {
  const radius = object.radius || 10; // Use same default as drawing
  const x = object.position.x;
  const y = object.position.y;

  // 1. Define physical triangle vertices relative to object position
  const physicalVertices: PointCoords[] = [
    { x: x + radius, y: y }, // Pointy vertex (right)
    { x: x - radius / 2, y: y - radius }, // Top-left vertex
    { x: x - radius / 2, y: y + radius }, // Bottom-left vertex
  ];

  // 2. Reflect each physical vertex
  const virtualVertices: PointCoords[] = [];
  for (const vertex of physicalVertices) {
    const virtualVertex = calculateVirtualImagePosition(vertex, mirror);
    if (!virtualVertex) {
      console.warn("Failed to calculate virtual vertex for the object.");
      return null; // If any vertex fails, return null
    }
    virtualVertices.push(virtualVertex);
  }

  // 3. Return the array of virtual vertices
  if (virtualVertices.length === 3) {
    return virtualVertices;
  } else {
    // Should not happen if loop completes successfully
    console.error("Incorrect number of virtual vertices calculated.");
    return null;
  }
}

/**
 * Calculates the path of a light ray from an object to a viewer,
 * reflecting off a single mirror segment according to the law of reflection
 * (using the virtual image method).
 * Returns null if the reflection point is not on the mirror segment,
 * if the virtual image cannot be calculated, or if no valid intersection exists.
 *
 * @param objPosCoords The object's position {x, y}.
 * @param viewPosCoords The viewer's position {x, y}.
 * @param mirror The mirror element definition.
 * @returns A RayPath object containing the points {x, y}, or null if no valid path exists.
 */
export function calculateSingleReflectionPath(
  objPosCoords: PointCoords,
  viewPosCoords: PointCoords,
  mirror: MirrorElement
): RayPath | null {
  // 1. Calculate virtual object position
  const virtualObjPosCoords = calculateVirtualImagePosition(
    objPosCoords,
    mirror
  );

  if (!virtualObjPosCoords) {
    // Cannot calculate path if virtual image doesn't exist
    return null;
  }

  try {
    // --- Translate inputs for @flatten-js/core ---
    const viewerPoint = new Point(viewPosCoords.x, viewPosCoords.y);
    const virtualObjectPoint = new Point(
      virtualObjPosCoords.x,
      virtualObjPosCoords.y
    );
    const mirrorStartPoint = new Point(mirror.start.x, mirror.start.y);
    const mirrorEndPoint = new Point(mirror.end.x, mirror.end.y);

    // 2. Define the line of sight segment (Viewer <-> Virtual Object)
    // This segment represents the path the light *appears* to take from the virtual object
    const sightLineSegment = new Segment(viewerPoint, virtualObjectPoint);

    // 3. Define the physical mirror segment
    const mirrorSegment = new Segment(mirrorStartPoint, mirrorEndPoint);

    // 4. Find intersection between the sight line and the physical mirror segment
    // The intersect method for segments checks if the intersection point lies on both segments.
    const intersectionPoints: Point[] =
      mirrorSegment.intersect(sightLineSegment);

    // 5. Validate intersection
    // We need exactly one intersection point for a valid reflection off this mirror segment.
    if (intersectionPoints.length !== 1) {
      // No single, valid intersection point on the mirror segment for this viewer/object pair
      return null;
    }

    const reflectionPoint: Point = intersectionPoints[0];

    // --- Translate intersection point back to PointCoords ---
    const reflectionPointCoords: PointCoords = {
      x: reflectionPoint.x,
      y: reflectionPoint.y,
    };

    // 6. Construct and return the RayPath using plain coordinate objects
    const path: RayPath = {
      objectPoint: objPosCoords, // Start at the actual object
      mirrorPoint: reflectionPointCoords, // Reflect off the calculated point on the mirror
      viewerPoint: viewPosCoords, // End at the actual viewer
      virtualObjectPoint: virtualObjPosCoords, // Include the virtual object position
    };

    return path;
  } catch (error) {
    console.error("Error calculating single reflection path:", error);
    return null; // Return null on any calculation error
  }
}

/**
 * Checks if the perpendicular projection of a point onto the infinite line
 * containing a segment falls within the bounds of that segment.
 *
 * @param pointCoords The coordinates of the point to check.
 * @param segmentStartCoords The start coordinates of the segment.
 * @param segmentEndCoords The end coordinates of the segment.
 * @returns True if the projection lies on the segment, false otherwise.
 */
export function isPointProjectedOnSegment(
  pointCoords: PointCoords,
  segmentStartCoords: PointCoords,
  segmentEndCoords: PointCoords
): boolean {
  try {
    // --- Translate Input ---
    const point = new Point(pointCoords.x, pointCoords.y);
    const segmentStart = new Point(segmentStartCoords.x, segmentStartCoords.y);
    const segmentEnd = new Point(segmentEndCoords.x, segmentEndCoords.y);

    // Handle zero-length segment case
    if (segmentStart.equalTo(segmentEnd)) {
      console.warn("Segment has zero length.");
      return point.equalTo(segmentStart); // Point is on segment only if it matches the single point
    }

    const segmentLine = new Line(segmentStart, segmentEnd);
    const segment = new Segment(segmentStart, segmentEnd);

    // --- Calculate Projection ---
    // Find the line perpendicular to the segment line passing through the point
    const perpendicularNormal = new Vector(
      -segmentLine.norm.y,
      segmentLine.norm.x
    );
    const perpendicularLine = new Line(point, perpendicularNormal);

    // Find the intersection point (projection)
    const intersectionPoints: Point[] =
      segmentLine.intersect(perpendicularLine);

    if (intersectionPoints.length === 0) {
      // This might happen if the point is already on the line
      if (segmentLine.contains(point)) {
        // If the point is on the line, check if it's within the segment bounds
        return segment.contains(point);
      }
      // Should not happen for non-parallel lines otherwise, but handle defensively
      console.warn("Could not find projection intersection.");
      return false;
    }

    const projectionPoint: Point = intersectionPoints[0];

    // --- Check if Projection is on Segment ---
    // Use segment.contains() which checks if the point lies geometrically on the segment.
    // Add a tolerance check for floating-point inaccuracies.
    return segment.contains(projectionPoint);
  } catch (error) {
    console.error("Error checking point projection on segment:", error);
    return false;
  }
}

// Future functions for ray tracing etc. can be added here
