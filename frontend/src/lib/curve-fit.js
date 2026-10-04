/**
 * Least-squares polynomial curve fitting.
 *
 * Fits a smooth curve of the given degree through a set of points so that a
 * scatter of raw data (e.g. every student's marks) can be summarised with a
 * single trend line. Points are centred on their mean x before solving the
 * normal equations, which keeps the system well-conditioned for large x.
 *
 * @param {Array<{x:number, y:number}>} points
 * @param {number} [degree=2]
 * @returns {{ coefficients:number[], predict:(x:number)=>number, degree:number } | null}
 *          `null` when there are fewer points than needed (or the system is singular).
 */
export function polyFit(points, degree = 2) {
  const size = degree + 1;

  if (!Array.isArray(points) || points.length < size) return null;

  const xMean =
    points.reduce((sum, point) => sum + point.x, 0) / points.length;

  // Sums of powers of the (centred) x values, up to degree * 2.
  const powerSums = new Array(2 * degree + 1).fill(0);
  for (const { x } of points) {
    const t = x - xMean;
    let power = 1;
    for (let k = 0; k < powerSums.length; k += 1) {
      powerSums[k] += power;
      power *= t;
    }
  }

  // Normal equations: A * c = b
  const A = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => powerSums[row + col])
  );
  const b = new Array(size).fill(0);
  for (const { x, y } of points) {
    const t = x - xMean;
    let power = 1;
    for (let row = 0; row < size; row += 1) {
      b[row] += power * y;
      power *= t;
    }
  }

  // Gauss-Jordan elimination with partial pivoting.
  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    }
    if (Math.abs(A[pivot][col]) < 1e-12) return null;

    [A[col], A[pivot]] = [A[pivot], A[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];

    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = A[row][col] / A[col][col];
      if (factor === 0) continue;
      for (let k = col; k < size; k += 1) A[row][k] -= factor * A[col][k];
      b[row] -= factor * b[col];
    }
  }

  const coefficients = b.map((value, index) => value / A[index][index]);

  return {
    degree,
    coefficients,
    predict: (x) => {
      const t = x - xMean;
      let result = 0;
      let power = 1;
      for (let i = 0; i < coefficients.length; i += 1) {
        result += coefficients[i] * power;
        power *= t;
      }
      return result;
    },
  };
}
