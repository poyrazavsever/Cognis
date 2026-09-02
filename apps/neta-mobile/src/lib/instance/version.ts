export function compareSemver(left: string, right: string): number {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function isSupportedApiVersion(value: string): boolean {
  const match = /^v?(\d+)(?:\.\d+){0,2}$/.exec(value.trim());
  return match?.[1] === '1';
}

function parseSemver(value: string): [number, number, number] {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(value.trim());

  if (!match) {
    return [0, 0, 0];
  }

  return [
    Number.parseInt(match[1] ?? '0', 10),
    Number.parseInt(match[2] ?? '0', 10),
    Number.parseInt(match[3] ?? '0', 10),
  ];
}
