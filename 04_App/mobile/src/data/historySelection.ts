type Identifiable = { id: string };

export function toggleSelectedId(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id];
}

export function selectAllIds(records: Identifiable[]): string[] {
  return records.map((record) => record.id);
}

export function pruneSelectedIds(selectedIds: string[], records: Identifiable[]): string[] {
  const availableIds = new Set(records.map((record) => record.id));
  return selectedIds.filter((id) => availableIds.has(id));
}

export function selectionSummary(selectedIds: string[], totalCount: number) {
  const selectedCount = selectedIds.length;
  return {
    selectedCount,
    allSelected: totalCount > 0 && selectedCount === totalCount,
    hasSelection: selectedCount > 0,
  };
}
