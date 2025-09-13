"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonViewPopup } from "../json-view-popup";
import * as _ from "lodash";

export interface DataProcessingProps {
  operation: string;
  data: any;
  parameters?: Record<string, any>;
  description?: string;
}

export function DataProcessing(props: DataProcessingProps) {
  const { operation, data, parameters } = props;

  // Process data using real lodash functions
  const processedData = React.useMemo(() => {
    try {
      // Validate input data
      if (!data) {
        return { error: "No data provided" };
      }

      // Use real lodash functions
      switch (operation) {
        case "groupBy":
          return _.groupBy(data, parameters?.iteratee);
        case "sortBy":
          return _.sortBy(data, parameters?.iteratee);
        case "filter":
          return _.filter(data, parameters?.predicate);
        case "map":
          return _.map(data, parameters?.iteratee);
        case "sum":
          return _.sumBy(data, parameters?.iteratee);
        case "mean":
          return _.meanBy(data, parameters?.iteratee);
        case "uniq":
          return _.uniq(data);
        case "chunk":
          return _.chunk(data, parameters?.size || 2);
        case "flatten":
          return _.flattenDepth(data, parameters?.depth || 1);
        case "orderBy":
          return _.orderBy(data, parameters?.iteratees, parameters?.orders);
        case "keyBy":
          return _.keyBy(data, parameters?.iteratee);
        case "countBy":
          return _.countBy(data, parameters?.iteratee);
        case "partition":
          return _.partition(data, parameters?.predicate);
        case "sample":
          return _.sample(data);
        case "shuffle":
          return _.shuffle(data);
        case "take":
          return _.take(data, parameters?.n || 1);
        case "drop":
          return _.drop(data, parameters?.n || 1);
        case "compact":
          return _.compact(data);
        case "without":
          return _.without(data, ...((parameters?.values as any[]) || []));
        case "intersection":
          return _.intersection(data, ...((parameters?.arrays as any[]) || []));
        case "union":
          return _.union(data, ...((parameters?.arrays as any[]) || []));
        case "difference":
          return _.difference(data, ...((parameters?.arrays as any[]) || []));
        case "max":
          return _.maxBy(data, parameters?.iteratee);
        case "min":
          return _.minBy(data, parameters?.iteratee);
        case "size":
          return _.size(data);
        case "isEmpty":
          return _.isEmpty(data);
        case "isEqual":
          return _.isEqual(data, parameters?.other);
        case "clone":
          return _.cloneDeep(data);
        case "merge":
          return _.merge(data, ...((parameters?.sources as any[]) || []));
        case "pick":
          return _.pick(data, parameters?.paths);
        case "omit":
          return _.omit(data, parameters?.paths);
        case "keys":
          return _.keys(data);
        case "values":
          return _.values(data);
        case "invert":
          return _.invert(data);
        case "mapKeys":
          return _.mapKeys(data, parameters?.iteratee);
        case "mapValues":
          return _.mapValues(data, parameters?.iteratee);
        case "defaults":
          return _.defaults(data, ...((parameters?.sources as any[]) || []));
        case "defaultsDeep":
          return _.defaultsDeep(
            data,
            ...((parameters?.sources as any[]) || []),
          );
        case "get":
          return _.get(data, parameters?.path);
        case "set":
          return _.set(data, parameters?.path, parameters?.value);
        case "has":
          return _.has(data, parameters?.path);
        case "unset":
          return _.unset(data, parameters?.path);
        case "at":
          return _.at(data, parameters?.paths);
        case "find":
          return _.find(data, parameters?.predicate);
        case "findIndex":
          return _.findIndex(data, parameters?.predicate);
        case "some":
          return _.some(data, parameters?.predicate);
        case "every":
          return _.every(data, parameters?.predicate);
        case "includes":
          return _.includes(data, parameters?.value);
        case "indexOf":
          return _.indexOf(data, parameters?.value);
        case "lastIndexOf":
          return _.lastIndexOf(data, parameters?.value);
        case "reverse":
          return _.reverse([...data]);
        case "join":
          return _.join(data, parameters?.separator || ",");
        case "split":
          return _.split(data, parameters?.separator || "");
        case "trim":
          return _.trim(data, parameters?.chars);
        case "upperCase":
          return _.upperCase(data);
        case "lowerCase":
          return _.lowerCase(data);
        case "capitalize":
          return _.capitalize(data);
        case "camelCase":
          return _.camelCase(data);
        case "kebabCase":
          return _.kebabCase(data);
        case "snakeCase":
          return _.snakeCase(data);
        case "startCase":
          return _.startCase(data);
        case "pad":
          return _.pad(data, parameters?.length, parameters?.chars);
        case "padStart":
          return _.padStart(data, parameters?.length, parameters?.chars);
        case "padEnd":
          return _.padEnd(data, parameters?.length, parameters?.chars);
        case "repeat":
          return _.repeat(data, parameters?.n || 1);
        case "replace":
          return _.replace(data, parameters?.pattern, parameters?.replacement);
        case "words":
          return _.words(data, parameters?.pattern);
        case "debounce":
          return _.debounce(data, parameters?.wait || 0, parameters?.options);
        case "throttle":
          return _.throttle(data, parameters?.wait || 0, parameters?.options);
        case "once":
          return _.once(data);
        case "memoize":
          return _.memoize(data, parameters?.resolver);
        case "curry":
          return _.curry(data, parameters?.arity);
        case "bind":
          return _.bind(
            data,
            parameters?.thisArg,
            ...((parameters?.partials as any[]) || []),
          );
        case "bindKey":
          return _.bindKey(
            data,
            parameters?.key,
            ...((parameters?.partials as any[]) || []),
          );
        case "delay":
          return _.delay(
            data,
            parameters?.wait || 0,
            ...((parameters?.args as any[]) || []),
          );
        case "defer":
          return _.defer(data, ...((parameters?.args as any[]) || []));
        case "attempt":
          return _.attempt(data, ...((parameters?.args as any[]) || []));
        case "before":
          return _.before(data, parameters?.n);
        case "after":
          return _.after(data, parameters?.n);
        case "ary":
          return _.ary(data, parameters?.n);
        case "rearg":
          return _.rearg(data, parameters?.indexes);
        case "rest":
          return _.rest(data, parameters?.start);
        case "spread":
          return _.spread(data, parameters?.start);
        case "unary":
          return _.unary(data);
        case "wrap":
          return _.wrap(data, parameters?.wrapper);
        case "negate":
          return _.negate(data);
        case "conforms":
          return _.conforms(data);
        case "conformsTo":
          return _.conformsTo(data, parameters?.source);
        case "constant":
          return _.constant(data);
        case "identity":
          return _.identity(data);
        case "noop":
          return _.noop();
        case "stubArray":
          return _.stubArray();
        case "stubFalse":
          return _.stubFalse();
        case "stubObject":
          return _.stubObject();
        case "stubString":
          return _.stubString();
        case "stubTrue":
          return _.stubTrue();
        case "times":
          return _.times(parameters?.n || 1, data);
        case "random":
          return _.random(
            parameters?.lower || 0,
            parameters?.upper || 1,
            parameters?.floating,
          );
        case "range":
          return _.range(
            parameters?.start || 0,
            parameters?.end,
            parameters?.step,
          );
        case "rangeRight":
          return _.rangeRight(
            parameters?.start || 0,
            parameters?.end,
            parameters?.step,
          );
        case "inRange":
          return _.inRange(data, parameters?.start || 0, parameters?.end);
        case "clamp":
          return _.clamp(data, parameters?.lower, parameters?.upper);
        case "round":
          return _.round(data, parameters?.precision || 0);
        case "floor":
          return _.floor(data, parameters?.precision || 0);
        case "ceil":
          return _.ceil(data, parameters?.precision || 0);
        case "add":
          return _.add(data, parameters?.augend);
        case "subtract":
          return _.subtract(data, parameters?.subtrahend);
        case "multiply":
          return _.multiply(data, parameters?.multiplier);
        case "divide":
          return _.divide(data, parameters?.divisor);
        case "mean":
          return _.mean(data);
        case "sum":
          return _.sum(data);
        case "max":
          return _.max(data);
        case "min":
          return _.min(data);
        case "maxBy":
          return _.maxBy(data, parameters?.iteratee);
        case "minBy":
          return _.minBy(data, parameters?.iteratee);
        case "sumBy":
          return _.sumBy(data, parameters?.iteratee);
        case "meanBy":
          return _.meanBy(data, parameters?.iteratee);
        case "isArray":
          return _.isArray(data);
        case "isArrayLike":
          return _.isArrayLike(data);
        case "isArrayLikeObject":
          return _.isArrayLikeObject(data);
        case "isBoolean":
          return _.isBoolean(data);
        case "isBuffer":
          return _.isBuffer(data);
        case "isDate":
          return _.isDate(data);
        case "isElement":
          return _.isElement(data);
        case "isError":
          return _.isError(data);
        case "isFinite":
          return _.isFinite(data);
        case "isFunction":
          return _.isFunction(data);
        case "isInteger":
          return _.isInteger(data);
        case "isLength":
          return _.isLength(data);
        case "isMap":
          return _.isMap(data);
        case "isMatch":
          return _.isMatch(data, parameters?.source);
        case "isMatchWith":
          return _.isMatchWith(
            data,
            parameters?.source,
            parameters?.customizer,
          );
        case "isNaN":
          return _.isNaN(data);
        case "isNative":
          return _.isNative(data);
        case "isNil":
          return _.isNil(data);
        case "isNull":
          return _.isNull(data);
        case "isNumber":
          return _.isNumber(data);
        case "isObject":
          return _.isObject(data);
        case "isObjectLike":
          return _.isObjectLike(data);
        case "isPlainObject":
          return _.isPlainObject(data);
        case "isRegExp":
          return _.isRegExp(data);
        case "isSafeInteger":
          return _.isSafeInteger(data);
        case "isSet":
          return _.isSet(data);
        case "isString":
          return _.isString(data);
        case "isSymbol":
          return _.isSymbol(data);
        case "isTypedArray":
          return _.isTypedArray(data);
        case "isUndefined":
          return _.isUndefined(data);
        case "isWeakMap":
          return _.isWeakMap(data);
        case "isWeakSet":
          return _.isWeakSet(data);
        case "toArray":
          return _.toArray(data);
        case "toFinite":
          return _.toFinite(data);
        case "toInteger":
          return _.toInteger(data);
        case "toLength":
          return _.toLength(data);
        case "toNumber":
          return _.toNumber(data);
        case "toPlainObject":
          return _.toPlainObject(data);
        case "toSafeInteger":
          return _.toSafeInteger(data);
        case "toString":
          return _.toString(data);
        default:
          return { error: `Unknown operation: ${operation}` };
      }
    } catch (error) {
      return { error: `Processing failed: ${error}` };
    }
  }, [operation, data, parameters]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Data Processing: {operation}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Operation:</h4>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="font-mono text-sm">
                <div className="text-blue-700 dark:text-blue-300 font-semibold mb-2">
                  _.
                  <span className="text-blue-900 dark:text-blue-100">
                    {operation}
                  </span>
                  (
                </div>
                <div className="ml-4 text-gray-700 dark:text-gray-300">
                  data
                  {parameters && Object.keys(parameters).length > 0 ? "," : ""}
                </div>
                {parameters && Object.keys(parameters).length > 0 && (
                  <div className="ml-4">
                    {Object.entries(parameters).map(([key, value], index) => (
                      <div
                        key={key}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {key}:{" "}
                        {typeof value === "string"
                          ? `"${value}"`
                          : JSON.stringify(value)}
                        {index < Object.entries(parameters).length - 1
                          ? ","
                          : ""}
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-blue-700 dark:text-blue-300">)</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Input:</h4>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">
              <JsonViewPopup data={data} />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Output:</h4>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">
              <JsonViewPopup data={processedData} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
