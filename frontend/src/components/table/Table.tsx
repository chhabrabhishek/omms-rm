import {
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Table,
  TableContainer,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Table as TableInstance,
  getSortedRowModel,
  SortingState,
  SortDirection,
} from "@tanstack/react-table"
import Link from "next/link"
import { CSSProperties, useEffect, useMemo, useState } from "react"
import styles from "./Table.module.css"

interface RowAction<D> {
  label: string
  href?: string
  onClick?: (item: D, index: number) => void
}

type Column<D> = ColumnDef<D> & {
  light?: boolean
  condensed?: boolean
  error?: (item: D) => string | null | undefined
}

export default function DataTable<D extends Record<string, unknown>>(props: {
  rows: D[]
  columns: {
    // This is an internal column. This configuration will be ignored.
    _actions?: Column<D>
  } & {
    // To get the autocomplete hints.
    [key in keyof D]?: Column<D>
  } & {
    [key: string]: Column<D>
  }
  actions?: RowAction<D>[]
  pagination?: {
    size?: number
  }
  borders?: boolean
  onRowClick?: (d: D) => void
  autoResetPageIndex?: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  // Automatically add a column at the end for the actions. This is an imperative
  // operation because props.columns will often be a dynamic value.
  if (props.actions && props.actions.length > 0) {
    props.columns["_actions"] = {
      id: "_actions",
      condensed: true,
      cell: (cell) => (
        <DataTableRowActions
          actions={props.actions!}
          original={cell.row.original}
          index={cell.row.index}
        />
      ),
    }
  }

  // The headless react-table.
  const table = useReactTable({
    state: {
      sorting,
    },
    data: props.rows,
    columns: Object.values(props.columns),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: props.autoResetPageIndex ?? false,
  })

  // Track page size.
  const setPageSize = table.setPageSize
  const pageSize = props.pagination?.size
  useEffect(() => {
    if (pageSize) {
      setPageSize(pageSize)
    }
  }, [setPageSize, pageSize])

  // Styles.
  const condensedStyle: CSSProperties = {
    width: 1,
    whiteSpace: "nowrap",
  }

  const lightStyle: CSSProperties = {
    color: "var(--chakra-colors-gray-400)",
  }

  // Track if pagination is desired and in effect (has at least one page).
  const hasPagination = props.pagination?.size && table.getPageCount() > 1

  return (
    <>
      <TableContainer w="full">
        <Table
          w="full"
          sx={{
            "thead": {
              fontSize: "sm",
              fontWeight: "medium",
            },

            "tr": {
              borderBottom: "default",
              borderCollapse: "collapse",
              cursor: "pointer",
            },
            "tbody tr:last-child": {
              ...(!hasPagination && {
                borderBottom: "none",
              }),
            },
            "tr:hover": {
              ...(props.onRowClick && {
                cursor: "pointer",
              }),
              // TODO: This colors needs to be a constant.
              bg: "#fafaf9",
            },

            "th": {
              px: "4",
              py: "3",
            },
            "td": {
              px: "4",
              py: "3",
              ...(props.borders && {
                borderLeft: "default",
                borderRight: "default",
                borderCollapse: "collapse",
              }),
            },
            "tr td:first-of-type": {
              borderLeft: "none",
            },
            "tr td:last-child": {
              borderRight: "none",
            },
          }}
        >
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      ...(props.columns[header.column.id].condensed && condensedStyle),
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--chakra-space-1)",
                      }}
                      className={
                        header.column.getCanSort() ? "cursor-pointer select-none" : undefined
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      <ColumnSortIndicator direction={header.column.getIsSorted()} />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getPaginationRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => props.onRowClick?.(row.original)}>
                {row.getVisibleCells().map((cell) => {
                  const column = props.columns[cell.column.id]
                  const error = column.error?.(cell.row.original)
                  return (
                    <td
                      key={cell.id}
                      style={{
                        whiteSpace: getWhitespace(column),
                        ...(column.condensed && condensedStyle),
                        ...(column.light && lightStyle),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      {error && (
                        <p
                          style={{
                            whiteSpace: "pre-line",
                            color: "var(--chakra-colors-red-500)",
                            fontSize: "var(--chakra-fontSizes-sm)",
                          }}
                        >
                          {error}
                        </p>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {hasPagination && (
        <Stack
          p="4"
          direction={["column", "column", "row"]}
          justify="space-between"
          align="center"
          spacing="4"
        >
          {/* TODO: Pluralize this value. */}
          <Text>{table.getPageCount()} Pages</Text>
          <DataTablePaginationStrip table={table} />
        </Stack>
      )}
    </>
  )
}

function getWhitespace(column: any) {
  return ["name", "deployed_by", "created_by", "updated_by"].includes(column.id) ? "initial" : "pre"
}

function ColumnSortIndicator(props: { direction: false | SortDirection }) {
  if (props.direction === false) {
    return null
  }

  if (props.direction === "asc") {
    return <Icon as={IconSortAscending} fontSize="md" />
  }

  return <Icon as={IconSortDescending} fontSize="md" />
}

function DataTableRowActions<D extends Record<string, unknown>>(props: {
  index: number
  original: D
  actions: RowAction<D>[]
}) {
  return (
    <div
      style={{
        display: "flex",
        columnGap: 24,
      }}
    >
      {props.actions.map((action, index) => {
        if (action.href) {
          return (
            <Link as="a" key={index} href={action.href} className={styles.action}>
              {action.label}
            </Link>
          )
        } else {
          return (
            <button
              key={index}
              className={styles.action}
              onClick={() => {
                action.onClick?.(props.original, props.index)
              }}
            >
              {action.label}
            </button>
          )
        }
      })}
    </div>
  )
}

function DataTablePaginationStrip<D = unknown>(props: { table: TableInstance<D> }) {
  const tableState = props.table.getState()
  const maxPage = props.table.getPageCount() - 1
  const currentPage = tableState.pagination.pageIndex

  // The half width of the strip.
  // The full width will be 2 * half + 1.
  const half =
    useBreakpointValue<number>(
      {
        base: 1,
        md: 2,
        lg: 3,
      },
      {
        fallback: "md",
      }
    ) ?? 2
  // The numbers to display on the pagination strip.
  const pages = useMemo(() => {
    // In case you are at the start, fill the strip.
    if (currentPage < half) {
      return Array(half * 2 + 1)
        .fill(0)
        .map((_, index) => index)
        .filter((el) => el <= maxPage)
    }

    // In case you are towards the end, fill the strip.
    if (currentPage > maxPage - half) {
      return Array(half * 2 + 1)
        .fill(0)
        .map((_, index) => maxPage - half * 2 + index)
        .filter((el) => el >= 0)
        .filter((el) => el <= maxPage)
    }

    // Otherwise, keep the current page centered.
    return Array(half * 2 + 1)
      .fill(0)
      .map((_, index) => currentPage - half + index)
      .filter((el) => el >= 0)
      .filter((el) => el <= maxPage)
  }, [currentPage, maxPage, half])

  return (
    <HStack>
      <Button
        size="sm"
        variant="ghost"
        fontWeight="medium"
        onClick={() => props.table.setPageIndex(0)}
        isDisabled={!props.table.getCanPreviousPage()}
      >
        First
      </Button>

      <IconButton
        aria-label="previous page"
        icon={<Icon as={IconChevronLeft} />}
        size="sm"
        variant="ghost"
        onClick={() => props.table.previousPage()}
        isDisabled={!props.table.getCanPreviousPage()}
      />

      <ButtonGroup spacing="1">
        {pages.map((page, index) => {
          // Use IconButton instead of a button because we need rounded
          // buttons and the regular ones act weired with padding.
          return (
            <IconButton
              key={`${page}.${index}`}
              aria-label={`page ${page}`}
              icon={<Text>{page + 1}</Text>}
              size="sm"
              fontWeight="medium"
              variant={page === currentPage ? "solid" : "ghost"}
              colorScheme={page === currentPage ? "blue" : "gray"}
              onClick={() => props.table.setPageIndex(page)}
              isRound
            />
          )
        })}
      </ButtonGroup>

      <IconButton
        aria-label="next page"
        icon={<Icon as={IconChevronRight} />}
        size="sm"
        variant="ghost"
        onClick={() => props.table.nextPage()}
        isDisabled={!props.table.getCanNextPage()}
      />

      <Button
        size="sm"
        variant="ghost"
        fontWeight="medium"
        onClick={() => props.table.setPageIndex(maxPage)}
        isDisabled={!props.table.getCanNextPage()}
      >
        Last
      </Button>
    </HStack>
  )
}
