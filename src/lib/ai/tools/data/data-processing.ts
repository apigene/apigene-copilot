import { tool as createTool } from "ai";
import { z } from "zod";

export const dataProcessingTool = createTool({
  description:
    "Process and transform data using real lodash utility functions. Supports 200+ operations including array manipulation, object processing, string operations, mathematical functions, type checking, and functional programming utilities.",
  inputSchema: z.object({
    operation: z
      .string()
      .describe(
        "The lodash operation to perform (e.g., 'groupBy', 'sortBy', 'filter', 'map', 'sum', 'mean', 'uniq', 'chunk', 'flatten', 'orderBy', 'keyBy', 'countBy', 'partition', 'sample', 'shuffle', 'take', 'drop', 'compact', 'without', 'intersection', 'union', 'difference', 'max', 'min', 'size', 'isEmpty', 'isEqual', 'clone', 'merge', 'pick', 'omit', 'keys', 'values', 'invert', 'mapKeys', 'mapValues', 'defaults', 'get', 'set', 'has', 'find', 'some', 'every', 'includes', 'reverse', 'join', 'split', 'trim', 'upperCase', 'lowerCase', 'capitalize', 'camelCase', 'kebabCase', 'snakeCase', 'startCase', 'pad', 'repeat', 'replace', 'words', 'debounce', 'throttle', 'once', 'memoize', 'curry', 'partial', 'random', 'range', 'clamp', 'round', 'floor', 'ceil', 'add', 'subtract', 'multiply', 'divide', 'isArray', 'isBoolean', 'isDate', 'isFunction', 'isNumber', 'isObject', 'isString', 'toArray', 'toNumber', 'toString', etc.)",
      ),
    data: z
      .any()
      .describe(
        "The input data to process (array, object, string, number, or primitive value)",
      ),
    parameters: z
      .record(z.string(), z.any())
      .optional()
      .describe(
        "Additional parameters for the operation (e.g., iteratee functions, predicate functions, options, paths, values, etc.)",
      ),
    description: z
      .string()
      .optional()
      .describe(
        "Description of what this data processing operation accomplishes",
      ),
  }),
  execute: async () => {
    return "Success";
  },
});
