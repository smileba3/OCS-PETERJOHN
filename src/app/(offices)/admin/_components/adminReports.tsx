'use client';;
import LoadingComponent from '@/components/loading';
import OCSModal from '@/components/ocsModal';
import ParseHTMLTemplate from '@/components/parseHTML';
import OCSTable from '@/components/table';
import { DocumentType, LetterDocument, MemoDocument, Roles, UserDocument } from '@/lib/modelInterfaces';
import { TableColumnProps } from '@/lib/types';
import clsx from 'clsx';
import { Button, EyeOpenIcon, IconButton, PrintIcon, SelectField, SelectMenu, TextInputField } from 'evergreen-ui';
import { useCallback, useEffect, useMemo, useState } from "react";

function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export default function AdminReports() {
  const [doctype, setDoctype] = useState<DocumentType>(DocumentType.Memo)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument|any) & { isPreparedByMe: boolean }>();

  const columns: TableColumnProps[] = useMemo(() => [
    {
      label: "Title", field: "title", sortable: true, searchable: true
    },
    {
      label: "Series", field: "series", sortable: true, searchable: true,
    },
    {
      label: "Department", field: "department", sortable: true, searchable: true, align: 'center',
    },
    {
      label: "Prepared By", field: "preparedBy", sortable: true, searchable: true,
      render(row: any) {
        return getFullName(row.preparedBy);
      }
    },
    {
      label: "Created Date", field: "createdAt", sortable: true, searchable: true,
      render(row: any) {
        return new Date(row.createdAt).toLocaleDateString('en-PH', { year: "numeric", month: "short", day: "numeric", hour12: true, hour: "numeric", minute: "numeric" });
      }
    },
    {
      label: "View", field: "view", sortable: false, searchable: false,
      render(row: any) {
        return <div><IconButton icon={EyeOpenIcon} onClick={() => setSelectedMemo(data.find((item: any) => row._id === item._id))} /></div>
      }
    }
  ], [data]);

  const [selectedDateFrom, setSelectedDateFrom] = useState<string>("");
  const [selectedDateTo, setSelectedDateTo] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<"day"|"month"|"year">("day");
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string[]>([]);
  const [selectedSenderFilter, setSelectedSenderFilter] = useState<string[]>([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string[]>([]);

  // @ts-ignore
  const seriesOptions = useMemo(() => [...new Set(data.map((v: any) => v.series))].map((v) => ({value: v, label: v})), [data]);
  // @ts-ignore
  const senderOptions = useMemo(() => data.map((v) => ({value: v.preparedBy._id as string, label: getFullName(v.preparedBy)})).reduce((caller: any[], item: any) => {
    if (caller.some((v) => v.value === item.value)) {
      return caller;
    }
    return [...caller, item];
  }, []), [data]);

  const departmentOptions = useMemo(() => data.map((v) => ({value: v.departmentId._id as string, label: v.departmentId.name})).reduce((caller: any[], item: any) => {
    if (caller.some((v) => v.value === item.value)) {
      return caller;
    }
    return [...caller, item];
  }, []), [data]);

  const finalData = useMemo(() => (data?.map((r) => ({
    _id: r._id?.toString(),
    title: r.title.toString(),
    series: r.series.toString(),
    department: r.departmentId.name,
    departmentId: r.departmentId._id,
    preparedBy: r.preparedBy as UserDocument,
    createdAt: new Date(r.createdAt)
  })) || []).filter((item) => {
    let rfr, rto, isFiltered = [true];
    if (!!selectedDateFrom || !!selectedDateTo || selectedSenderFilter.length > 0 || selectedSeriesFilter.length > 0) {
      if (selectedDateFrom) {
        rfr = new Date(selectedDateFrom);
        rfr.setHours(0)
        isFiltered.push(
          selectedDateFilter === "day"
          ? (rfr.getTime() <= item.createdAt.getTime())
          : selectedDateFilter === "month"
          ? (Number.parseInt(`${rfr.getMonth()}${rfr.getFullYear()}`) <= Number.parseInt(`${item.createdAt.getMonth()}${item.createdAt.getFullYear()}`))
          : (rfr.getFullYear() <= item.createdAt.getFullYear())
        )
        if (selectedDateTo) {
          rto = new Date(selectedDateTo);
          rto.setHours(23);
          rto.setMinutes(59);
          rto.setSeconds(59);
          isFiltered.push(
            selectedDateFilter === "day"
            ? (rto.getTime() >= item.createdAt.getTime())
            : selectedDateFilter === "month"
            ? (Number.parseInt(`${rto.getMonth()}${rto.getFullYear()}`) >= Number.parseInt(`${item.createdAt.getMonth()}${item.createdAt.getFullYear()}`))
            : (rto.getFullYear() >= item.createdAt.getFullYear())
          );
        }
      } else {
        if (selectedDateTo) {
          rto = new Date(selectedDateTo);
          rto.setHours(23);
          rto.setMinutes(59);
          rto.setSeconds(59);
          isFiltered.push(
            selectedDateFilter === "day"
            ? (rto.getTime() >= item.createdAt.getTime())
            : selectedDateFilter === "month"
            ? (Number.parseInt(`${rto.getMonth()}${rto.getFullYear()}`) >= Number.parseInt(`${item.createdAt.getMonth()}${item.createdAt.getFullYear()}`))
            : (rto.getFullYear() >= item.createdAt.getFullYear())
          );
        }
      }
      if (selectedSeriesFilter.length > 0) {
        isFiltered.push(
          selectedSeriesFilter.some((v: any) => v === item.series)
        )
      }
      if (selectedSenderFilter.length > 0) {
        isFiltered.push(
          selectedSenderFilter.some((v: any) => v === (item.preparedBy as any)._id)
        )
      }
      if (selectedDepartmentFilter.length > 0) {
        isFiltered.push(
          selectedDepartmentFilter.some((v: any) => v === item.departmentId)
        )
      }
    }
    return isFiltered.every((v: boolean) => v === true);
  }), [data, selectedDateFrom, selectedDateTo, selectedDateFilter, selectedSeriesFilter, selectedSenderFilter, selectedDepartmentFilter]);

  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo/approved', window.location.origin)
    url.searchParams.set('doctype', doctype)
    url.searchParams.set('populate', 'preparedBy')
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => { setData(result?.departments); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, []);

  const onPrint = useCallback(() => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('type', "report")
    url.searchParams.set('role', Roles.Admin)
    url.searchParams.set('title', doctype.toUpperCase() + " REPORTS")
    if (!!selectedDateFrom) {
      url.searchParams.set('rfrom', selectedDateFrom);
    }
    if (!!selectedDateTo) {
      url.searchParams.set('rto', selectedDateTo);
    }
    if (!!selectedDateFilter) {
      url.searchParams.set('rfilter', selectedDateFilter);
    }
    if (selectedSeriesFilter.length > 0) {
      url.searchParams.set('series', selectedSeriesFilter.join(","));
    }
    if (selectedSenderFilter.length > 0) {
      url.searchParams.set('senders', selectedSenderFilter.join(","));
    }
    if (selectedDepartmentFilter.length > 0) {
      url.searchParams.set('departments', selectedDepartmentFilter.join(","));
    }
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype, selectedDateFrom, selectedDateTo, selectedDateFilter, selectedSeriesFilter, selectedSenderFilter, selectedDepartmentFilter]);

  const onPrintDocument = useCallback(() => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    url.searchParams.set('role', Roles.Admin)
    url.searchParams.set('title', selectedMemo?.title!)
    if (selectedMemo?.userId) {
      url.searchParams.set('isForIndividual', 'true');
    }
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype, selectedMemo])

  const onBack = useCallback(() => {
    setSelectedMemo(undefined);
  }, [])

  return (<>
    {loading && <LoadingComponent />}
    {!loading && (
    <div className="m-6 p-4">
      <h1 className="text-xl font-semibold mb-2">Reports</h1>
      <OCSTable loading={loading} columns={columns} data={finalData} searchable toolbars={[
        (<div key={"adminsreporttoolbar"} className="flex flex-nowrap gap-x-2 justify-end items-center">
          <TextInputField type="date" maxWidth={130} description="From" onChange={(e: any) => setSelectedDateFrom(e.target.value)}/>
          <TextInputField type="date" maxWidth={130} description="To" onChange={(e: any) => setSelectedDateTo(e.target.value)} />
          <SelectField maxWidth={100} minWidth={100}  onChange={e => setSelectedDateFilter(e.target.value as any)} description="Filter Range:  ">
            <option value="day">By Days</option>
            <option value="month">By Months</option>
            <option value="year">By Years</option>
          </SelectField>
          <div className="ub-mb_24px ub-max-w_100px ub-min-w_100px ub-box-szg_border-box">
            <div className="ub-dspl_flex ub-flx-drct_column ub-mb_8px ub-box-szg_border-box">
              <p id="SelectField-4__description" className="ub-fnt-fam_b77syt ub-color_696f8c ub-mt_4px ub-mb_0px ub-fnt-sze_12px ub-f-wght_400 ub-ln-ht_18px ub-ltr-spc_0 ub-box-szg_border-box">Filter Series:  </p>
            </div>
            <div className="ub-dspl_inline-flex ub-flx_1 ub-pst_relative ub-w_100prcnt ub-h_32px ub-box-szg_border-box">
              <SelectMenu
                isMultiSelect
                title="Filter Series"
                options={seriesOptions}
                selected={selectedSeriesFilter}
                onSelect={(item: any) => setSelectedSeriesFilter([...selectedSeriesFilter, item.value])}
                onDeselect={(item: any) => {
                  const ind = selectedSeriesFilter.indexOf(item.value);
                  const sel = selectedSeriesFilter.filter((_, i) => i !== ind)
                  setSelectedSeriesFilter(sel);
                }}
              >
                <Button minWidth={100} maxWidth={100}>{selectedSeriesFilter.length === 0 ? '--' : (selectedSeriesFilter.length === 1 ? selectedSeriesFilter[0]?.substring(0, 10) + "..." : `${selectedSeriesFilter.length} filtered`)}</Button>
              </SelectMenu>
                {/* <svg class="ub-fill_696f8c ub-pst_absolute ub-top_50prcnt ub-mt_-7px ub-rgt_8px ub-ptr-evts_none ub-w_14px ub-h_14px ub-box-szg_border-box" data-icon="caret-down" viewBox="0 0 16 16"><path d="M12 6.5c0-.28-.22-.5-.5-.5h-7a.495.495 0 00-.37.83l3.5 4c.09.1.22.17.37.17s.28-.07.37-.17l3.5-4c.08-.09.13-.2.13-.33z" fill-rule="evenodd"></path></svg> */}
            </div>
          </div>
          <div className="ub-mb_24px ub-max-w_100px ub-min-w_100px ub-box-szg_border-box">
            <div className="ub-dspl_flex ub-flx-drct_column ub-mb_8px ub-box-szg_border-box">
              <p id="SelectField-5__description" className="ub-fnt-fam_b77syt ub-color_696f8c ub-mt_4px ub-mb_0px ub-fnt-sze_12px ub-f-wght_400 ub-ln-ht_18px ub-ltr-spc_0 ub-box-szg_border-box">Filter Prepared By:  </p>
            </div>
            <div className="ub-dspl_inline-flex ub-flx_1 ub-pst_relative ub-w_100prcnt ub-h_32px ub-box-szg_border-box">
              <SelectMenu
                isMultiSelect
                title="Filter Prepared By"
                options={senderOptions as any}
                selected={selectedSenderFilter}
                onSelect={(item: any) => setSelectedSenderFilter([...selectedSenderFilter, item.value])}
                onDeselect={(item: any) => {
                  const ind = selectedSenderFilter.indexOf(item.value);
                  const sel = selectedSenderFilter.filter((_, i) => i !== ind)
                  setSelectedSenderFilter(sel);
                }}
              >
                <Button minWidth={100} maxWidth={100}>{selectedSenderFilter.length === 0 ? '--' : (selectedSenderFilter.length === 1 ? senderOptions.find((v) => v.value === selectedSenderFilter[0])?.label?.substring(0, 10) + "..." : `${selectedSenderFilter.length} filtered`)}</Button>
              </SelectMenu>
            </div>
          </div>
          <div className="ub-mb_24px ub-max-w_100px ub-min-w_100px ub-box-szg_border-box">
            <div className="ub-dspl_flex ub-flx-drct_column ub-mb_8px ub-box-szg_border-box">
              <p id="SelectField-6__description" className="ub-fnt-fam_b77syt ub-color_696f8c ub-mt_4px ub-mb_0px ub-fnt-sze_12px ub-f-wght_400 ub-ln-ht_18px ub-ltr-spc_0 ub-box-szg_border-box">Filter Department:  </p>
            </div>
            <div className="ub-dspl_inline-flex ub-flx_1 ub-pst_relative ub-w_100prcnt ub-h_32px ub-box-szg_border-box">
              <SelectMenu
                isMultiSelect
                title="Filter Department"
                options={departmentOptions as any}
                selected={selectedDepartmentFilter}
                onSelect={(item: any) => setSelectedDepartmentFilter([...selectedDepartmentFilter, item.value])}
                onDeselect={(item: any) => {
                  const ind = selectedDepartmentFilter.indexOf(item.value);
                  const sel = selectedDepartmentFilter.filter((_, i) => i !== ind)
                  setSelectedDepartmentFilter(sel);
                }}
              >
                <Button minWidth={100} maxWidth={100}>{selectedDepartmentFilter.length === 0 ? '--' : (selectedDepartmentFilter.length === 1 ? departmentOptions.find((v) => v.value === selectedDepartmentFilter[0])?.label?.substring(0, 10) + "..." : `${selectedDepartmentFilter.length} filtered`)}</Button>
              </SelectMenu>
            </div>
          </div>
          <button type="button" onClick={() => onPrint()} disabled={finalData.length === 0} className="disabled:bg-gray-300 disabled:border-gray-300 disabled:text-white bg-slate-100 text-blue-500 border border-blue-500 font-[600] px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white" >
            <PrintIcon display="inline" marginRight={4} size={12} />Print
          </button>
        </div>),
        ]} />
    </div>
    )}
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate isForIndividual={!!selectedMemo?.userId} role={Roles.Admin} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-between items-center gap-x-3 pr-2">
        <div className="flex items-center justify-start gap-x-3">
        </div>
        <div className="flex items-center justify-end gap-x-3">
          <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onPrintDocument}><PrintIcon display="inline" /> Print</button>
          <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={onBack}>Close</button>
        </div>
      </div>
    </OCSModal>
  </>)
}