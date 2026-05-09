export function getPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (typeof current !== "object" || current === null) return undefined;
    return (current as Record<string, unknown>)[part];
  }, value);
}

export function hasPath(value: unknown, path: string): boolean {
  const found = getPath(value, path);
  return found !== undefined && found !== null && found !== "";
}
