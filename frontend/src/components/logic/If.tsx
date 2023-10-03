/*
  A component to do conditional rendering. Support auto casting the dependent
  data parameter into a non nullable type if it satisfies the truthy condition.
*/
export default function If<V>(props: {
  value: V;
  condition?: (value: V) => boolean;
  then?: (value: NonNullable<V>) => JSX.Element | JSX.Element[];
  else?: () => JSX.Element | JSX.Element[] | false | undefined;
}) {
  const condition = props.condition ?? Boolean;
  return (
    <>{condition(props.value) ? props.then?.(props.value!) : props.else?.()}</>
  );
}
