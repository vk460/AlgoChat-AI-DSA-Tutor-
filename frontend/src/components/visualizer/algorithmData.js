// ============================================================
// Algorithm Step Generators — with description + calculation
// ============================================================

export function randomArray(size = 8, max = 99) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 1);
}

export const ALGORITHM_META = {
  linear_search: {
    label: "Linear Search",
    time: "O(n)",
    space: "O(1)",
    stable: "N/A",
    desc: "Scans each element sequentially until the target is found.",
  },
  binary_search: {
    label: "Binary Search",
    time: "O(log n)",
    space: "O(1)",
    stable: "N/A",
    desc: "Halves the search space each step on a sorted array.",
  },
  bubble_sort: {
    label: "Bubble Sort",
    time: "O(n²)",
    space: "O(1)",
    stable: "Yes",
    desc: "Repeatedly swaps adjacent elements if they are in the wrong order.",
  },
  merge_sort: {
    label: "Merge Sort",
    time: "O(n log n)",
    space: "O(n)",
    stable: "Yes",
    desc: "Divides the array in half, sorts each half, then merges them.",
  },
  quick_sort: {
    label: "Quick Sort",
    time: "O(n log n)",
    space: "O(log n)",
    stable: "No",
    desc: "Picks a pivot, partitions around it, then recurses on each side.",
  },
  stack: {
    label: "Stack Operations",
    time: "O(1) per op",
    space: "O(n)",
    stable: "N/A",
    desc: "Last-In-First-Out (LIFO) data structure with push and pop.",
  },
};

// ---------- LINEAR SEARCH ----------
export function generateLinearSearch(arr, target) {
  const steps = [];
  let found = false;
  for (let i = 0; i < arr.length; i++) {
    const isFound = arr[i] === target;
    steps.push({
      type: isFound ? "found" : "compare",
      action: isFound ? "found" : "compare",
      index: i,
      value: arr[i],
      description: isFound
        ? `Element found! arr[${i}] = ${arr[i]} matches the target ${target}. Search complete.`
        : `Check arr[${i}] = ${arr[i]}. Is ${arr[i]} equal to target ${target}? No, ${arr[i]} ≠ ${target}. Move to next index.`,
      calculation: isFound
        ? `arr[${i}] == ${target} → ${arr[i]} == ${target} → TRUE ✓`
        : `arr[${i}] == ${target} → ${arr[i]} == ${target} → FALSE, continue to index ${i + 1}`,
    });
    if (isFound) { found = true; break; }
  }
  if (!found) steps.push({
    type: "not-found", action: "not-found",
    description: `Target ${target} was not found in the array. All ${arr.length} elements have been checked.`,
    calculation: `Checked indices 0 to ${arr.length - 1}. No match found.`,
  });
  return { algorithm: "linear_search", array: [...arr], target, steps };
}

// ---------- BINARY SEARCH ----------
export function generateBinarySearch(inputArr, target) {
  const arr = [...inputArr].sort((a, b) => a - b);
  const steps = [];
  let lo = 0, hi = arr.length - 1;
  let found = false;
  let iteration = 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      type: "range", action: "calculate_mid",
      lo, hi, mid,
      description: `Iteration ${iteration}: Calculate the middle index of current range [${lo}..${hi}].`,
      calculation: `mid = floor((low + high) / 2) = floor((${lo} + ${hi}) / 2) = floor(${(lo + hi) / 2}) = ${mid}`,
    });
    if (arr[mid] === target) {
      steps.push({
        type: "found", action: "found",
        index: mid, value: arr[mid],
        description: `Compare arr[${mid}] = ${arr[mid]} with target ${target}. They are equal — element found!`,
        calculation: `arr[${mid}] == ${target} → ${arr[mid]} == ${target} → TRUE ✓`,
      });
      found = true;
      break;
    } else if (arr[mid] < target) {
      steps.push({
        type: "compare", action: "move_right",
        index: mid, value: arr[mid], direction: "right",
        description: `arr[${mid}] = ${arr[mid]} is less than target ${target}. Discard left half, search right half.`,
        calculation: `${arr[mid]} < ${target} → move low = mid + 1 = ${mid + 1}`,
      });
      lo = mid + 1;
    } else {
      steps.push({
        type: "compare", action: "move_left",
        index: mid, value: arr[mid], direction: "left",
        description: `arr[${mid}] = ${arr[mid]} is greater than target ${target}. Discard right half, search left half.`,
        calculation: `${arr[mid]} > ${target} → move high = mid - 1 = ${mid - 1}`,
      });
      hi = mid - 1;
    }
    iteration++;
  }
  if (!found) steps.push({
    type: "not-found", action: "not-found",
    description: `Target ${target} is not present in the array. The search range is empty (low > high).`,
    calculation: `low (${lo}) > high (${hi}) → range empty → NOT FOUND`,
  });
  return { algorithm: "binary_search", array: arr, target, steps };
}

// ---------- BUBBLE SORT ----------
export function generateBubbleSort(inputArr) {
  const arr = [...inputArr];
  const steps = [];
  const n = arr.length;
  const sorted = new Set();
  let pass = 1;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const willSwap = arr[j] > arr[j + 1];
      steps.push({
        type: "compare", action: "compare",
        i: j, j: j + 1, array: [...arr],
        description: `Pass ${pass}: Compare arr[${j}] = ${arr[j]} and arr[${j + 1}] = ${arr[j + 1]}. ${willSwap ? `Since ${arr[j]} > ${arr[j + 1]}, we need to swap.` : `${arr[j]} ≤ ${arr[j + 1]}, already in correct order.`}`,
        calculation: `arr[${j}] > arr[${j + 1}] → ${arr[j]} > ${arr[j + 1]} → ${willSwap ? "TRUE → SWAP needed" : "FALSE → no swap"}`,
      });
      if (willSwap) {
        const before0 = arr[j], before1 = arr[j + 1];
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push({
          type: "swap", action: "swap",
          i: j, j: j + 1, array: [...arr],
          description: `Swap arr[${j}] and arr[${j + 1}]: move ${before0} to index ${j + 1} and ${before1} to index ${j}.`,
          calculation: `temp = arr[${j}] = ${before0}; arr[${j}] = arr[${j + 1}] = ${before1}; arr[${j + 1}] = temp = ${before0}`,
        });
      }
    }
    sorted.add(n - 1 - i);
    steps.push({
      type: "sorted", action: "pass_complete",
      index: n - 1 - i, sortedIndices: [...sorted], array: [...arr],
      description: `Pass ${pass} complete. Element ${arr[n - 1 - i]} at index ${n - 1 - i} is now in its final sorted position.`,
      calculation: `After pass ${pass}, the ${pass === 1 ? "largest" : `${pass}th largest`} element bubbles to position ${n - 1 - i}.`,
    });
    pass++;
  }
  sorted.add(0);
  steps.push({
    type: "done", action: "done",
    array: [...arr], sortedIndices: Array.from({ length: n }, (_, i) => i),
    description: "Bubble Sort complete! The array is now fully sorted in ascending order.",
    calculation: `Total passes: ${pass - 1}. Array: [${arr.join(", ")}]`,
  });
  return { algorithm: "bubble_sort", array: inputArr, steps };
}

// ---------- MERGE SORT ----------
export function generateMergeSort(inputArr) {
  const arr = [...inputArr];
  const steps = [];

  function mergeSort(a, lo, hi, depth = 0) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      type: "split", action: "split",
      lo, mid, hi, array: [...arr],
      description: `Divide: Split sub-array [${lo}..${hi}] into two halves: [${lo}..${mid}] and [${mid + 1}..${hi}].`,
      calculation: `mid = floor((${lo} + ${hi}) / 2) = ${mid}. Left: indices ${lo}-${mid}, Right: indices ${mid + 1}-${hi}`,
    });
    mergeSort(a, lo, mid, depth + 1);
    mergeSort(a, mid + 1, hi, depth + 1);
    merge(a, lo, mid, hi);
  }

  function merge(a, lo, mid, hi) {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;

    steps.push({
      type: "merge-start", action: "merge_start",
      lo, mid, hi, array: [...arr],
      description: `Merge: Combining sorted sub-arrays [${left.join(",")}] and [${right.join(",")}] into one sorted sequence.`,
      calculation: `Left = [${left.join(", ")}] (${left.length} elements), Right = [${right.join(", ")}] (${right.length} elements)`,
    });

    while (i < left.length && j < right.length) {
      steps.push({
        type: "merge-compare", action: "merge_compare",
        leftIdx: lo + i, rightIdx: mid + 1 + j, array: [...arr],
        description: `Compare left[${i}] = ${left[i]} with right[${j}] = ${right[j]}. Pick the smaller value: ${left[i] <= right[j] ? left[i] : right[j]}.`,
        calculation: `${left[i]} ${left[i] <= right[j] ? "≤" : ">"} ${right[j]} → place ${left[i] <= right[j] ? left[i] : right[j]} at index ${k}`,
      });
      if (left[i] <= right[j]) {
        a[k] = left[i]; i++;
      } else {
        a[k] = right[j]; j++;
      }
      arr[k] = a[k];
      steps.push({
        type: "merge-place", action: "merge_place",
        index: k, value: a[k], array: [...arr],
        description: `Place value ${a[k]} at position ${k} in the merged result.`,
        calculation: `arr[${k}] = ${a[k]}`,
      });
      k++;
    }
    while (i < left.length) { a[k] = left[i]; arr[k] = a[k]; steps.push({ type: "merge-place", action: "merge_place", index: k, value: a[k], array: [...arr], description: `Place remaining left element ${a[k]} at index ${k}.`, calculation: `arr[${k}] = ${a[k]}` }); i++; k++; }
    while (j < right.length) { a[k] = right[j]; arr[k] = a[k]; steps.push({ type: "merge-place", action: "merge_place", index: k, value: a[k], array: [...arr], description: `Place remaining right element ${a[k]} at index ${k}.`, calculation: `arr[${k}] = ${a[k]}` }); j++; k++; }
    steps.push({
      type: "merge-done", action: "merge_done",
      lo, hi, array: [...arr],
      description: `Merge complete for sub-array [${lo}..${hi}]. Result: [${arr.slice(lo, hi + 1).join(", ")}].`,
      calculation: `Merged ${hi - lo + 1} elements into sorted order.`,
    });
  }

  mergeSort(arr, 0, arr.length - 1);
  steps.push({
    type: "done", action: "done",
    array: [...arr], sortedIndices: Array.from({ length: arr.length }, (_, i) => i),
    description: "Merge Sort complete! The array is fully sorted.",
    calculation: `Total array: [${arr.join(", ")}]`,
  });
  return { algorithm: "merge_sort", array: inputArr, steps };
}

// ---------- QUICK SORT ----------
export function generateQuickSort(inputArr) {
  const arr = [...inputArr];
  const steps = [];

  function quickSort(lo, hi) {
    if (lo >= hi) return;
    const pivotIdx = partition(lo, hi);
    quickSort(lo, pivotIdx - 1);
    quickSort(pivotIdx + 1, hi);
  }

  function partition(lo, hi) {
    const pivot = arr[hi];
    steps.push({
      type: "pivot", action: "select_pivot",
      index: hi, value: pivot, lo, hi, array: [...arr],
      description: `Select pivot: arr[${hi}] = ${pivot}. Elements ≤ ${pivot} go to the left, elements > ${pivot} go to the right.`,
      calculation: `Pivot = arr[high] = arr[${hi}] = ${pivot}. Partition range: [${lo}..${hi}]`,
    });
    let i = lo;
    for (let j = lo; j < hi; j++) {
      const willSwap = arr[j] <= pivot;
      steps.push({
        type: "compare", action: "compare",
        i: j, j: hi, pivotIdx: hi, array: [...arr],
        description: `Compare arr[${j}] = ${arr[j]} with pivot ${pivot}. ${willSwap ? `${arr[j]} ≤ ${pivot}, so swap into the left partition.` : `${arr[j]} > ${pivot}, leave in place.`}`,
        calculation: `arr[${j}] ≤ pivot → ${arr[j]} ≤ ${pivot} → ${willSwap ? "TRUE" : "FALSE"}`,
      });
      if (willSwap) {
        if (i !== j) {
          const bi = arr[i], bj = arr[j];
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({
            type: "swap", action: "swap",
            i, j, pivotIdx: hi, array: [...arr],
            description: `Swap arr[${i}] = ${bi} with arr[${j}] = ${bj} to move ${bj} into the left partition.`,
            calculation: `Swap(arr[${i}], arr[${j}]): ${bi} ↔ ${bj}`,
          });
        }
        i++;
      }
    }
    const bi = arr[i], bhi = arr[hi];
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    steps.push({
      type: "pivot-place", action: "place_pivot",
      index: i, value: pivot, array: [...arr],
      description: `Place pivot ${pivot} at its correct sorted position index ${i}. Everything left of ${i} is ≤ ${pivot}, everything right is > ${pivot}.`,
      calculation: `Swap(arr[${i}], arr[${hi}]): ${bi} ↔ ${bhi}. Pivot index = ${i}`,
    });
    return i;
  }

  quickSort(0, arr.length - 1);
  steps.push({
    type: "done", action: "done",
    array: [...arr], sortedIndices: Array.from({ length: arr.length }, (_, i) => i),
    description: "Quick Sort complete! The array is fully sorted.",
    calculation: `Sorted array: [${arr.join(", ")}]`,
  });
  return { algorithm: "quick_sort", array: inputArr, steps };
}

// ---------- STACK OPERATIONS ----------
export function generateStackOps() {
  const steps = [];
  const ops = [
    { op: "push", value: 10 },
    { op: "push", value: 25 },
    { op: "push", value: 7 },
    { op: "peek" },
    { op: "pop" },
    { op: "push", value: 42 },
    { op: "push", value: 15 },
    { op: "pop" },
    { op: "pop" },
    { op: "push", value: 33 },
  ];

  const stack = [];
  let top = -1;
  for (const o of ops) {
    if (o.op === "push") {
      top++;
      stack.push(o.value);
      steps.push({
        type: "push", action: "push",
        value: o.value, stack: [...stack],
        description: `Push ${o.value} onto the stack. It becomes the new top element. Stack size is now ${stack.length}.`,
        calculation: `top = top + 1 = ${top}. stack[${top}] = ${o.value}`,
      });
    } else if (o.op === "pop") {
      const val = stack.pop();
      steps.push({
        type: "pop", action: "pop",
        value: val, stack: [...stack],
        description: `Pop the top element ${val} from the stack. ${stack.length > 0 ? `New top is ${stack[stack.length - 1]}` : "Stack is now empty"}.`,
        calculation: `Removed stack[${top}] = ${val}. top = top - 1 = ${top - 1}`,
      });
      top--;
    } else if (o.op === "peek") {
      steps.push({
        type: "peek", action: "peek",
        value: stack[stack.length - 1], stack: [...stack],
        description: `Peek at the top element without removing it. Top = ${stack[stack.length - 1]}. Stack remains unchanged.`,
        calculation: `return stack[top] = stack[${top}] = ${stack[top]}`,
      });
    }
  }
  return { algorithm: "stack", steps };
}

// ---------- DISPATCHER ----------
export function generateAlgorithmData(algorithmId, customArray) {
  const arr = customArray || randomArray(8, 50);
  switch (algorithmId) {
    case "linear_search": {
      const target = arr[Math.floor(Math.random() * arr.length)];
      return generateLinearSearch(arr, target);
    }
    case "binary_search": {
      const sorted = [...arr].sort((a, b) => a - b);
      const target = sorted[Math.floor(Math.random() * sorted.length)];
      return generateBinarySearch(arr, target);
    }
    case "bubble_sort":
      return generateBubbleSort(arr);
    case "merge_sort":
      return generateMergeSort(arr);
    case "quick_sort":
      return generateQuickSort(arr);
    case "stack":
      return generateStackOps();
    default:
      return generateBubbleSort(arr);
  }
}
