/**
 * Reorders an array by moving an item from one position to another
 * @param list The array to reorder
 * @param startIndex The initial position of the item
 * @param endIndex The final position of the item
 * @returns A new array with the item moved to the new position
 */
export function reorderList<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Move an item from one list to another
 * @param source The source list
 * @param destination The destination list
 * @param droppableSource The source droppable info
 * @param droppableDestination The destination droppable info
 * @returns The new source and destination lists
 */
export function moveItemBetweenLists<T>(
  source: T[],
  destination: T[],
  sourceIndex: number,
  destinationIndex: number
): { source: T[]; destination: T[] } {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(sourceIndex, 1);

  destClone.splice(destinationIndex, 0, removed);

  return { source: sourceClone, destination: destClone };
}