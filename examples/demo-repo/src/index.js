export function reviewRoute(files) {
  return files
    .filter((file) => file.changed)
    .sort((left, right) => right.risk - left.risk)
    .map((file) => file.path);
}
