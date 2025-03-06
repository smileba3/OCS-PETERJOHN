'use client';
import { SortDirection, TableColumnProps } from '@/lib/types';
import clsx from 'clsx';
import { SearchIcon } from 'evergreen-ui';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import SortButton from './sortButton';

function Toolbars({ columnCount, toolbars = [] }: { columnCount: number, toolbars: React.ReactElement[] }) {
  return toolbars.length > 0 && (
    <tr className="">
      <td colSpan={columnCount} className="px-4">
        <div className="flex flex-nowarp py-2 justify-between gap-x-2 w-full">
          {toolbars.map((toolbar, index) => (
            <Fragment key={index}>
              {toolbar}
            </Fragment>
          ))}
        </div>
      </td>
    </tr>
  )
}

export default function OCSTable({ data = [], columns = [], loading = false, sortedBy, sortedDirection, searchable = false, searchString = "", toolbars = [], onSearch = (search: string) => {}, onSort = (sortBy: any) => {}, onSortDirection = (sortDirection: SortDirection) => {} }: Readonly<{ data: any[], columns: TableColumnProps[], loading?: boolean, sortedBy?: any, sortedDirection?: SortDirection, searchable?: boolean, searchString?: string, toolbars?: React.ReactElement[], onSearch?: (search: string) => void, onSort?: (sortBy: any) => void, onSortDirection?: (sortDirection: SortDirection) => void }>) {
  const [search, setSearch] = useState(searchString)
  const [sortBy, setSortedBy] = useState<string>(sortedBy || columns?.[0]?.field || "");
  const [sortDirection, setSortDirection] = useState<SortDirection>(sortedDirection || "asc");
  const filteredData = useMemo(() => data.filter((item) => (
    Object.keys(item).some((key) => {
      const col = columns.find((col) => col.field === key)
      return col?.searchable ? (
        ((typeof item[key] === "string" || typeof item[key] === "number") && ((col.searchMap && Object.hasOwn(col.searchMap, item[key]?.toString() || '')) ? col.searchMap[item[key]]?.toString().toLowerCase().includes(search.trimStart().toLowerCase()) : item[key].toString().trimStart().toString().toLowerCase().includes(search.trimStart().toLowerCase())))
        || (typeof item[key] === "boolean" && ((col.searchMap && Object.hasOwn(col.searchMap, item[key] ? "true" : "false")) ? col.searchMap[item[key] ? "true" : "false"]?.toString().toLowerCase().includes(search.trimStart().toLowerCase()) : item[key] === Boolean(search.trimStart().toLowerCase())))
        || (item[key] instanceof Date && item[key].toISOString().toLowerCase().includes(search.trimStart().toLowerCase()))
        || (item[key] instanceof Date && item[key].toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' }).includes(search.trimStart().toLowerCase()))
        || (search.trimStart().startsWith('>') && typeof item[key] === "number" && item[key] > parseFloat(search.trimStart().slice(1)))
        || (search.trimStart().startsWith('<') && typeof item[key] === "number" && item[key] < parseFloat(search.trimStart().slice(1)))
        || (search.trimStart().startsWith('>=') && typeof item[key] === "number" && item[key] >= parseFloat(search.trimStart().slice(2)))
        || (search.trimStart().startsWith('<=') && typeof item[key] === "number" && item[key] <= parseFloat(search.trimStart().slice(2)))
        || (search.trimStart().startsWith('!=') && item[key].toString().trimStart().toLowerCase() !== search.trimStart().slice(2).toLowerCase())
        || (!!col.label && typeof item[key] === "number" && search.toLowerCase().startsWith(col.label.toLowerCase()) && search.slice(col.label.length).trimStart().startsWith('>') && item[key] > parseFloat(search.slice(col.label.length).trimStart().substring(1)))
        || (!!col.label && typeof item[key] === "number" && search.toLowerCase().startsWith(col.label.toLowerCase()) && search.slice(col.label.length).trimStart().startsWith('<') && item[key] < parseFloat(search.slice(col.label.length).trimStart().substring(1)))
        || (!!col.label && typeof item[key] === "number" && search.toLowerCase().startsWith(col.label.toLowerCase()) && search.slice(col.label.length).trimStart().startsWith('>=') && item[key] >= parseFloat(search.slice(col.label.length).trimStart().substring(2)))
        || (!!col.label && typeof item[key] === "number" && search.toLowerCase().startsWith(col.label.toLowerCase()) && search.slice(col.label.length).trimStart().startsWith('<=') && item[key] <= parseFloat(search.slice(col.label.length).trimStart().substring(2)))
        || (!!col.label && search.trimStart().toLowerCase().startsWith(col.label.toLowerCase()) && search.trimStart().slice(col.label.length).trimStart().startsWith('!=') && item[key].toString().trimStart().toLowerCase() != search.trimStart().slice(col.label.length).trimStart().substring(2).trimStart().toLowerCase())
        || (!!col.label && search.trimStart().toLowerCase().startsWith(col.label.toLowerCase()) && search.trimStart().slice(col.label.length).trimStart().startsWith('==') && item[key].toString().trimStart().toLowerCase() == search.trimStart().slice(col.label.length).trimStart().substring(2).trimStart().toLowerCase())
      ): false;
    }
  ))), [columns, data, search])
  const sortedData = useMemo(() => [...filteredData].sort((a: any, b: any) => {
    if (typeof (a[sortBy]) === "string" && typeof (b[sortBy]) === "string") {
      return sortDirection === "asc" ? a[sortBy].localeCompare(b[sortBy].toString()) : b[sortBy].localeCompare(a[sortBy].toString());
    }
    if (typeof (a[sortBy]) === "number" && typeof (b[sortBy]) === "number") {
      return sortDirection === "asc"? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy];
    }
    if (typeof (a[sortBy]) === "boolean" && typeof (b[sortBy]) === "boolean") {
      return (sortDirection === "asc" ? -1 : 1) * (a[sortBy] === true ? -1 : 1);
    }
    return 0;
  }), [filteredData, sortBy, sortDirection]);

  useEffect(() => {
    if (sortedBy) {
      setSortedBy(sortedBy);
    }
    if (sortedDirection) {
      setSortDirection(sortedDirection);
    }
  }, [data, sortedBy, sortedDirection]);

  useEffect(() => {
    onSort && onSort(sortBy);
    onSortDirection && onSortDirection(sortDirection);
  }, [sortBy, sortDirection, onSort, onSortDirection]);

  useEffect(() => {
    setSearch(searchString);
  }, [searchString]);

  useEffect(() => {
    onSearch && onSearch(search);
  }, [search, onSearch]);

  const toggleSort = useCallback((field: any) => {
    if (sortBy === field) {
      const direction = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(direction);
      onSortDirection(direction)
    } else {
      setSortedBy(field);
      setSortDirection("asc");
    }
  }, [sortBy, sortDirection, onSortDirection]);

  const tools = useMemo<React.ReactElement[]>(() => searchable ? [
      <div key={"search_1"} className="max-w-64 inline-flex items-center">
        <div className="relative max-w-64">
          <input
            className="appearance-none w-full bg-transparent border border-gray-300 text-gray-700 rounded-md py-2 px-4 block pl-8"
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SearchIcon position="absolute" left={10} top={8} color={"gray"} />
        </div>
      </div>,
      ...toolbars
    ] : toolbars
  , [searchable, search, toolbars]);

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="text-xs w-full text-gray-700">
        <thead>
          <Toolbars columnCount={columns.length} toolbars={tools} />
          <tr className="bg-[#004aad] text-white uppercase">
            { columns.map((col, i: number) => (
              <th key={col + "_" + i} scope="col" className="px-6 py-3">
                <div
                  className={
                    clsx(
                      "flex items-center cursor-pointer",
                      sortBy === col.field ? 'text-yellow-200' : '',
                      "justify-" + (col.align || "left")
                    )
                  }
                  onClick={() => col.sortable && toggleSort(col.field as any)}
                >
                  {col.label}
                  {col.sortable && <SortButton direction={col.field !== sortBy ? 'both' : sortDirection === 'asc' ? 'down' : 'up'} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          { sortedData.map((item: any, index: number) => (
            <tr key={index} className="bg-white border-b hover:bg-gray-50">
              {columns.map((col: any, i: number) => (
                <td
                  key={item._id + "_" + i}
                  scope="row"
                  className={
                    clsx(
                      "px-6 py-4 font-medium text-gray-900 whitespace-nowrap",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      (col.align === "left" || !col.align) && "text-left",
                    )
                  }
                >
                  {col.render?.call(null, item) || (typeof item[col.field] !== "number" && !item[col.field] ? "" : item[col.field])}
                </td>
              ))}
            </tr>
          ))}
          { sortedData.length === 0 && !loading && (
            <tr className="bg-white border-b hover:bg-gray-50">
              <td scope="row" colSpan={columns.length} className="py-4 font-medium text-gray-500 whitespace-nowrap text-center text-lg">No Data</td>
            </tr>
          )}
          { sortedData.length === 0 && loading && (
            <tr className="bg-white border-b hover:bg-gray-50">
              <td scope="row" colSpan={columns.length} className="py-4 font-medium text-gray-500 whitespace-nowrap text-center text-lg">Loading...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}