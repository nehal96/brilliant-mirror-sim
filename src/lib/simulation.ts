import { Point, Segment, Line, Vector } from "@flatten-js/core"; // Import Vector
import { PointCoords, MirrorElement } from "./types";

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

// Future functions for ray tracing etc. can be added here
