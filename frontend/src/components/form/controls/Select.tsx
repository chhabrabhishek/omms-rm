import { Box, Button, useMultiStyleConfig } from "@chakra-ui/react"
import {
  CreatableSelect as ReactCreatableSelect,
  MenuListProps,
  OptionProps,
  Select as ReactSelect,
  createFilter,
  chakraComponents,
} from "chakra-react-select"
import React, { useMemo, useState } from "react"
import { FieldValues, useController } from "react-hook-form"

// The default option component adds event listeners for hover effect which makes it slow.
// https://github.com/JedWatson/react-select/issues/3128#issuecomment-451936743
function CustomOption<O>(props: OptionProps<O>) {
  const { onMouseMove, onMouseOver, ...rest } = props.innerProps

  const updatedProps = {
    ...props,
    innerProps: rest,
  }

  // TODO: What is the actual type of defaultMenuItemStyle?
  const defaultMenuItemStyle: any = useMultiStyleConfig("Menu").item

  return (
    <chakraComponents.Option
      {...updatedProps}
      selectProps={{
        ...updatedProps.selectProps,
        chakraStyles: {
          option: (initialSx) => ({
            ...initialSx,
            // Apply the hover styling using CSS instead.
            _hover: defaultMenuItemStyle._focus,
          }),
        },
      }}
    />
  )
}

// Do not render all the results, instead, show the first few and render a "Show all" button.
// https://github.com/JedWatson/react-select/issues/3128#issuecomment-536697376
function CustomMenuList<O>(props: MenuListProps<O>) {
  const [showAll, setShowAll] = useState(false)

  const children = useMemo(() => {
    return React.Children.toArray(props.children)
  }, [props.children])

  const cutoff = !showAll && children.length > 50

  return (
    <chakraComponents.MenuList {...props}>
      {cutoff ? children.slice(0, 50) : props.children}
      {cutoff && (
        <Box mx="2">
          <Button w="full" variant="ghost" fontWeight="normal" onClick={() => setShowAll(true)}>
            Show all results
          </Button>
        </Box>
      )}
    </chakraComponents.MenuList>
  )
}

// The upstream chakra-react-select component is really slow when you have more than a couple of options.
// This components applies various optimizations to make it perform fast enough in most cases.
// https://github.com/JedWatson/react-select/issues/3128
export function AppSelect<
  O,
  B extends typeof ReactSelect | typeof ReactCreatableSelect,
  M extends boolean = false,
  P = B extends typeof ReactSelect
    ? Parameters<typeof ReactSelect<O, M>>[0]
    : Parameters<typeof ReactCreatableSelect<O, M>>[0],
  R extends
    | Parameters<typeof ReactSelect<O, M>>[0]["ref"]
    | Parameters<typeof ReactCreatableSelect<O, M>>[0]["ref"] = B extends typeof ReactSelect
    ? Parameters<typeof ReactSelect<O, M>>[0]["ref"]
    : Parameters<typeof ReactCreatableSelect<O, M>>[0]["ref"]
>(
  props: P & {
    base?: B
    forwardRef?: R
  }
) {
  const { base: Base = ReactSelect } = props

  return (
    <Base
      ref={props.forwardRef}
      variant="filled"
      components={{
        Option: CustomOption,
        MenuList: CustomMenuList,
      }}
      filterOption={createFilter({
        trim: false,
        ignoreCase: true,
        ignoreAccents: true,
      })}
      {...props}
    />
  )
}

// A react-hook-form compatible controller version of Select.
// TODO: Support multi mode as well as single mode.
// TODO: The type of the form field should be checked against D.
export function ControlledAppSelect<
  P extends FieldValues,
  D,
  O extends { value: D },
  C extends boolean,
  B extends typeof ReactCreatableSelect | typeof ReactSelect = C extends true
    ? typeof ReactCreatableSelect
    : typeof ReactSelect
>(
  props: Omit<Parameters<typeof AppSelect<O, B, false>>[0], "base"> & {
    controller: Parameters<typeof useController<P>>[0]
    isCreatable?: C
  }
) {
  const { controller, isCreatable, ...rest } = props

  const { field } = useController<P>(controller)
  // TODO: The type of value should not be any.
  const value = useMemo(() => {
    if (field.value) {
      const selection = props.options
        ?.map((item) => ("options" in item ? item.options : [item]))
        ?.flat()
        ?.find((option) => option.value === field.value)

      if (isCreatable) {
        return (
          selection ?? {
            label: field.value,
            value: field.value,
          }
        )
      } else {
        return selection
      }
    }
  }, [props.options, field.value, isCreatable])

  const base = isCreatable ? ReactCreatableSelect : ReactSelect
  return (
    <AppSelect<O, B, false>
      base={base as B}
      {...rest}
      forwardRef={field.ref}
      name={field.name}
      isMulti={false}
      value={value}
      onBlur={field.onBlur}
      onChange={(item) => {
        if (item) {
          field.onChange(item.value)
        }
      }}
      {...(isCreatable && {
        formatCreateLabel: (value: string) => `Select "${value}"`,
      })}
    />
  )
}

// A react-hook-form compatible controlled version of CreateableSelect.
// TODO: Support single mode as well as multi mode.
// TODO: The type of the form field should be checked against D.
export function ControlledMultiAppSelect<
  P extends FieldValues,
  D,
  O extends { value: D },
  C extends boolean,
  B extends typeof ReactCreatableSelect | typeof ReactSelect = C extends true
    ? typeof ReactCreatableSelect
    : typeof ReactSelect
>(
  props: Omit<Parameters<typeof AppSelect<O, B, true>>[0], "base"> & {
    controller: Parameters<typeof useController<P>>[0]
    isCreatable?: C
  }
) {
  const { controller, isCreatable, ...rest } = props

  const { field } = useController<P>(controller)
  // TODO: The type of value should not be any.
  const value = useMemo(() => {
    if (field.value) {
      const map = new Map<D, O | null>()
      props.options
        ?.map((item) => ("options" in item ? item.options : [item]))
        ?.flat()
        ?.forEach((item) => map.set(item.value, item))

      if (isCreatable) {
        // Because this is a creatable field, we need to use labels for
        // fields that exist, otherwise just use the value.
        return field.value.map((value: D) => {
          return (
            map.get(value) ?? {
              label: value,
              value: value,
            }
          )
        })
      } else {
        return field.value.filter((value: D) => map.has(value)).map((value: D) => map.get(value))
      }
    }
  }, [props.options, field.value, isCreatable])

  const base = isCreatable ? ReactCreatableSelect : ReactSelect
  return (
    <AppSelect<O, B, true>
      base={base as B}
      {...rest}
      forwardRef={field.ref}
      name={field.name}
      isMulti={true}
      value={value}
      onBlur={field.onBlur}
      onChange={(options) => {
        if (options) {
          field.onChange(options.map((option) => option.value))
        }
      }}
      {...(isCreatable && {
        formatCreateLabel: (value: string) => `Add "${value}"`,
      })}
    />
  )
}
